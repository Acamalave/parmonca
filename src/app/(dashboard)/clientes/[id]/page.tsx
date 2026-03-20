'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, Building2, FileText, Receipt, MessageSquare, Calendar, Sparkles } from 'lucide-react';
import { clientes, cotizaciones, facturas } from '@/lib/demo-data';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getInitials } from '@/lib/utils';

export default function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return <div className="flex items-center justify-center h-64"><p className="text-zinc-500">Cliente no encontrado</p></div>;

  const clienteCotizaciones = cotizaciones.filter(c => c.clienteId === id);
  const clienteFacturas = facturas.filter(f => f.clienteId === id);
  const timeline = [
    ...clienteCotizaciones.map(c => ({ tipo: 'cotizacion' as const, titulo: `Cotizacion ${c.numero}`, detalle: `${c.tipo === 'venta' ? 'Venta' : 'Renta'} — ${formatCurrency(c.total)}`, estado: c.estado, fecha: c.creadoEn, icon: FileText })),
    ...clienteFacturas.map(f => ({ tipo: 'factura' as const, titulo: `Factura ${f.numero}`, detalle: formatCurrency(f.total), estado: f.estado, fecha: f.fechaEmision, icon: Receipt })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Link href="/clientes" className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-[#E8821C] transition-colors">
        <ArrowLeft size={14} />Volver a Clientes
      </Link>

      <div className="glass rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#E8821C] to-[#C96A10] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 glow-brand-sm">
            {getInitials(cliente.nombre)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-white font-display">{cliente.nombre}</h1>
                <p className="text-zinc-500 text-[13px] mt-0.5">{cliente.contactoPrincipal} · {cliente.cargoContacto}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${getStatusColor(cliente.tipo)}`}>{getStatusLabel(cliente.tipo)}</span>
                <Link href="/cotizaciones/nueva" className="px-3 py-1 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 glow-brand-sm">
                  <Sparkles size={11} />Cotizar
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
              <div className="flex items-center gap-2 text-[13px] text-zinc-400"><Mail size={13} className="text-zinc-600" />{cliente.email}</div>
              <div className="flex items-center gap-2 text-[13px] text-zinc-400"><Phone size={13} className="text-zinc-600" />{cliente.telefono}</div>
              <div className="flex items-center gap-2 text-[13px] text-zinc-400"><MapPin size={13} className="text-zinc-600" />{cliente.ciudad}, {cliente.pais}</div>
              <div className="flex items-center gap-2 text-[13px] text-zinc-400"><Building2 size={13} className="text-zinc-600" />{cliente.empresaAsignada} (Markup: {cliente.markup}%)</div>
            </div>
          </div>
        </div>
        {cliente.notas && (
          <div className="mt-4 p-3 bg-white/[0.03] rounded-lg border border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 mb-1"><MessageSquare size={10} />Notas</div>
            <p className="text-[13px] text-zinc-400">{cliente.notas}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Cotizaciones', value: clienteCotizaciones.length, color: 'text-blue-400' },
          { label: 'Facturas', value: clienteFacturas.length, color: 'text-zinc-300' },
          { label: 'Pagado', value: formatCurrency(clienteFacturas.filter(f => f.estado === 'pagada').reduce((a, f) => a + f.total, 0)), color: 'text-emerald-400' },
          { label: 'Por cobrar', value: formatCurrency(clienteFacturas.filter(f => f.estado === 'vencida').reduce((a, f) => a + f.total, 0)), color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color} font-num`}>{s.value}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-5">
        <h2 className="text-[13px] font-semibold text-zinc-300 mb-4">Historial</h2>
        <div className="space-y-3">
          {timeline.length === 0 ? (
            <p className="text-[13px] text-zinc-600 text-center py-8">Sin actividades registradas</p>
          ) : timeline.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.tipo === 'cotizacion' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <Icon size={13} />
                  </div>
                  {i < timeline.length - 1 && <div className="w-px h-full bg-white/[0.04] mt-1" />}
                </div>
                <div className="pb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-zinc-300">{item.titulo}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${getStatusColor(item.estado)}`}>{getStatusLabel(item.estado)}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{item.detalle}</p>
                  <p className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1"><Calendar size={9} />{formatDate(item.fecha)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
