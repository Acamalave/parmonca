'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';
import { clientes } from '@/lib/demo-data';
import { getStatusColor, getStatusLabel, getInitials } from '@/lib/utils';

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroPais, setFiltroPais] = useState<string>('todos');

  const filtered = clientes.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.contactoPrincipal.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
    const matchPais = filtroPais === 'todos' || c.pais === filtroPais;
    return matchSearch && matchTipo && matchPais;
  });

  const paises = [...new Set(clientes.map(c => c.pais))];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Clientes</h1>
          <p className="text-sm text-zinc-600 mt-0.5">{clientes.length} registros</p>
        </div>
        <button className="flex items-center gap-1.5 h-8 px-3.5 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold rounded-lg transition-all active:scale-[0.97] glow-brand-sm">
          <Plus size={14} />
          <span className="hidden sm:inline">Nuevo Cliente</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, contacto, email..."
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#E8821C]/30 transition-all" />
        </div>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
          className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-400 focus:outline-none focus:border-[#E8821C]/30">
          <option value="todos">Todos</option><option value="customer">Clientes</option><option value="lead">Leads</option>
        </select>
        <select value={filtroPais} onChange={(e) => setFiltroPais(e.target.value)}
          className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-400 focus:outline-none focus:border-[#E8821C]/30">
          <option value="todos">Todos los paises</option>
          {paises.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((cliente) => (
          <Link key={cliente.id} href={`/clientes/${cliente.id}`}
            className="glass rounded-xl p-4 hover:bg-white/[0.04] transition-all group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E8821C]/20 to-[#E8821C]/5 flex items-center justify-center text-[#E8821C] font-bold text-[11px] flex-shrink-0">
                {getInitials(cliente.nombre)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-zinc-200 truncate text-[13px] group-hover:text-[#E8821C] transition-colors">{cliente.nombre}</h3>
                <p className="text-[11px] text-zinc-600 mt-0.5">{cliente.contactoPrincipal} · {cliente.cargoContacto}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusColor(cliente.tipo)}`}>{getStatusLabel(cliente.tipo)}</span>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500"><MapPin size={11} /><span>{cliente.ciudad}, {cliente.pais}</span></div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500"><Mail size={11} /><span className="truncate">{cliente.email}</span></div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500"><Phone size={11} /><span>{cliente.telefono}</span></div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">{cliente.comercialAsignado}</span>
              <span className="text-[10px] text-zinc-600">{cliente.empresaAsignada}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
