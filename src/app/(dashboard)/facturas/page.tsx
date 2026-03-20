'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Receipt, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { facturas, pagos } from '@/lib/demo-data';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function FacturasPage() {
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const filtered = facturas.filter(f => {
    const ms = f.numero.toLowerCase().includes(search.toLowerCase()) || f.clienteNombre.toLowerCase().includes(search.toLowerCase());
    const me = filtroEstado === 'todos' || f.estado === filtroEstado;
    return ms && me;
  });

  const totalFacturado = facturas.reduce((a, f) => a + f.total, 0);
  const totalPagado = facturas.reduce((a, f) => a + f.montoPagado, 0);
  const totalVencido = facturas.filter(f => f.estado === 'vencida').reduce((a, f) => a + f.total, 0);
  const totalPendiente = facturas.filter(f => f.estado === 'pendiente').reduce((a, f) => a + f.total, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Facturas</h1>
        <p className="text-sm text-zinc-600 mt-0.5">{facturas.length} facturas</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Facturado', value: formatCurrency(totalFacturado), icon: Receipt, color: 'text-zinc-300', iconBg: 'bg-white/[0.04]' },
          { label: 'Pagado', value: formatCurrency(totalPagado), icon: CheckCircle2, color: 'text-emerald-400', iconBg: 'bg-emerald-500/10' },
          { label: 'Pendiente', value: formatCurrency(totalPendiente), icon: Clock, color: 'text-amber-400', iconBg: 'bg-amber-500/10' },
          { label: 'Vencido', value: formatCurrency(totalVencido), icon: AlertTriangle, color: 'text-red-400', iconBg: 'bg-red-500/10' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 mb-1"><Icon size={11} className={s.color} />{s.label}</div>
              <p className={`text-lg font-bold ${s.color} font-num`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#E8821C]/30 transition-all" />
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-400 focus:outline-none">
          <option value="todos">Todos</option><option value="pendiente">Pendiente</option><option value="pagada">Pagada</option><option value="vencida">Vencida</option>
        </select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/[0.04]">
              {['Numero','Cliente','Total','Pagado','Emision','Vencimiento','Estado'].map((h,i) => (
                <th key={h} className={`text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 px-4 py-2.5 ${i>=2&&i<=3?'text-right':''} ${i===3?'hidden sm:table-cell':''} ${i===4?'hidden md:table-cell':''} ${i===5?'hidden lg:table-cell':''} ${i===6?'text-center':''} text-left`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3"><Link href={`/facturas/${f.id}`} className="text-[13px] font-medium text-[#E8821C] hover:underline">{f.numero}</Link></td>
                  <td className="px-4 py-3 text-[13px] text-zinc-300">{f.clienteNombre}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-white text-right">{formatCurrency(f.total)}</td>
                  <td className="px-4 py-3 text-[13px] text-emerald-400 text-right hidden sm:table-cell">{formatCurrency(f.montoPagado)}</td>
                  <td className="px-4 py-3 text-[13px] text-zinc-600 hidden md:table-cell">{formatDate(f.fechaEmision)}</td>
                  <td className="px-4 py-3 text-[13px] text-zinc-600 hidden lg:table-cell">{formatDate(f.fechaVencimiento)}</td>
                  <td className="px-4 py-3 text-center"><span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusColor(f.estado)}`}>{getStatusLabel(f.estado)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <h2 className="text-[13px] font-semibold text-zinc-300 mb-3">Pagos Recientes</h2>
        <div className="space-y-2">
          {pagos.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
              <div><p className="text-[13px] font-medium text-zinc-300">{p.clienteNombre}</p><p className="text-[11px] text-zinc-600">{p.metodoPago} · {p.referencia}</p></div>
              <div className="text-right"><p className="text-[13px] font-bold text-emerald-400">{formatCurrency(p.monto)}</p><p className="text-[10px] text-zinc-600">{formatDate(p.fecha)}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
