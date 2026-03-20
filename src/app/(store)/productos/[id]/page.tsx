'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, Plus, Minus, Shield, Wrench, HardHat, Cpu, Zap, ArrowRight, ChevronDown } from 'lucide-react';
import { storeProducts, accesorios, Accesorio } from '@/lib/store-data';
import { formatCurrency, cn } from '@/lib/utils';

const catIcons: Record<string, typeof Shield> = { seguridad: Shield, productividad: Wrench, proteccion: HardHat, tecnologia: Cpu };

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = storeProducts.find(p => p.slug === id);
  const [selectedAccesorios, setSelectedAccesorios] = useState<string[]>([]);
  const [catFilter, setCatFilter] = useState<string>('todos');
  const [specsOpen, setSpecsOpen] = useState(false);
  const [cantidad, setCantidad] = useState(1);

  if (!product) return <div className="flex items-center justify-center h-[60vh]"><p className="text-zinc-500">Producto no encontrado</p></div>;

  const toggleAccesorio = (id: string) => {
    setSelectedAccesorios(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const precioAccesorios = accesorios.filter(a => selectedAccesorios.includes(a.id)).reduce((sum, a) => sum + a.precio, 0);
  const precioUnitario = product.precioDesde + precioAccesorios;
  const precioTotal = precioUnitario * cantidad;

  const filteredAccesorios = catFilter === 'todos' ? accesorios : accesorios.filter(a => a.categoria === catFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/productos" className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-[#E8821C] transition-colors mb-6">
        <ArrowLeft size={14} />Volver al catalogo
      </Link>

      {/* Product Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Image */}
        <div className="relative glass rounded-2xl overflow-hidden flex items-center justify-center min-h-[400px]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8821C]/[0.03] to-transparent" />
          <Image
            src={product.imagen}
            alt={`${product.marca} ${product.modelo}`}
            width={500}
            height={400}
            className="relative z-10 object-contain max-h-[380px] drop-shadow-[0_20px_50px_rgba(232,130,28,0.12)] mix-blend-lighten"
            priority
          />
          {product.badge && (
            <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 text-[10px] font-bold text-[#E8821C] uppercase tracking-wider">
              {product.badge}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E8821C]">{product.marca}</p>
          <h1 className="font-display text-4xl font-bold text-white mt-1 tracking-tight">{product.modelo}</h1>
          <p className="text-zinc-500 text-[13px] mt-1">{product.categoriaLabel} · Capacidad {product.capacidad}</p>
          <p className="text-zinc-400 text-[14px] mt-4 leading-relaxed">{product.descripcion}</p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2 mt-6">
            {product.caracteristicas.map((feat) => (
              <div key={feat} className="flex items-start gap-2">
                <Check size={13} className="text-[#E8821C] mt-0.5 flex-shrink-0" />
                <span className="text-[12px] text-zinc-400">{feat}</span>
              </div>
            ))}
          </div>

          {/* Specs Accordion */}
          <button onClick={() => setSpecsOpen(!specsOpen)}
            className="flex items-center justify-between w-full mt-6 py-3 border-t border-b border-white/[0.06] text-[13px] font-semibold text-zinc-300 hover:text-white transition-colors">
            Especificaciones Tecnicas
            <ChevronDown size={16} className={cn('transition-transform', specsOpen && 'rotate-180')} />
          </button>
          {specsOpen && (
            <div className="grid grid-cols-2 gap-3 py-4">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-[13px] font-medium text-zinc-300 mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="flex items-end justify-between mt-6 pt-4 border-t border-white/[0.06]">
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Precio base</p>
              <p className="font-num text-3xl font-bold text-white mt-0.5">{formatCurrency(product.precioDesde)}</p>
            </div>
            <p className="text-[11px] text-zinc-600">USD · Consultar financiamiento</p>
          </div>
        </div>
      </div>

      {/* Accessories Configurator */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8821C] mb-2">Personaliza tu equipo</p>
          <h2 className="font-display text-2xl font-bold text-white tracking-tight">Accesorios y Complementos</h2>
          <p className="text-zinc-500 text-[13px] mt-1">Selecciona los accesorios para tu configuracion</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {[{ id: 'todos', label: 'Todos' }, { id: 'seguridad', label: 'Seguridad' }, { id: 'productividad', label: 'Productividad' }, { id: 'proteccion', label: 'Proteccion' }, { id: 'tecnologia', label: 'Tecnologia' }].map(c => (
            <button key={c.id} onClick={() => setCatFilter(c.id)}
              className={cn('px-4 py-2 rounded-full text-[12px] font-medium transition-all',
                catFilter === c.id ? 'bg-[#E8821C] text-white glow-brand-sm' : 'bg-white/[0.04] text-zinc-500 hover:text-zinc-300 border border-white/[0.06]')}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredAccesorios.map((acc) => {
            const selected = selectedAccesorios.includes(acc.id);
            const CatIcon = catIcons[acc.categoria] || Shield;
            return (
              <button key={acc.id} onClick={() => toggleAccesorio(acc.id)}
                className={cn('text-left p-4 rounded-xl border transition-all',
                  selected ? 'border-[#E8821C]/40 bg-[#E8821C]/[0.06]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]')}>
                <div className="flex items-start justify-between">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                    selected ? 'bg-[#E8821C] text-white' : 'bg-white/[0.04] text-zinc-500')}>
                    {selected ? <Check size={14} /> : <CatIcon size={14} />}
                  </div>
                  <span className="font-num text-[14px] font-bold text-white">{formatCurrency(acc.precio)}</span>
                </div>
                <h4 className="text-[13px] font-semibold text-zinc-200 mt-3">{acc.nombre}</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{acc.descripcion}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sticky Quote Bar */}
      <div className="sticky bottom-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="glass-strong rounded-t-2xl p-4 sm:p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
            {/* Summary */}
            <div className="flex-1 flex flex-wrap items-center gap-4 sm:gap-6">
              <div>
                <p className="text-[10px] text-zinc-600 uppercase">Equipo</p>
                <p className="text-[13px] font-semibold text-white">{product.marca} {product.modelo}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 uppercase">Accesorios</p>
                <p className="text-[13px] font-semibold text-zinc-300">{selectedAccesorios.length} seleccionados</p>
              </div>
              {/* Quantity */}
              <div className="flex items-center gap-2">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white">
                  <Minus size={12} />
                </button>
                <span className="font-num text-[14px] font-semibold text-white w-6 text-center">{cantidad}</span>
                <button onClick={() => setCantidad(cantidad + 1)}
                  className="w-7 h-7 rounded-md bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white">
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Total + CTA */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] text-zinc-600 uppercase">Total estimado</p>
                <p className="font-num text-2xl font-bold text-white">{formatCurrency(precioTotal)}</p>
              </div>
              <Link href={`/cotizar?producto=${product.slug}&accesorios=${selectedAccesorios.join(',')}&cantidad=${cantidad}`}
                className="flex items-center gap-2 h-11 px-6 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white font-semibold rounded-full hover:shadow-[0_0_25px_#E8821C40] transition-all active:scale-[0.97] group whitespace-nowrap">
                Solicitar Cotizacion
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
