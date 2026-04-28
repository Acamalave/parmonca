'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, AlertCircle, Check, X, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

type FacturaItem = {
  modelo?: string;
  marca?: string;
  categoria?: string;
  cantidad?: number;
  precio_unitario?: number;
  precio_total?: number;
};

type Factura = {
  id: string;
  numero: string;
  cotizacion_id: string | null;
  cliente_id: string | null;
  cliente_nombre: string;
  cliente_email: string | null;
  cliente_empresa: string | null;
  cliente_ruc: string | null;
  items: FacturaItem[];
  subtotal: number | string;
  impuesto: number | string;
  total: number | string;
  monto_pagado: number | string;
  estado: 'borrador' | 'pendiente' | 'pagada' | 'vencida' | 'cancelada';
  fecha_emision: string;
  fecha_vencimiento: string | null;
  asignado_a: string | null;
  notas: string | null;
  created_at: string;
};

type Pago = {
  id: string;
  factura_id: string;
  monto: number | string;
  metodo: 'transferencia' | 'efectivo' | 'cheque' | 'tarjeta' | 'otro';
  referencia: string | null;
  fecha_pago: string;
  notas: string | null;
};

const ESTADO_LABEL: Record<Factura['estado'], string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  pagada: 'Pagada',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
};

const ESTADO_COLOR: Record<Factura['estado'], string> = {
  borrador:  'bg-[var(--color-surface-glass)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
  pendiente: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  pagada:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  vencida:   'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  cancelada: 'bg-[var(--color-surface-glass)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
};

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function FacturaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = useMemo(() => createClient(), []);

  const [factura, setFactura] = useState<Factura | null | undefined>(undefined);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [showPago, setShowPago] = useState(false);

  const reload = async () => {
    const { data: f } = await supabase
      .from('parmonca_facturas')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (!f) { setFactura(null); return; }
    setFactura(f as Factura);
    const { data: ps } = await supabase
      .from('parmonca_pagos')
      .select('*')
      .eq('factura_id', id)
      .order('fecha_pago', { ascending: false });
    setPagos((ps || []) as Pago[]);
  };

  useEffect(() => {
    reload();
    const channel = supabase
      .channel(`factura_${id}_feed`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_facturas', filter: `id=eq.${id}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_pagos', filter: `factura_id=eq.${id}` }, reload)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (factura === undefined) {
    return <div className="flex items-center justify-center h-64"><p className="text-[var(--color-text-muted)] text-sm">Cargando…</p></div>;
  }
  if (!factura) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-[var(--color-text-secondary)]">Factura no encontrada</p>
        <Link href="/facturas" className="text-[13px] text-[#E8821C] hover:underline">Volver al listado</Link>
      </div>
    );
  }

  const total = Number(factura.total);
  const pagado = Number(factura.monto_pagado);
  const saldo = total - pagado;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/facturas" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors">
        <ArrowLeft size={14} />Volver
      </Link>

      {/* Cabecera */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[var(--color-text-primary)] font-display font-mono">{factura.numero}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ESTADO_COLOR[factura.estado]}`}>
                {ESTADO_LABEL[factura.estado]}
              </span>
            </div>
            <p className="text-[var(--color-text-secondary)] text-[13px] mt-1">
              {factura.cliente_empresa || factura.cliente_nombre}
              {factura.cliente_empresa && <span className="text-[var(--color-text-muted)]"> · {factura.cliente_nombre}</span>}
            </p>
            {factura.cotizacion_id && (
              <Link href={`/cotizaciones/${factura.cotizacion_id}`} className="text-[11px] text-[#E8821C] hover:underline mt-1 inline-block">
                Cotización origen →
              </Link>
            )}
          </div>
          {factura.estado !== 'pagada' && factura.estado !== 'cancelada' && (
            <button
              onClick={() => setShowPago(true)}
              className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-[0_0_12px_#22C55E30]"
            >
              <DollarSign size={13} />Registrar pago
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total',       value: formatCurrency(total),  color: 'text-[var(--color-text-primary)]' },
            { label: 'Pagado',      value: formatCurrency(pagado), color: 'text-emerald-400' },
            { label: 'Saldo',       value: formatCurrency(saldo),  color: saldo > 0 ? 'text-amber-400' : 'text-emerald-400' },
            { label: 'Vencimiento', value: fmtDate(factura.fecha_vencimiento), color: 'text-[var(--color-text-secondary)]' },
          ].map(s => (
            <div key={s.label} className="text-center p-2.5 bg-[var(--color-surface-glass)] rounded-lg border border-[var(--color-border)]">
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase">{s.label}</p>
              <p className={`text-sm font-bold mt-0.5 font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {factura.notas && (
          <div className="mt-4 p-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)]">
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Notas</p>
            <p className="text-[13px] text-[var(--color-text-secondary)] whitespace-pre-wrap">{factura.notas}</p>
          </div>
        )}
      </div>

      {/* Detalle de items */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center gap-2">
          <Receipt size={14} className="text-[#E8821C]" />
          <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Detalle de la factura</h2>
        </div>
        {factura.items.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-muted)] text-center py-6">Sin ítems</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-5 py-2 text-left">Producto</th>
                <th className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-5 py-2 text-center">Cant.</th>
                <th className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-5 py-2 text-right">P. Unitario</th>
                <th className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-5 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {factura.items.map((item, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-5 py-3 text-[13px] text-[var(--color-text-secondary)]">
                    <p className="font-medium">{item.modelo || '—'}</p>
                    {item.marca && <p className="text-[11px] text-[var(--color-text-muted)]">{item.marca}{item.categoria ? ` · ${item.categoria}` : ''}</p>}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-center text-[var(--color-text-secondary)] font-mono">{item.cantidad ?? '—'}</td>
                  <td className="px-5 py-3 text-[13px] text-right text-[var(--color-text-secondary)] font-mono">{formatCurrency(Number(item.precio_unitario || 0))}</td>
                  <td className="px-5 py-3 text-[13px] text-right font-medium text-[var(--color-text-primary)] font-mono">{formatCurrency(Number(item.precio_total || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 bg-[var(--color-surface-glass)]">
          <div className="flex justify-between text-[13px]"><span className="text-[var(--color-text-secondary)]">Subtotal</span><span className="text-[var(--color-text-secondary)] font-mono">{formatCurrency(Number(factura.subtotal))}</span></div>
          <div className="flex justify-between text-[13px] mt-1"><span className="text-[var(--color-text-secondary)]">Impuesto</span><span className="text-[var(--color-text-secondary)] font-mono">{formatCurrency(Number(factura.impuesto))}</span></div>
          <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-[var(--color-border)]"><span className="text-[var(--color-text-primary)]">Total</span><span className="text-[#E8821C] text-glow font-mono">{formatCurrency(total)}</span></div>
        </div>
      </div>

      {/* Pagos */}
      <div className="glass rounded-xl p-5">
        <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-3">Pagos registrados</h2>
        {pagos.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-muted)] text-center py-3">
            Aún no hay pagos registrados para esta factura.
          </p>
        ) : (
          <div className="space-y-1">
            {pagos.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-text-secondary)] capitalize">
                    {p.metodo}{p.referencia ? ` · ${p.referencia}` : ''}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{fmtDate(p.fecha_pago)}</p>
                </div>
                <p className="text-[13px] font-bold text-emerald-400 font-mono">{formatCurrency(Number(p.monto))}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPago && (
        <RegistrarPagoModal
          factura={factura}
          saldo={saldo}
          onClose={() => setShowPago(false)}
          onDone={() => { setShowPago(false); reload(); }}
        />
      )}
    </div>
  );
}

function RegistrarPagoModal({
  factura, saldo, onClose, onDone,
}: {
  factura: Factura;
  saldo: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [monto, setMonto] = useState(saldo.toFixed(2));
  const [metodo, setMetodo] = useState<'transferencia' | 'efectivo' | 'cheque' | 'tarjeta' | 'otro'>('transferencia');
  const [referencia, setReferencia] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const m = Number(monto);
    if (!m || m <= 0) { setError('Ingresa un monto válido.'); return; }
    if (m > saldo + 0.01) { setError(`El monto excede el saldo pendiente (${formatCurrency(saldo)}).`); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error: dbErr } = await supabase.from('parmonca_pagos').insert({
      factura_id: factura.id,
      monto: m,
      metodo,
      referencia: referencia.trim() || null,
      fecha_pago: fecha,
      registrado_por: user?.id || null,
    });
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md glass-strong rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)]">Registrar pago</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)]"><X size={16} /></button>
        </div>
        <p className="text-[12px] text-[var(--color-text-muted)] mb-4">
          Factura {factura.numero} · Saldo pendiente: <span className="font-mono text-[var(--color-text-secondary)]">{formatCurrency(saldo)}</span>
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">Monto (USD) *</label>
            <input type="number" step="0.01" min="0.01" max={saldo} required value={monto} onChange={e => setMonto(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[14px] font-mono text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/40" />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">Método</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['transferencia', 'efectivo', 'cheque', 'tarjeta', 'otro'] as const).map(m => (
                <button key={m} type="button" onClick={() => setMetodo(m)}
                  className={`h-9 rounded-lg text-[11px] font-medium capitalize transition-all ${
                    metodo === m
                      ? 'bg-[#E8821C]/10 border border-[#E8821C]/30 text-[#E8821C]'
                      : 'bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">Referencia / nº comprobante</label>
            <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ej: TRF-20260428-001"
              className="w-full h-10 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/40" />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/40" />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[12px]">
              <AlertCircle size={12} className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-1.5">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={13} />Guardar pago</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
