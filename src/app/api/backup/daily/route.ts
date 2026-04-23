import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/backup/daily
 *
 * Vercel cron calls this daily. It dumps every parmonca_* table to JSONL
 * (newline-delimited JSON, one row per line — stream-friendly and easy to
 * restore) and uploads the bundle to the private Supabase Storage bucket
 * `parmonca-backups` under `YYYY-MM-DD/<tabla>.jsonl`.
 *
 * Only callable with the correct CRON_SECRET (same secret Vercel cron uses).
 * Auth: Authorization: Bearer <CRON_SECRET>
 *
 * Retention: old dumps stay in storage; can be pruned later with another cron.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

const TABLAS = [
  'parmonca_productos',
  'parmonca_repuestos',
  'parmonca_clientes',
  'parmonca_cotizaciones',
  'parmonca_cotizacion_notas',
  'parmonca_profiles',
  'parmonca_visitantes',
  'parmonca_visitante_eventos',
  'parmonca_odoo_sync_log',
  'parmonca_audit_log',
] as const;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function isCronCaller(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization') || '';
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isCronCaller(req)) return unauthorized();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'service_role_missing' }, { status: 503 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const summary: Record<string, { rows: number; bytes: number; error?: string }> = {};

  for (const tabla of TABLAS) {
    try {
      const { data, error } = await admin.from(tabla).select('*');
      if (error) {
        summary[tabla] = { rows: 0, bytes: 0, error: error.message };
        continue;
      }
      const rows = data || [];
      const body = rows.map(r => JSON.stringify(r)).join('\n');
      const { error: upErr } = await admin.storage
        .from('parmonca-backups')
        .upload(`${today}/${tabla}.jsonl`, new Blob([body], { type: 'application/x-ndjson' }), {
          upsert: true,
          contentType: 'application/x-ndjson',
        });
      if (upErr) {
        summary[tabla] = { rows: rows.length, bytes: body.length, error: upErr.message };
      } else {
        summary[tabla] = { rows: rows.length, bytes: body.length };
      }
    } catch (err) {
      summary[tabla] = { rows: 0, bytes: 0, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // Manifest para facilitar restauración
  const manifest = {
    generated_at: new Date().toISOString(),
    date: today,
    tables: summary,
  };
  await admin.storage
    .from('parmonca-backups')
    .upload(`${today}/_manifest.json`, new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }), {
      upsert: true,
      contentType: 'application/json',
    });

  return NextResponse.json({ success: true, date: today, tables: summary });
}
