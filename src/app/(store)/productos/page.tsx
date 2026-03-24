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
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 mb-6">
                <Zap size={12} className="text-[#E8821C]" />
                <span className="text-[11px] font-semibold text-[#E8821C] uppercase tracking-wider">Primera plataforma de cotización online</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] leading-[1.1] tracking-tight">
                Tu próximo<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8821C] to-[#FF9F43]">equipo</span> está<br />
                aquí.
              </h1>
              <p className="text-[var(--color-text-secondary)] text-lg mt-6 max-w-md leading-relaxed">
                Montacargas, apiladores y maquinaria industrial. Cotiza online, personaliza y recibe tu propuesta al instante.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="#catalogo"
                  className="flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white font-semibold rounded-full hover:shadow-[0_0_30px_#E8821C40] transition-all active:scale-[0.97] group">
                  Explorar Catálogo
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/cotizar"
                  className="flex items-center gap-2 h-12 px-6 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium rounded-full hover:bg-[var(--color-surface-hover)] transition-all">
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
                      <span className="text-[11px] text-[var(--color-text-secondary)]">{t.text}</span>
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
                  src="/images/products/tan35d-hero-nobg.png"
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
                      <p className="text-[var(--color-text-primary)] font-display font-bold text-lg">TAN35D</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--color-text-muted)]">Desde</p>
                      <p className="text-[var(--color-text-primary)] font-num font-bold text-lg">$22,000</p>
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
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Maquinaria de clase mundial
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-3 max-w-lg mx-auto">
            Cada equipo incluye garantía, soporte técnico y opciones de financiamiento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {storeProducts.map((product) => (
            <Link key={product.id} href={`/productos/${product.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[#E8821C]/30 transition-all duration-500 shadow-sm">
              {/* Badge */}
              {product.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-2.5 py-1 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 text-[10px] font-bold text-[#E8821C] uppercase tracking-wider">
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Image */}
              <div className="relative aspect-[4/3] bg-[var(--color-surface-elevated)] flex items-center justify-center overflow-hidden rounded-t-2xl p-6">
                <Image
                  src={product.imagen}
                  alt={`${product.marca} ${product.modelo}`}
                  width={400}
                  height={300}
                  className="object-contain max-w-full max-h-full group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Info */}
              <div className="p-5 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#E8821C]">{product.marca}</p>
                    <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)] mt-0.5">{product.modelo}</h3>
                    <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">{product.categoriaLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--color-text-muted)]">Desde</p>
                    <p className="font-num text-xl font-bold text-[var(--color-text-primary)]">{formatCurrency(product.precioDesde)}</p>
                  </div>
                </div>

                {/* Quick Specs */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-[var(--color-text-muted)]">Capacidad</p>
                    <p className="text-[13px] font-semibold text-[var(--color-text-secondary)] mt-0.5">{product.capacidad}</p>
                  </div>
                  <div className="w-px bg-[var(--color-border)]" />
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-[var(--color-text-muted)]">Motor</p>
                    <p className="text-[13px] font-semibold text-[var(--color-text-secondary)] mt-0.5">{product.motor}</p>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)] group-hover:border-[#E8821C]/20 group-hover:bg-[#E8821C]/[0.06] transition-all">
                  <span className="text-[12px] font-semibold text-[var(--color-text-secondary)] group-hover:text-[#E8821C] transition-colors">Configurar y Cotizar</span>
                  <ChevronRight size={14} className="text-[var(--color-text-muted)] group-hover:text-[#E8821C] group-hover:translate-x-0.5 transition-all" />
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
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight max-w-lg">
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
                  <h3 className="text-[var(--color-text-primary)] font-semibold mt-1">{step.title}</h3>
                  <p className="text-[13px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
