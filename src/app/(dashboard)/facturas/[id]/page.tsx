'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, DollarSign } from 'lucide-react';
import { facturas, pagos } from '@/lib/demo-data';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function FacturaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const factura = facturas.find(f => f.id === id);
  if (!factura) return <div className="flex items-center justify-center h-64"><p className="text-[var(--color-text-secondary)]">No encontrada</p></div>;

  const facturaPagos = pagos.filter(p => p.facturaId === id);
  const saldo = factura.total - factura.montoPagado;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/facturas" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors"><ArrowLeft size={14} />Volver</Link>

      <div className="glass rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2"><h1 className="text-lg font-bold text-[var(--color-text-primary)] font-display">{factura.numero}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusColor(factura.estado)}`}>{getStatusLabel(factura.estado)}</span></div>
            <p className="text-[var(--color-text-secondary)] text-[13px] mt-0.5">{factura.clienteNombre}</p>
          </div>
          <div className="flex gap-1.5">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-glass)]"><Download size={13} />PDF</button>
            {factura.estado !== 'pagada' && <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold shadow-[0_0_12px_#22C55E30]"><DollarSign size={13} />Registrar Pago</button>}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total', value: formatCurrency(factura.total), color: 'text-[var(--color-text-primary)]' },
            { label: 'Pagado', value: formatCurrency(factura.montoPagado), color: 'text-emerald-400' },
            { label: 'Saldo', value: formatCurrency(saldo), color: 'text-amber-400' },
            { label: 'Vencimiento', value: formatDate(factura.fechaVencimiento), color: 'text-[var(--color-text-secondary)]' },
          ].map(s => (
            <div key={s.label} className="text-center p-2.5 bg-[var(--color-surface-glass)] rounded-lg border border-[var(--color-border)]">
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase">{s.label}</p>
              <p className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border)]"><h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Detalle</h2></div>
        <table className="w-full">
          <thead><tr className="border-b border-[var(--color-border)]">
            {['Modelo','Cantidad','P. Unitario','Total'].map((h,i) => (
              <th key={h} className={`text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-5 py-2 ${i>1?'text-right':''} ${i===1?'text-center':''} text-left`}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {factura.items.map((item, i) => (
              <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-5 py-3 text-[13px] font-medium text-[var(--color-text-secondary)]">{item.modelo}</td>
                <td className="px-5 py-3 text-[13px] text-center text-[var(--color-text-secondary)]">{item.cantidad}</td>
                <td className="px-5 py-3 text-[13px] text-right text-[var(--color-text-secondary)]">{formatCurrency(item.precioUnitario)}</td>
                <td className="px-5 py-3 text-[13px] text-right font-medium text-[var(--color-text-primary)]">{formatCurrency(item.precioTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 bg-[var(--color-surface-glass)]">
          <div className="flex justify-between text-[13px]"><span className="text-[var(--color-text-secondary)]">Subtotal</span><span className="text-[var(--color-text-secondary)]">{formatCurrency(factura.subtotal)}</span></div>
          <div className="flex justify-between text-[13px] mt-1"><span className="text-[var(--color-text-secondary)]">Impuesto</span><span className="text-[var(--color-text-secondary)]">{formatCurrency(factura.impuesto)}</span></div>
          <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-[var(--color-border)]"><span className="text-[var(--color-text-primary)]">Total</span><span className="text-[#E8821C] text-glow">{formatCurrency(factura.total)}</span></div>
        </div>
      </div>

      {facturaPagos.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-3">Pagos Registrados</h2>
          {facturaPagos.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-0">
              <div><p className="text-[13px] font-medium text-[var(--color-text-secondary)]">{p.metodoPago} · {p.referencia}</p><p className="text-[10px] text-[var(--color-text-muted)]">{formatDate(p.fecha)}</p></div>
              <p className="text-[13px] font-bold text-emerald-400">{formatCurrency(p.monto)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
