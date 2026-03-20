'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Sparkles } from 'lucide-react';
import { cotizaciones } from '@/lib/demo-data';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function CotizacionesPage() {
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const filtered = cotizaciones.filter(c => {
    const matchSearch = c.numero.toLowerCase().includes(search.toLowerCase()) || c.clienteNombre.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-zinc-600 mt-0.5">{cotizaciones.length} cotizaciones</p>
        </div>
        <Link href="/cotizaciones/nueva" className="flex items-center gap-1.5 h-8 px-3.5 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold rounded-lg transition-all active:scale-[0.97] glow-brand-sm">
          <Sparkles size={13} /><span className="hidden sm:inline">Nueva Cotizacion</span>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por numero o cliente..."
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#E8821C]/30 transition-all" />
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-400 focus:outline-none focus:border-[#E8821C]/30">
          <option value="todos">Todos</option><option value="borrador">Borrador</option><option value="enviada">Enviada</option>
          <option value="en-estudio">En Estudio</option><option value="aceptada">Aceptada</option><option value="rechazada">Rechazada</option>
        </select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Numero','Cliente','Tipo','Asesor','Total','Fecha','Estado'].map((h,i) => (
                  <th key={h} className={`text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 px-4 py-2.5 ${i===2?'hidden sm:table-cell':''} ${i===3?'hidden md:table-cell':''} ${i===5?'hidden lg:table-cell':''} ${i===4?'text-right':''} ${i===6?'text-center':''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cot) => (
                <tr key={cot.id} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3"><Link href={`/cotizaciones/${cot.id}`} className="text-[13px] font-medium text-[#E8821C] hover:underline">{cot.numero}</Link></td>
                  <td className="px-4 py-3 text-[13px] text-zinc-300">{cot.clienteNombre}</td>
                  <td className="px-4 py-3 text-[13px] text-zinc-500 capitalize hidden sm:table-cell">{cot.tipo}</td>
                  <td className="px-4 py-3 text-[13px] text-zinc-500 hidden md:table-cell">{cot.comercialAsignado}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-white text-right">{formatCurrency(cot.total)}</td>
                  <td className="px-4 py-3 text-[13px] text-zinc-600 hidden lg:table-cell">{formatDate(cot.creadoEn)}</td>
                  <td className="px-4 py-3 text-center"><span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusColor(cot.estado)}`}>{getStatusLabel(cot.estado)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
