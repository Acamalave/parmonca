'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Send, Calendar, User, Building2 } from 'lucide-react';
import { cotizaciones } from '@/lib/demo-data';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function CotizacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cot = cotizaciones.find(c => c.id === id);
  if (!cot) return <div className="flex items-center justify-center h-64"><p className="text-[var(--color-text-secondary)]">No encontrada</p></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/cotizaciones" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors"><ArrowLeft size={14} />Volver</Link>

      <div className="glass rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[var(--color-text-primary)] font-display">{cot.numero}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusColor(cot.estado)}`}>{getStatusLabel(cot.estado)}</span>
            </div>
            <p className="text-[var(--color-text-secondary)] text-[13px] mt-0.5 capitalize">Propuesta de {cot.tipo}</p>
          </div>
          <div className="flex gap-1.5">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-glass)]"><Download size={13} />PDF</button>
            {cot.estado === 'borrador' && <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[12px] font-semibold glow-brand-sm"><Send size={13} />Enviar</button>}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { icon: User, label: 'Cliente', value: cot.clienteNombre, link: `/clientes/${cot.clienteId}` },
            { icon: Building2, label: 'Empresa', value: cot.empresaCotizadora },
            { icon: Calendar, label: 'Creada', value: formatDate(cot.creadoEn) },
            { icon: User, label: 'Asesor', value: cot.comercialAsignado },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px]">
              <d.icon size={13} className="text-[var(--color-text-muted)]" />
              <div><p className="text-[10px] text-[var(--color-text-muted)] uppercase">{d.label}</p>
                {d.link ? <Link href={d.link} className="font-medium text-[#E8821C] hover:underline">{d.value}</Link> : <p className="font-medium text-[var(--color-text-secondary)]">{d.value}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--color-border)]"><h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Equipos</h2></div>
        <table className="w-full">
          <thead><tr className="border-b border-[var(--color-border)]">
            {['Modelo','Cantidad','P. Unitario','Total'].map((h,i) => (
              <th key={h} className={`text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-5 py-2 ${i>1?'text-right':'text-left'} ${i===1?'text-center':''}`}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {cot.items.map((item, i) => (
              <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-5 py-3 text-[13px] font-medium text-[var(--color-text-secondary)]">{item.modelo}</td>
                <td className="px-5 py-3 text-[13px] text-center text-[var(--color-text-secondary)]">{item.cantidad}</td>
                <td className="px-5 py-3 text-[13px] text-right text-[var(--color-text-secondary)]">{formatCurrency(item.precioUnitario)}</td>
                <td className="px-5 py-3 text-[13px] text-right font-medium text-[var(--color-text-primary)]">{formatCurrency(item.precioTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 bg-[var(--color-surface-glass)] space-y-1">
          <div className="flex justify-between text-[13px]"><span className="text-[var(--color-text-secondary)]">Subtotal</span><span className="text-[var(--color-text-secondary)]">{formatCurrency(cot.subtotal)}</span></div>
          <div className="flex justify-between text-[13px]"><span className="text-[var(--color-text-secondary)]">Impuesto</span><span className="text-[var(--color-text-secondary)]">{formatCurrency(cot.impuesto)}</span></div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--color-border)]"><span className="text-[var(--color-text-primary)]">Total</span><span className="text-[#E8821C] text-glow">{formatCurrency(cot.total)}</span></div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-3">Condiciones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
          <div><p className="text-[10px] text-[var(--color-text-muted)] uppercase">Pago</p><p className="font-medium text-[var(--color-text-secondary)] mt-0.5">{cot.condicionesPago}</p></div>
          <div><p className="text-[10px] text-[var(--color-text-muted)] uppercase">Validez</p><p className="font-medium text-[var(--color-text-secondary)] mt-0.5">{cot.validezDias} dias</p></div>
          <div><p className="text-[10px] text-[var(--color-text-muted)] uppercase">Markup</p><p className="font-medium text-[var(--color-text-secondary)] mt-0.5">{cot.markup}%</p></div>
        </div>
        {cot.notas && <div className="mt-3 p-3 bg-[var(--color-surface-glass)] rounded-lg border border-[var(--color-border)]"><p className="text-[10px] text-[var(--color-text-muted)] mb-0.5">Notas</p><p className="text-[13px] text-[var(--color-text-secondary)]">{cot.notas}</p></div>}
      </div>
    </div>
  );
}
