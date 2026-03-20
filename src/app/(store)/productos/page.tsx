'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, Truck, Battery, ChevronRight } from 'lucide-react';
import { storeProducts } from '@/lib/store-data';
import { formatCurrency } from '@/lib/utils';

export default function ProductosPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Ambient */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-[800px] h-[800px] bg-[#E8821C]/[0.03] rounded-full blur-[200px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#E8821C]/[0.02] rounded-full blur-[150px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 mb-6">
                <Zap size={12} className="text-[#E8821C]" />
                <span className="text-[11px] font-semibold text-[#E8821C] uppercase tracking-wider">Primera plataforma de cotización online</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Tu próximo<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8821C] to-[#FF9F43]">montacarga</span><br />
                está aquí.
              </h1>
              <p className="text-zinc-500 text-lg mt-6 max-w-md leading-relaxed">
                Configura, personaliza y cotiza maquinaria industrial en minutos. Sin intermediarios. Sin esperas.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="#catalogo"
                  className="flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white font-semibold rounded-full hover:shadow-[0_0_30px_#E8821C40] transition-all active:scale-[0.97] group">
                  Explorar Catálogo
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/cotizar"
                  className="flex items-center gap-2 h-12 px-6 border border-white/[0.1] text-zinc-300 font-medium rounded-full hover:bg-white/[0.03] transition-all">
                  Cotizar Ahora
                </Link>
              </div>
              {/* Trust signals */}
              <div className="flex items-center gap-6 mt-10">
                {[
                  { icon: Shield, text: 'Garantía incluida' },
                  { icon: Truck, text: 'Envío a 7 países' },
                  { icon: Battery, text: 'Soporte 24/7' },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <div key={t.text} className="flex items-center gap-1.5">
                      <Icon size={13} className="text-[#E8821C]" />
                      <span className="text-[11px] text-zinc-500">{t.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hero Product Image */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-[#E8821C]/[0.06] to-transparent rounded-3xl blur-[60px]" />
              <div className="relative">
                <Image
                  src="/images/products/tan35d-hero.png"
                  alt="Montacarga ANDINO TAN35D"
                  width={600}
                  height={500}
                  className="relative z-10 drop-shadow-[0_20px_60px_rgba(232,130,28,0.15)]"
                  priority
                />
                <div className="absolute bottom-4 left-4 right-4 glass rounded-xl p-4 z-20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#E8821C] font-semibold uppercase tracking-wider">ANDINO</p>
                      <p className="text-white font-display font-bold text-lg">TAN35D</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500">Desde</p>
                      <p className="text-white font-num font-bold text-lg">$22,000</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog */}
      <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8821C] mb-3">Catalogo</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Maquinaria de clase mundial
          </h2>
          <p className="text-zinc-500 mt-3 max-w-lg mx-auto">
            Cada equipo incluye garantía, soporte técnico y opciones de financiamiento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {storeProducts.map((product) => (
            <Link key={product.id} href={`/productos/${product.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-[#111113] border border-white/[0.08] hover:border-[#E8821C]/30 transition-all duration-500">
              {/* Badge */}
              {product.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-2.5 py-1 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 text-[10px] font-bold text-[#E8821C] uppercase tracking-wider">
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Image */}
              <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden rounded-t-2xl p-6">
                <Image
                  src={product.imagen}
                  alt={`${product.marca} ${product.modelo}`}
                  width={400}
                  height={300}
                  className="object-contain max-w-full max-h-full group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-transparent to-transparent opacity-40" />
              </div>

              {/* Info */}
              <div className="p-5 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#E8821C]">{product.marca}</p>
                    <h3 className="font-display text-xl font-bold text-white mt-0.5">{product.modelo}</h3>
                    <p className="text-[12px] text-zinc-500 mt-0.5">{product.categoriaLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-600">Desde</p>
                    <p className="font-num text-xl font-bold text-white">{formatCurrency(product.precioDesde)}</p>
                  </div>
                </div>

                {/* Quick Specs */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-white/[0.04]">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-zinc-600">Capacidad</p>
                    <p className="text-[13px] font-semibold text-zinc-300 mt-0.5">{product.capacidad}</p>
                  </div>
                  <div className="w-px bg-white/[0.04]" />
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-zinc-600">Motor</p>
                    <p className="text-[13px] font-semibold text-zinc-300 mt-0.5">{product.motor}</p>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04] group-hover:border-[#E8821C]/20 group-hover:bg-[#E8821C]/[0.04] transition-all">
                  <span className="text-[12px] font-semibold text-zinc-400 group-hover:text-[#E8821C] transition-colors">Configurar y Cotizar</span>
                  <ChevronRight size={14} className="text-zinc-600 group-hover:text-[#E8821C] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why PARMONCA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="glass rounded-2xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#E8821C]/[0.03] rounded-full blur-[120px]" />
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8821C] mb-3">Por que PARMONCA</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight max-w-lg">
              La forma inteligente de adquirir maquinaria industrial
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {[
                { num: '01', title: 'Cotiza Online', desc: 'Configura tu equipo y recibe una cotización profesional en minutos' },
                { num: '02', title: 'Personaliza', desc: 'Agrega accesorios de seguridad, productividad y tecnologia' },
                { num: '03', title: 'Financiamiento', desc: 'Opciones flexibles de pago adaptadas a tu operación' },
                { num: '04', title: 'Entrega Regional', desc: 'Cobertura en 7 países de América Latina con soporte local' },
              ].map((step) => (
                <div key={step.num}>
                  <span className="font-num text-3xl font-bold text-[#E8821C]/20">{step.num}</span>
                  <h3 className="text-white font-semibold mt-1">{step.title}</h3>
                  <p className="text-[13px] text-zinc-500 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
