'use client';

import { useState } from 'react';
import { Search, Package, Zap } from 'lucide-react';
import { productos, categoriasProducto } from '@/lib/demo-data';
import { formatCurrency, getCategoryLabel } from '@/lib/utils';

export default function CatalogoPage() {
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [marca, setMarca] = useState('todas');

  const filtered = productos.filter(p => {
    const ms = p.modelo.toLowerCase().includes(search.toLowerCase()) || p.descripcion.toLowerCase().includes(search.toLowerCase());
    const mc = categoria === 'todas' || p.categoria === categoria;
    const mm = marca === 'todas' || p.marca === marca;
    return ms && mc && mm;
  });

  const marcas = [...new Set(productos.map(p => p.marca))];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Catalogo</h1>
        <p className="text-sm text-zinc-600 mt-0.5">{productos.length} modelos disponibles</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar modelo..."
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#E8821C]/30 transition-all" />
        </div>
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}
          className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-400 focus:outline-none">
          <option value="todas">Todas las categorias</option>
          {categoriasProducto.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={marca} onChange={(e) => setMarca(e.target.value)}
          className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-400 focus:outline-none">
          <option value="todas">Todas las marcas</option>
          {marcas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((producto) => (
          <div key={producto.id} className="glass rounded-xl overflow-hidden hover:bg-white/[0.04] transition-all group">
            <div className="aspect-[4/3] bg-gradient-to-br from-white/[0.02] to-transparent flex items-center justify-center relative">
              <Package size={48} className="text-zinc-800 group-hover:text-[#E8821C]/20 transition-colors" />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-[#E8821C]/10 border border-[#E8821C]/20">
                <Zap size={9} className="text-[#E8821C]" />
                <span className="text-[9px] font-bold text-[#E8821C] uppercase tracking-wider">{producto.marca}</span>
              </div>
            </div>
            <div className="p-3.5">
              <h3 className="font-bold text-zinc-200 text-[14px] group-hover:text-[#E8821C] transition-colors font-display">{producto.modelo}</h3>
              <p className="text-[10px] text-zinc-600 mt-0.5 uppercase tracking-wider">{getCategoryLabel(producto.categoria)}</p>
              <p className="text-[12px] text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">{producto.descripcion}</p>

              <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="px-2 py-1 bg-white/[0.03] rounded"><span className="text-zinc-600">Motor</span> <span className="text-zinc-400 block font-medium">{producto.motor}</span></div>
                <div className="px-2 py-1 bg-white/[0.03] rounded"><span className="text-zinc-600">Cap.</span> <span className="text-zinc-400 block font-medium">{producto.capacidad}</span></div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-end justify-between">
                <span className="text-lg font-num font-bold text-white">{formatCurrency(producto.precioBase)}</span>
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Base</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
