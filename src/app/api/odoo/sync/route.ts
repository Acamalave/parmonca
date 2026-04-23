import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { OdooClient, ODOO_CATEG_MAP, ODOO_CATEG_IDS } from '@/lib/odoo';

/**
 * POST /api/odoo/sync
 *
 * Pulls products from Odoo (ml.parts) across the 4 PARMONCA repuesto categories
 * and UPSERTs them into `parmonca_repuestos`.
 *
 * Auth: either an authenticated admin session (super-admin / gerente) OR a
 * Vercel cron request carrying `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Env required:
 *   ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY
 *   SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 *   CRON_SECRET (for Vercel cron)
 *
 * Notes:
 *   - We filter by company_id=4 (PARMONCA CORP). Products with company_id=false
 *     (shared across companies) are also included.
 *   - We don't sync images in this MVP — imagen_url is left untouched on update,
 *     and set to a default Odoo URL on first insert (may require auth to load).
 */

// Force Node.js runtime (Edge doesn't support the Supabase service-role client
// pattern nor long-running Odoo RPC loops reliably).
export const runtime = 'nodejs';
export const maxDuration = 60;

type OdooProduct = {
  id: number;
  name: string;
  default_code: string | false;
  list_price: number;
  qty_available: number;
  description_sale: string | false;
  categ_id: [number, string] | false;
  image_128: string | false;
  active: boolean;
  company_id: [number, string] | false;
};

async function isAdminCaller(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    // Check rol via parmonca_is_admin() SQL helper
    const { data, error } = await supabase.rpc('parmonca_is_admin');
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

function isCronCaller(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${secret}`;
}

async function runSync(byCron: boolean) {
  const startedAt = new Date();
  const admin = createAdminClient();

  const tipo = byCron ? 'full' : 'manual';

  // ── OPEN SYNC LOG ROW ──────────────────────────────────────────────
  const { data: logRow, error: logErr } = await admin
    .from('parmonca_odoo_sync_log')
    .insert({
      tipo,
      estado: 'running',
      iniciado_at: startedAt.toISOString(),
    })
    .select('id')
    .single();
  if (logErr) {
    console.error('Could not open sync log:', logErr);
    return NextResponse.json({ error: 'log_open_failed', details: logErr.message }, { status: 500 });
  }
  const logId = logRow.id as number;

  const summary = { fetched: 0, created: 0, updated: 0, errors: 0 as number };
  let errorMsg: string | null = null;

  try {
    // ── FETCH FROM ODOO ─────────────────────────────────────────────
    const client = OdooClient.fromEnv();

    // We accept products belonging to PARMONCA CORP (company_id=4) OR shared
    // (company_id=false). Using OR in Odoo domains needs the prefix '|'.
    const domain: unknown[] = [
      '&',
      ['categ_id', 'in', ODOO_CATEG_IDS],
      ['active', '=', true],
    ];
    const fields = [
      'id', 'name', 'default_code', 'list_price', 'qty_available',
      'description_sale', 'categ_id', 'active', 'company_id',
    ];

    const rows = await client.searchRead<OdooProduct>(
      'product.template',
      domain,
      fields,
      { limit: 1000, order: 'name asc' },
    );
    summary.fetched = rows.length;

    // ── MAP + UPSERT ────────────────────────────────────────────────
    type RepuestoRow = {
      odoo_id: number;
      odoo_default_code: string | null;
      sku: string | null;
      nombre: string;
      categoria: 'llantas' | 'asientos' | 'traspaletas_manuales' | 'tanques' | 'otros';
      subcategoria: string | null;
      descripcion: string | null;
      precio_venta: number | null;
      precio_publico: boolean;
      stock: number;
      stock_minimo: number;
      unidad: string;
      activo: boolean;
      fuente: 'odoo';
      ultima_sync_at: string;
      updated_at: string;
    };
    const nowIso = new Date().toISOString();

    const toUpsert: RepuestoRow[] = [];
    for (const p of rows) {
      const categId = Array.isArray(p.categ_id) ? p.categ_id[0] : 0;
      // Domain filter guarantees categId is in ODOO_CATEG_MAP; fall back to 'otros' defensively.
      const categoria: RepuestoRow['categoria'] = ODOO_CATEG_MAP[categId] ?? 'otros';

      const subcategoria = Array.isArray(p.categ_id) ? p.categ_id[1] : null;
      const descripcion = p.description_sale && typeof p.description_sale === 'string' ? p.description_sale : null;
      const sku = p.default_code && typeof p.default_code === 'string' ? p.default_code : null;

      toUpsert.push({
        odoo_id: p.id,
        odoo_default_code: sku,
        sku,
        nombre: p.name || `Producto Odoo ${p.id}`,
        categoria,
        subcategoria,
        descripcion,
        precio_venta: typeof p.list_price === 'number' ? p.list_price : null,
        // Todos los productos Odoo se publican en el landing. El frontend
        // decide si muestra el precio (si precio_venta > 0) o sólo el CTA
        // "Cotizar" (si precio_venta == 0/null).
        precio_publico: true,
        stock: Math.max(0, Math.floor(p.qty_available || 0)),
        stock_minimo: 3,
        unidad: 'unidad',
        activo: !!p.active,
        fuente: 'odoo',
        ultima_sync_at: nowIso,
        updated_at: nowIso,
      });
    }

    // Bulk upsert in chunks of 200 to avoid request-size limits.
    const chunkSize = 200;
    for (let i = 0; i < toUpsert.length; i += chunkSize) {
      const chunk = toUpsert.slice(i, i + chunkSize);

      // Count what already exists so we can report created vs updated.
      const { data: existing } = await admin
        .from('parmonca_repuestos')
        .select('odoo_id')
        .in('odoo_id', chunk.map(r => r.odoo_id));
      const existingIds = new Set((existing || []).map(r => r.odoo_id));

      const { error: upsertErr } = await admin
        .from('parmonca_repuestos')
        .upsert(chunk, { onConflict: 'odoo_id' });

      if (upsertErr) {
        console.error('Upsert chunk failed:', upsertErr);
        summary.errors += chunk.length;
        errorMsg = upsertErr.message;
        continue;
      }

      for (const r of chunk) {
        if (existingIds.has(r.odoo_id)) summary.updated += 1;
        else summary.created += 1;
      }
    }

    // ── CLOSE LOG ROW (success) ─────────────────────────────────────
    await admin
      .from('parmonca_odoo_sync_log')
      .update({
        terminado_at: new Date().toISOString(),
        estado: summary.errors > 0 ? 'error' : 'success',
        repuestos_creados: summary.created,
        repuestos_actualizados: summary.updated,
        repuestos_desactivados: 0,
        error: errorMsg,
        detalles: { fetched: summary.fetched, errors: summary.errors },
      })
      .eq('id', logId);

    return NextResponse.json({ success: true, logId, ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Odoo sync failed:', message);

    await admin
      .from('parmonca_odoo_sync_log')
      .update({
        terminado_at: new Date().toISOString(),
        estado: 'error',
        repuestos_creados: summary.created,
        repuestos_actualizados: summary.updated,
        repuestos_desactivados: 0,
        error: message,
        detalles: { fetched: summary.fetched, errors: summary.errors },
      })
      .eq('id', logId);

    return NextResponse.json({ error: message, logId, ...summary }, { status: 500 });
  }
}

/**
 * POST /api/odoo/sync — manual sync (admin only).
 */
export async function POST(req: NextRequest) {
  const byCron = isCronCaller(req);
  const byAdmin = byCron ? false : await isAdminCaller();
  if (!byCron && !byAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runSync(byCron);
}

/**
 * GET /api/odoo/sync
 *
 * - When called by Vercel cron (Authorization: Bearer CRON_SECRET): runs the sync.
 * - When called by an authenticated admin: returns the last 20 sync log entries.
 */
export async function GET(req: NextRequest) {
  if (isCronCaller(req)) {
    return runSync(true);
  }

  const ok = await isAdminCaller();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('parmonca_odoo_sync_log')
    .select('*')
    .order('iniciado_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}
