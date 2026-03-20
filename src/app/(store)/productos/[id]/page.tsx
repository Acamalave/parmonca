'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, Plus, Minus, Zap, ArrowRight, ChevronDown } from 'lucide-react';
import { storeProducts, accesorios, Accesorio } from '@/lib/store-data';
import { formatCurrency, cn } from '@/lib/utils';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = storeProducts.find(p => p.slug === id);
  const [selectedAccesorios, setSelectedAccesorios] = useState<string[]>([]);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [cantidad, setCantidad] = useState(1);

  if (!product) return <div className="flex items-center justify-center h-[60vh]"><p className="text-zinc-500">Producto no encontrado</p></div>;

  const toggleAccesorio = (id: string) => {
    setSelectedAccesorios(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const precioAccesorios = accesorios.filter(a => selectedAccesorios.includes(a.id)).reduce((sum, a) => sum + a.precio, 0);
  const precioUnitario = product.precioDesde + precioAccesorios;
  const precioTotal = precioUnitario * cantidad;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/productos" className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-[#E8821C] transition-colors mb-6">
        <ArrowLeft size={14} />Volver al catálogo
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
            className="relative z-10 object-contain max-h-[380px] drop-shadow-[0_20px_50px_rgba(232,130,28,0.12)]"
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
            Especificaciones Técnicas
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
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8821C] mb-1">Personaliza</p>
          <h2 className="font-display text-xl font-bold text-white tracking-tight">Agrega accesorios</h2>
        </div>

        {/* Grouped by category - compact rows */}
        {[
          { cat: 'seguridad', label: 'Seguridad' },
          { cat: 'productividad', label: 'Productividad' },
          { cat: 'proteccion', label: 'Protección' },
          { cat: 'tecnologia', label: 'Tecnología' },
        ].map(({ cat, label }) => {
          const catAccs = accesorios.filter(a => a.categoria === cat);
          return (
            <div key={cat} className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600 mb-2">{label}</p>
              <div className="flex flex-col gap-1.5">
                {catAccs.map((acc) => {
                  const selected = selectedAccesorios.includes(acc.id);
                  return (
                    <div key={acc.id}>
                      <button onClick={() => toggleAccesorio(acc.id)}
                        className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all text-left',
                          selected
                            ? 'bg-[#E8821C]/15 text-[#E8821C] border border-[#E8821C]/30'
                            : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:border-white/[0.12] hover:text-zinc-300')}>
                        <div className={cn('w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all',
                          selected ? 'bg-[#E8821C] border-[#E8821C]' : 'border-zinc-700')}>
                          {selected && <Check size={10} className="text-white" />}
                        </div>
                        <span className="font-medium flex-1">{acc.nombre}</span>
                        <span className={cn('font-num text-[11px]', selected ? 'text-[#E8821C]/70' : 'text-zinc-600')}>
                          +{formatCurrency(acc.precio)}
                        </span>
                        <ChevronDown size={12} className={cn('text-zinc-600 transition-transform', selected && 'rotate-180')} />
                      </button>
                      {selected && (
                        <p className="text-[11px] text-zinc-500 px-9 py-1.5 leading-relaxed">{acc.descripcion}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
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
                Solicitar Cotización
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
