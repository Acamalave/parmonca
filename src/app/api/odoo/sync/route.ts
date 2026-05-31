import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getOdooInstances, type OdooClient } from '@/lib/odoo';

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
 *   - Images are backfilled lazily: after the metadata upsert, up to
 *     IMAGE_BACKFILL_BATCH products with NULL imagen_url get their image_512
 *     fetched individually from Odoo, uploaded to Supabase Storage
 *     (bucket `parmonca-productos`), and their imagen_url updated.
 */

// Force Node.js runtime (Edge doesn't support the Supabase service-role client
// pattern nor long-running Odoo RPC loops reliably).
export const runtime = 'nodejs';
export const maxDuration = 60;

const IMAGE_BUCKET = 'parmonca-productos';
const IMAGE_BACKFILL_BATCH = 30;

type OdooProduct = {
  id: number;
  name: string;
  default_code: string | false;
  list_price: number;
  qty_available: number;
  description_sale: string | false;
  categ_id: [number, string] | false;
  active: boolean;
  company_id: [number, string] | false;
};

type OdooProductImage = {
  id: number;
  image_512: string | false;
};

// Detect image mime + extension from base64 magic bytes.
// Odoo serves image_512 as base64 of whatever was uploaded (typically PNG or JPEG).
function detectImageFormat(b64: string): { mime: string; ext: string } | null {
  if (b64.startsWith('iVBORw0KGgo')) return { mime: 'image/png', ext: 'png' };
  if (b64.startsWith('/9j/')) return { mime: 'image/jpeg', ext: 'jpg' };
  if (b64.startsWith('R0lGOD')) return { mime: 'image/gif', ext: 'gif' };
  if (b64.startsWith('UklGR')) return { mime: 'image/webp', ext: 'webp' };
  return null;
}

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

/**
 * Si el mismo hash aparece en >= GENERIC_HASH_THRESHOLD productos, lo
 * tratamos como imagen genérica (p. ej. el logo del proveedor que ml.parts
 * pone por defecto cuando un SKU no tiene foto). En ese caso limpiamos el
 * imagen_url de todas las apariciones — la tarjeta vuelve a su versión de
 * texto en vez de mostrar el logo del proveedor.
 */
const GENERIC_HASH_THRESHOLD = 3;

/**
 * Backfill `imagen_url` for up to IMAGE_BACKFILL_BATCH products that don't have
 * an image processed yet. Fetches each one's `image_512` from Odoo, hashes
 * it (md5), uploads to Supabase Storage, updates the row. Auto-detects
 * generic/placeholder images by tracking hash duplication: if a hash appears
 * in 3+ products we mark them all as generic (clear imagen_url, keep hash).
 *
 * Designed to be incremental: each cron run grabs the next batch.
 */
async function backfillImages(
  admin: SupabaseClient,
  client: OdooClient,
  pais: string,
): Promise<{ synced: number; skipped: number; generic: number; errors: number }> {
  const result = { synced: 0, skipped: 0, generic: 0, errors: 0 };

  // "Pending" = nunca procesado: ni imagen_url ni imagen_hash. Los productos
  // ya marcados como genéricos (imagen_hash set, imagen_url null) no entran
  // de nuevo aunque cron corra cada 15 min. Acotado al país de la instancia
  // (odoo_id ya no es único entre instancias).
  const { data: pending, error: pendingErr } = await admin
    .from('parmonca_repuestos')
    .select('odoo_id')
    .eq('pais', pais)
    .is('imagen_url', null)
    .is('imagen_hash', null)
    .not('odoo_id', 'is', null)
    .limit(IMAGE_BACKFILL_BATCH);

  if (pendingErr) {
    console.error('Image backfill: cannot list pending rows:', pendingErr);
    return result;
  }
  if (!pending || pending.length === 0) return result;

  const ids = pending.map(r => r.odoo_id as number);
  let images: OdooProductImage[];
  try {
    images = await client.executeKw<OdooProductImage[]>(
      'product.template',
      'read',
      [ids, ['id', 'image_512']],
    );
  } catch (err) {
    console.error('Image backfill: Odoo read failed:', err);
    result.errors = ids.length;
    return result;
  }

  for (const img of images) {
    if (!img.image_512 || typeof img.image_512 !== 'string') {
      // No image in Odoo. Marca con hash vacío para no re-pedir cada cron.
      const { error: markErr } = await admin
        .from('parmonca_repuestos')
        .update({ imagen_hash: 'no_image' })
        .eq('odoo_id', img.id)
        .eq('pais', pais);
      if (markErr) console.warn(`Image backfill: mark no_image failed for ${img.id}:`, markErr);
      result.skipped += 1;
      continue;
    }
    const fmt = detectImageFormat(img.image_512);
    if (!fmt) {
      console.warn(`Image backfill: unknown format for odoo_id=${img.id}`);
      await admin.from('parmonca_repuestos').update({ imagen_hash: 'unknown_format' }).eq('odoo_id', img.id).eq('pais', pais);
      result.skipped += 1;
      continue;
    }

    const buffer = Buffer.from(img.image_512, 'base64');
    const hash = createHash('md5').update(buffer).digest('hex');

    // ¿Cuántos productos OTRO ya tienen este hash? Si llegamos al umbral,
    // es el logo del proveedor (o equivalente) → marcamos como genérico
    // sin subir el archivo, y limpiamos los duplicados ya subidos.
    const { count: dupCount } = await admin
      .from('parmonca_repuestos')
      .select('odoo_id', { count: 'exact', head: true })
      .eq('pais', pais)
      .eq('imagen_hash', hash)
      .neq('odoo_id', img.id);
    const dups = dupCount ?? 0;

    if (dups + 1 >= GENERIC_HASH_THRESHOLD) {
      // Hash genérico — limpiar a TODOS los que lo comparten (en este país) y
      // marcar éste.
      await admin
        .from('parmonca_repuestos')
        .update({ imagen_url: null, imagen_hash: hash })
        .eq('pais', pais)
        .eq('imagen_hash', hash);
      await admin
        .from('parmonca_repuestos')
        .update({ imagen_url: null, imagen_hash: hash })
        .eq('odoo_id', img.id)
        .eq('pais', pais);
      result.generic += 1;
      continue;
    }

    // Namespaced por país: odoo_id ya no es único entre instancias.
    const path = `repuestos/${pais.toLowerCase()}/${img.id}.${fmt.ext}`;
    const { error: uploadErr } = await admin.storage
      .from(IMAGE_BUCKET)
      .upload(path, buffer, {
        contentType: fmt.mime,
        upsert: true,
        cacheControl: '3600',
      });
    if (uploadErr) {
      console.error(`Image backfill: upload failed for odoo_id=${img.id}:`, uploadErr);
      result.errors += 1;
      continue;
    }

    const { data: publicUrlData } = admin.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(path);
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      console.error(`Image backfill: no public URL for odoo_id=${img.id}`);
      result.errors += 1;
      continue;
    }

    const { error: updateErr } = await admin
      .from('parmonca_repuestos')
      .update({ imagen_url: publicUrl, imagen_hash: hash })
      .eq('odoo_id', img.id)
      .eq('pais', pais);
    if (updateErr) {
      console.error(`Image backfill: row update failed for odoo_id=${img.id}:`, updateErr);
      result.errors += 1;
      continue;
    }

    result.synced += 1;
  }

  return result;
}

async function runSync(byCron: boolean) {
  const startedAt = new Date();
  // For cron runs we need the service-role client (no user session).
  // For admin-triggered runs, the user-session client has RLS write access
  // via parmonca_is_admin(), so service-role is not required.
  let admin: SupabaseClient;
  if (byCron) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'cron_disabled', details: 'SUPABASE_SERVICE_ROLE_KEY is not configured; cron sync is off.' },
        { status: 503 }
      );
    }
    admin = createAdminClient();
  } else {
    admin = await createClient();
  }

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
  const images = { synced: 0, skipped: 0, generic: 0, errors: 0 };
  const porPais: Record<string, { fetched: number; created: number; updated: number; errors: number }> = {};
  let errorMsg: string | null = null;

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
    pais: string;
    moneda: string;
    activo: boolean;
    fuente: 'odoo';
    ultima_sync_at: string;
    updated_at: string;
  };

  try {
    // PARMONCA tiene una instancia de Odoo por país (PA siempre; CR si está
    // configurada). Sincronizamos cada una hacia su propio (pais, moneda).
    const instances = getOdooInstances();

    for (const inst of instances) {
      const stats = { fetched: 0, created: 0, updated: 0, errors: 0 };
      porPais[inst.pais] = stats;

      // Sin categorías mapeadas (p. ej. CR antes de descubrir sus IDs) no
      // traemos nada en vez de traer datos mal categorizados.
      if (inst.categIds.length === 0) {
        console.warn(`Sync ${inst.pais}: sin categorías mapeadas — se omite.`);
        continue;
      }

      try {
        // ── FETCH FROM ODOO ───────────────────────────────────────────
        const domain: unknown[] = [
          '&',
          ['categ_id', 'in', inst.categIds],
          ['active', '=', true],
        ];
        const fields = [
          'id', 'name', 'default_code', 'list_price', 'qty_available',
          'description_sale', 'categ_id', 'active', 'company_id',
        ];

        const rows = await inst.client.searchRead<OdooProduct>(
          'product.template',
          domain,
          fields,
          { limit: 1000, order: 'name asc' },
        );
        stats.fetched = rows.length;
        summary.fetched += rows.length;

        // ── MAP ─────────────────────────────────────────────────────
        const nowIso = new Date().toISOString();
        const toUpsert: RepuestoRow[] = [];
        for (const p of rows) {
          const categId = Array.isArray(p.categ_id) ? p.categ_id[0] : 0;
          // Domain filter guarantees categId is mapped; fall back defensively.
          const categoria: RepuestoRow['categoria'] = inst.categMap[categId] ?? 'otros';

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
            pais: inst.pais,
            moneda: inst.moneda,
            activo: !!p.active,
            fuente: 'odoo',
            ultima_sync_at: nowIso,
            updated_at: nowIso,
          });
        }

        // ── UPSERT (chunked, conflict por (odoo_id, pais)) ───────────
        const chunkSize = 200;
        for (let i = 0; i < toUpsert.length; i += chunkSize) {
          const chunk = toUpsert.slice(i, i + chunkSize);

          // Count what already exists (en este país) para reportar creados vs actualizados.
          const { data: existing } = await admin
            .from('parmonca_repuestos')
            .select('odoo_id')
            .eq('pais', inst.pais)
            .in('odoo_id', chunk.map(r => r.odoo_id));
          const existingIds = new Set((existing || []).map(r => r.odoo_id));

          const { error: upsertErr } = await admin
            .from('parmonca_repuestos')
            .upsert(chunk, { onConflict: 'odoo_id,pais' });

          if (upsertErr) {
            console.error(`Upsert chunk failed (${inst.pais}):`, upsertErr);
            stats.errors += chunk.length;
            summary.errors += chunk.length;
            errorMsg = upsertErr.message;
            continue;
          }

          for (const r of chunk) {
            if (existingIds.has(r.odoo_id)) { stats.updated += 1; summary.updated += 1; }
            else { stats.created += 1; summary.created += 1; }
          }
        }

        // ── BACKFILL IMAGES (incremental, capped, por país) ──────────
        const imgRes = await backfillImages(admin, inst.client, inst.pais);
        images.synced += imgRes.synced;
        images.skipped += imgRes.skipped;
        images.generic += imgRes.generic;
        images.errors += imgRes.errors;
      } catch (instErr) {
        const m = instErr instanceof Error ? instErr.message : String(instErr);
        console.error(`Sync ${inst.pais} failed:`, m);
        stats.errors += 1;
        summary.errors += 1;
        errorMsg = `[${inst.pais}] ${m}`;
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
        detalles: { fetched: summary.fetched, errors: summary.errors, images, porPais },
      })
      .eq('id', logId);

    return NextResponse.json({ success: true, logId, ...summary, images, porPais });
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

  // Admin's user-session client can read logs via RLS (sync_log_admin_read).
  const admin = await createClient();
  const { data, error } = await admin
    .from('parmonca_odoo_sync_log')
    .select('*')
    .order('iniciado_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}
