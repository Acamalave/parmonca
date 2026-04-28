'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Receipt, AlertTriangle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

type FacturaRow = {
  id: string;
  numero: string;
  cliente_id: string | null;
  cliente_nombre: string;
  cliente_empresa: string | null;
  total: number | string;
  monto_pagado: number | string;
  estado: 'borrador' | 'pendiente' | 'pagada' | 'vencida' | 'cancelada';
  fecha_emision: string;
  fecha_vencimiento: string | null;
  asignado_a: string | null;
  created_at: string;
};

type PagoRow = {
  id: string;
  factura_id: string;
  monto: number | string;
  metodo: string;
  referencia: string | null;
  fecha_pago: string;
};

const ESTADO_LABEL: Record<FacturaRow['estado'], string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  pagada: 'Pagada',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
};

const ESTADO_COLOR: Record<FacturaRow['estado'], string> = {
  borrador:  'bg-[var(--color-surface-glass)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
  pendiente: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  pagada:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  vencida:   'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  cancelada: 'bg-[var(--color-surface-glass)] text-[var(--color-text-muted)] border border-[var(--color-border)] line-through',
};

function fmtDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FacturasPage() {
  const supabase = useMemo(() => createClient(), []);

  const [facturas, setFacturas] = useState<FacturaRow[]>([]);
  const [pagos, setPagos] = useState<PagoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    const reload = async () => {
      const [{ data: fs }, { data: ps }] = await Promise.all([
        supabase.from('parmonca_facturas')
          .select('id, numero, cliente_id, cliente_nombre, cliente_empresa, total, monto_pagado, estado, fecha_emision, fecha_vencimiento, asignado_a, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('parmonca_pagos')
          .select('id, factura_id, monto, metodo, referencia, fecha_pago')
          .order('fecha_pago', { ascending: false })
          .limit(20),
      ]);
      setFacturas((fs || []) as FacturaRow[]);
      setPagos((ps || []) as PagoRow[]);
      setLoading(false);
    };
    reload();

    const channel = supabase
      .channel('facturas_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_facturas' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_pagos' }, reload)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const filtered = facturas.filter(f => {
    const q = search.toLowerCase();
    const ms = !q || f.numero.toLowerCase().includes(q) || f.cliente_nombre.toLowerCase().includes(q) || (f.cliente_empresa || '').toLowerCase().includes(q);
    const me = filtroEstado === 'todos' || f.estado === filtroEstado;
    return ms && me;
  });

  const totalFacturado = facturas.reduce((a, f) => a + Number(f.total), 0);
  const totalPagado = facturas.reduce((a, f) => a + Number(f.monto_pagado), 0);
  const totalVencido = facturas.filter(f => f.estado === 'vencida').reduce((a, f) => a + (Number(f.total) - Number(f.monto_pagado)), 0);
  const totalPendiente = facturas.filter(f => f.estado === 'pendiente').reduce((a, f) => a + (Number(f.total) - Number(f.monto_pagado)), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Facturas</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {loading ? 'Cargando…' : `${facturas.length} facturas registradas`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          En vivo
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Facturado',  value: formatCurrency(totalFacturado),  icon: Receipt,        color: 'text-[var(--color-text-secondary)]' },
          { label: 'Pagado',           value: formatCurrency(totalPagado),     icon: CheckCircle2,   color: 'text-emerald-400' },
          { label: 'Pendiente',        value: formatCurrency(totalPendiente),  icon: Clock,          color: 'text-amber-400' },
          { label: 'Vencido',          value: formatCurrency(totalVencido),    icon: AlertTriangle,  color: 'text-rose-400' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] mb-1">
                <Icon size={11} className={s.color} />{s.label}
              </div>
              <p className={`text-lg font-bold ${s.color} font-num`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por número, cliente o empresa…"
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/30 transition-all" />
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          className="h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] focus:outline-none">
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagada">Pagada</option>
          <option value="vencida">Vencida</option>
          <option value="borrador">Borrador</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {loading ? (
        <div className="glass rounded-xl p-10 text-center text-[var(--color-text-muted)] text-sm">Cargando facturas…</div>
      ) : filtered.length === 0 && facturas.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Receipt size={32} className="text-[var(--color-text-muted)]/40 mx-auto mb-3" />
          <p className="text-[14px] text-[var(--color-text-secondary)]">Aún no hay facturas registradas</p>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1.5 max-w-md mx-auto">
            Las facturas se generan automáticamente al marcar una cotización como ganada (botón <span className="text-[#E8821C]">Facturar</span> en el detalle de la cotización), o se pueden registrar manualmente.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-[var(--color-text-muted)] text-sm">
          Ninguna factura coincide con los filtros.
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  <th className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-4 py-2.5">Número</th>
                  <th className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-4 py-2.5">Cliente</th>
                  <th className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-4 py-2.5 text-right">Total</th>
                  <th className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-4 py-2.5 text-right hidden sm:table-cell">Pagado</th>
                  <th className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-4 py-2.5 hidden md:table-cell">Emisión</th>
                  <th className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-4 py-2.5 hidden lg:table-cell">Vencimiento</th>
                  <th className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-4 py-2.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-glass)] transition-colors">
                    <td className="px-4 py-3"><Link href={`/facturas/${f.id}`} className="text-[13px] font-medium text-[#E8821C] hover:underline font-mono">{f.numero}</Link></td>
                    <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)]">
                      <p className="font-medium">{f.cliente_empresa || f.cliente_nombre}</p>
                      {f.cliente_empresa && <p className="text-[11px] text-[var(--color-text-muted)]">{f.cliente_nombre}</p>}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-[var(--color-text-primary)] text-right font-mono">{formatCurrency(Number(f.total))}</td>
                    <td className="px-4 py-3 text-[13px] text-emerald-400 text-right hidden sm:table-cell font-mono">{formatCurrency(Number(f.monto_pagado))}</td>
                    <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)] hidden md:table-cell">{fmtDate(f.fecha_emision)}</td>
                    <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)] hidden lg:table-cell">{fmtDate(f.fecha_vencimiento)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${ESTADO_COLOR[f.estado]}`}>
                        {ESTADO_LABEL[f.estado]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Pagos recientes</h2>
          <RefreshCw size={11} className="text-[var(--color-text-muted)]" />
        </div>
        {pagos.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-muted)] text-center py-4">
            Cuando se registren pagos aparecerán aquí.
          </p>
        ) : (
          <div className="space-y-2">
            {pagos.map((p) => {
              const factura = facturas.find(f => f.id === p.factura_id);
              return (
                <Link
                  key={p.id}
                  href={`/facturas/${p.factura_id}`}
                  className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-glass)] -mx-2 px-2 rounded-md transition-colors"
                >
                  <div>
                    <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                      {factura?.cliente_empresa || factura?.cliente_nombre || 'Cliente'}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] capitalize">
                      {p.metodo}{p.referencia ? ` · ${p.referencia}` : ''}{factura ? ` · ${factura.numero}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-emerald-400 font-mono">{formatCurrency(Number(p.monto))}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{fmtDate(p.fecha_pago)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
