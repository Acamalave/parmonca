'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileClock, User, AlertTriangle, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/lib/supabase/use-profile';
import { isAdmin } from '@/lib/supabase/roles';

type AuditRow = {
  id: number;
  tabla: string;
  accion: 'INSERT' | 'UPDATE' | 'DELETE';
  fila_id: string | null;
  cambios: string[] | null;
  cambiado_por: string | null;
  cambiado_por_rol: string | null;
  cambiado_at: string;
};

const ACCION_COLORS: Record<string, string> = {
  INSERT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  DELETE: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

export default function AuditoriaPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile } = useProfile();
  const userIsAdmin = isAdmin(profile?.rol);

  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tablaFiltro, setTablaFiltro] = useState<string>('todas');
  const [usuarios, setUsuarios] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!userIsAdmin) return;
    (async () => {
      const { data } = await supabase
        .from('parmonca_audit_log')
        .select('id, tabla, accion, fila_id, cambios, cambiado_por, cambiado_por_rol, cambiado_at')
        .order('cambiado_at', { ascending: false })
        .limit(500);
      setRows((data || []) as AuditRow[]);

      // Resolver emails de los usuarios
      const uids = Array.from(new Set((data || []).map(r => r.cambiado_por).filter(Boolean))) as string[];
      if (uids.length > 0) {
        const { data: ps } = await supabase.from('parmonca_profiles').select('id, nombre, email').in('id', uids);
        const m = new Map<string, string>();
        for (const p of (ps || [])) m.set(p.id, p.nombre || p.email);
        setUsuarios(m);
      }
      setLoading(false);
    })();
  }, [supabase, userIsAdmin]);

  if (!userIsAdmin) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-3">
        <AlertTriangle size={32} className="text-amber-400 mx-auto" />
        <p className="text-[var(--color-text-secondary)]">Sólo el super-admin puede acceder a la bitácora de auditoría.</p>
        <Link href="/dashboard" className="text-[13px] text-[#E8821C] hover:underline">Volver al dashboard</Link>
      </div>
    );
  }

  const tablasUnicas = Array.from(new Set(rows.map(r => r.tabla))).sort();
  const filtered = tablaFiltro === 'todas' ? rows : rows.filter(r => r.tabla === tablaFiltro);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <Link href="/herramientas" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C]">
        <ArrowLeft size={14} />Volver a Herramientas
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
            <FileClock size={22} className="text-[#E8821C]" />
            Bitácora de cambios
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Últimos 500 cambios en clientes, cotizaciones, productos, repuestos y perfiles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-[var(--color-text-muted)]" />
          <select
            value={tablaFiltro}
            onChange={e => setTablaFiltro(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[12px] text-[var(--color-text-secondary)] focus:outline-none"
          >
            <option value="todas">Todas las tablas</option>
            {tablasUnicas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-xl p-10 text-center text-[var(--color-text-muted)] text-sm">Cargando bitácora…</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-[var(--color-text-muted)] text-sm">
          Aún no hay movimientos registrados.
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.1em] text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Tabla</th>
                  <th className="px-3 py-2.5">Acción</th>
                  <th className="px-3 py-2.5">Fila</th>
                  <th className="px-3 py-2.5">Por</th>
                  <th className="px-4 py-2.5">Cambios</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-glass)]">
                    <td className="px-4 py-2 text-[var(--color-text-secondary)] whitespace-nowrap font-mono">
                      {new Date(r.cambiado_at).toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-text-secondary)] font-mono text-[11px]">
                      {r.tabla.replace('parmonca_', '')}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${ACCION_COLORS[r.accion] || ''}`}>
                        {r.accion}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--color-text-muted)] font-mono text-[10px] truncate max-w-[140px]" title={r.fila_id || ''}>
                      {r.fila_id || '—'}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                      <div className="flex items-center gap-1.5">
                        <User size={11} className="text-[var(--color-text-muted)]" />
                        <span>{r.cambiado_por ? (usuarios.get(r.cambiado_por) || 'Sistema') : (r.cambiado_por_rol || 'Anónimo')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[var(--color-text-muted)] truncate max-w-[320px]" title={(r.cambios || []).join(', ')}>
                      {r.cambios && r.cambios.length > 0 ? r.cambios.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
