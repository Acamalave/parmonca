'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, ExternalLink, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

type SyncLog = {
  id: number;
  iniciado_at: string;
  terminado_at: string | null;
  tipo: 'full' | 'delta' | 'webhook' | 'manual';
  estado: 'running' | 'success' | 'error';
  repuestos_creados: number | null;
  repuestos_actualizados: number | null;
  repuestos_desactivados: number | null;
  error: string | null;
  detalles: { fetched?: number; errors?: number } | null;
};

export default function OdooSyncPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  async function loadLogs() {
    try {
      const res = await fetch('/api/odoo/sync', { method: 'GET', cache: 'no-store' });
      const json = await res.json();
      if (res.ok && Array.isArray(json.logs)) setLogs(json.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  async function triggerSync() {
    setSyncing(true);
    setToast(null);
    try {
      const res = await fetch('/api/odoo/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setToast({
          kind: 'ok',
          msg: `Sync completo — ${json.fetched} productos, ${json.created} nuevos, ${json.updated} actualizados`,
        });
      } else {
        setToast({ kind: 'err', msg: json.error || 'Error desconocido' });
      }
    } catch (err) {
      setToast({ kind: 'err', msg: err instanceof Error ? err.message : String(err) });
    } finally {
      setSyncing(false);
      loadLogs();
    }
  }

  const lastOk = logs.find(l => l.estado === 'success');

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Integración Odoo</h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
            Sincronización de repuestos desde <span className="font-mono text-[var(--color-text-secondary)]">ml.parts</span>
          </p>
        </div>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className={cn(
            'flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-semibold transition-all',
            syncing
              ? 'bg-[var(--color-surface-glass)] text-[var(--color-text-muted)] cursor-not-allowed'
              : 'bg-gradient-to-r from-[#E8821C] to-[#C96A10] hover:from-[#FF9F43] hover:to-[#E8821C] text-white glow-brand-sm'
          )}
        >
          {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {syncing ? 'Sincronizando…' : 'Sincronizar ahora'}
        </button>
      </div>

      {toast && (
        <div className={cn(
          'rounded-xl border p-3 text-[13px] flex items-start gap-2',
          toast.kind === 'ok'
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
            : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
        )}>
          {toast.kind === 'ok' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Status card */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package size={15} className="text-[#E8821C]" />
          <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Estado de la integración</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="Última sync"
            value={lastOk ? new Date(lastOk.iniciado_at).toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
          />
          <Stat
            label="Productos activos"
            value={lastOk?.detalles?.fetched?.toString() ?? '—'}
          />
          <Stat
            label="Nuevos (última)"
            value={lastOk?.repuestos_creados?.toString() ?? '0'}
            accent="emerald"
          />
          <Stat
            label="Actualizados (última)"
            value={lastOk?.repuestos_actualizados?.toString() ?? '0'}
            accent="brand"
          />
        </div>
        <p className="text-[11px] text-[var(--color-text-muted)] mt-4">
          Categorías sincronizadas: Llantas · Asientos · Traspaletas manuales · Tanques GLP.
          Un cron automático corre cada 15 minutos desde Vercel.
        </p>
      </div>

      {/* History */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Historial de sincronizaciones</h2>
          <a
            href="https://www.ml.parts/odoo/inventory"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-[#E8821C]"
          >
            Abrir Odoo <ExternalLink size={11} />
          </a>
        </div>
        {loading ? (
          <div className="text-[12px] text-[var(--color-text-muted)] py-6 text-center">Cargando…</div>
        ) : logs.length === 0 ? (
          <div className="text-[12px] text-[var(--color-text-muted)] py-6 text-center">
            Aún no hay sincronizaciones. Presiona <strong>Sincronizar ahora</strong> para la primera corrida.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-5 py-2 font-semibold">Fecha</th>
                  <th className="px-3 py-2 font-semibold">Tipo</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold text-right">Fetched</th>
                  <th className="px-3 py-2 font-semibold text-right">Nuevos</th>
                  <th className="px-3 py-2 font-semibold text-right">Actualizados</th>
                  <th className="px-5 py-2 font-semibold">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-5 py-2.5 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {new Date(l.iniciado_at).toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-3 py-2.5 capitalize text-[var(--color-text-muted)]">{l.tipo}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider',
                        l.estado === 'success' && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                        l.estado === 'error' && 'bg-rose-500/10 border-rose-500/20 text-rose-300',
                        l.estado === 'running' && 'bg-amber-500/10 border-amber-500/20 text-amber-300',
                      )}>{l.estado}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[var(--color-text-secondary)]">{l.detalles?.fetched ?? '—'}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-400">{l.repuestos_creados ?? 0}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#E8821C]">{l.repuestos_actualizados ?? 0}</td>
                    <td className="px-5 py-2.5 text-[var(--color-text-muted)] truncate max-w-[240px]" title={l.error || ''}>
                      {l.error || (l.estado === 'success' ? 'OK' : '')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'emerald' | 'brand' }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">{label}</p>
      <p className={cn(
        'font-mono text-[16px] font-bold mt-1',
        accent === 'emerald' && 'text-emerald-400',
        accent === 'brand' && 'text-[#E8821C]',
        !accent && 'text-[var(--color-text-primary)]'
      )}>{value}</p>
    </div>
  );
}
