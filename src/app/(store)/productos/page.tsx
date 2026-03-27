'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, Truck, Battery, ChevronRight, Factory, MapPin, Clock, Users, Lightbulb, TrendingDown, Calculator } from 'lucide-react';
import { storeProducts, industriaOptions, ambienteOptions, frecuenciaOptions, plazoOptions, getRecommendation, periodoLabels, type Modalidad, type PeriodoAlquiler } from '@/lib/store-data';
import { formatCurrency, cn } from '@/lib/utils';

export default function ProductosPage() {
  const [modalidad, setModalidad] = useState<Modalidad>('venta');
  const [periodo, setPeriodo] = useState<PeriodoAlquiler>('mensual');

  // Smart context form state
  const [industria, setIndustria] = useState('');
  const [ambiente, setAmbiente] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [plazo, setPlazo] = useState('');
  const [operadores, setOperadores] = useState<'si' | 'no' | ''>('');

  const recommendation = getRecommendation(industria, ambiente, frecuencia);
  const hasContext = industria || ambiente || frecuencia;

  function getDisplayPrice(product: typeof storeProducts[0]) {
    if (modalidad === 'alquiler') return product.preciosAlquiler[periodo];
    return product.precioDesde;
  }

  function getPriceLabel() {
    if (modalidad === 'alquiler') return `/${periodoLabels[periodo]}`;
    return '';
  }

  // TCO calculation (12 months comparison)
  const tcoMonths = 12;
  const tcoElectric = storeProducts[0];
  const tcoDiesel = storeProducts[1];
  const tcoElectricTotal = tcoElectric.precioDesde + (tcoElectric.costoOperativo.combustibleMes + tcoElectric.costoOperativo.mantenimientoMes) * tcoMonths;
  const tcoDieselTotal = tcoDiesel.precioDesde + (tcoDiesel.costoOperativo.combustibleMes + tcoDiesel.costoOperativo.mantenimientoMes) * tcoMonths;
  const tcoSavings = tcoDieselTotal - tcoElectricTotal;

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
                <span className="text-[11px] font-semibold text-[#E8821C] uppercase tracking-wider">Venta y alquiler de maquinaria</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] leading-[1.1] tracking-tight">
                Tu próximo<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8821C] to-[#FF9F43]">equipo</span> está<br />
                aquí.
              </h1>
              <p className="text-[var(--color-text-secondary)] text-lg mt-6 max-w-md leading-relaxed">
                Montacargas, apiladores y maquinaria industrial. Compra o alquila, cotiza online y recibe tu propuesta al instante.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="#asesor"
                  className="flex items-center gap-2 h-12 px-6 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white font-semibold rounded-full hover:shadow-[0_0_30px_#E8821C40] transition-all active:scale-[0.97] group">
                  Encuentra tu equipo
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="#catalogo"
                  className="flex items-center gap-2 h-12 px-6 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium rounded-full hover:bg-[var(--color-surface-hover)] transition-all">
                  Ver Catálogo
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
                  src="/images/products/aec35-hero-nobg.png"
                  alt="Montacarga Eléctrico ANDINO AEC35"
                  width={600}
                  height={600}
                  className="relative z-10 object-contain w-full h-auto drop-shadow-[0_20px_60px_rgba(232,130,28,0.15)]"
                  priority
                />
                <div className="absolute bottom-4 left-4 right-4 glass rounded-xl p-4 z-20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#E8821C] font-semibold uppercase tracking-wider">ANDINO</p>
                      <p className="text-[var(--color-text-primary)] font-display font-bold text-lg">AEC35</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--color-text-muted)]">Desde</p>
                      <p className="text-[var(--color-text-primary)] font-num font-bold text-lg">$24,500</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Context Form - Asesor Virtual */}
      <section id="asesor" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8821C] mb-3">Asesor Virtual</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Cuéntanos sobre tu operación
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-3 max-w-lg mx-auto">
            Responde estas preguntas y te recomendaremos el equipo ideal para tu caso
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Industria */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">
                <Factory size={12} className="text-[#E8821C]" /> Industria / Sector
              </label>
              <select value={industria} onChange={(e) => setIndustria(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/30 appearance-none transition-all">
                <option value="">Seleccionar...</option>
                {industriaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Ambiente */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">
                <MapPin size={12} className="text-[#E8821C]" /> Tipo de operación
              </label>
              <select value={ambiente} onChange={(e) => setAmbiente(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/30 appearance-none transition-all">
                <option value="">Seleccionar...</option>
                {ambienteOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Frecuencia */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">
                <Clock size={12} className="text-[#E8821C]" /> Frecuencia de uso
              </label>
              <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/30 appearance-none transition-all">
                <option value="">Seleccionar...</option>
                {frecuenciaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Plazo */}
            <div>
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">
                <Zap size={12} className="text-[#E8821C]" /> Plazo de necesidad
              </label>
              <select value={plazo} onChange={(e) => setPlazo(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/30 appearance-none transition-all">
                <option value="">Seleccionar...</option>
                {plazoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Operadores */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">
                <Users size={12} className="text-[#E8821C]" /> ¿Cuenta con operadores certificados?
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'si' as const, label: 'Sí, tengo operadores' },
                  { value: 'no' as const, label: 'No, necesito capacitación' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setOperadores(opt.value)}
                    className={cn(
                      'flex-1 h-11 px-4 rounded-xl text-[13px] font-medium border transition-all',
                      operadores === opt.value
                        ? 'bg-[#E8821C]/15 text-[#E8821C] border-[#E8821C]/30'
                        : 'bg-[var(--color-surface-glass)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-surface-hover)]'
                    )}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendation Result */}
          {recommendation && hasContext && (
            <div className="mt-8 glass rounded-2xl p-6 border border-[#E8821C]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#E8821C]/[0.04] rounded-full blur-[100px]" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#E8821C]/10 flex items-center justify-center">
                    <Lightbulb size={16} className="text-[#E8821C]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#E8821C]">Nuestra Recomendación</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Image
                    src={recommendation.product.imagenNoBg}
                    alt={recommendation.product.modelo}
                    width={120}
                    height={90}
                    className="object-contain"
                  />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#E8821C]">{recommendation.product.marca}</p>
                    <p className="font-display text-xl font-bold text-[var(--color-text-primary)]">{recommendation.product.modelo}</p>
                    <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">{recommendation.product.categoriaLabel}</p>
                    <p className="text-[13px] text-[var(--color-text-secondary)] mt-2 leading-relaxed">{recommendation.reason}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="px-2 py-0.5 rounded-full bg-[#E8821C]/10 text-[10px] font-bold text-[#E8821C] uppercase">
                        {recommendation.modalidad === 'venta' ? 'Compra' : 'Alquiler'}
                      </span>
                      {operadores === 'no' && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-400 uppercase">
                          + Capacitación incluida
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {recommendation.modalidad === 'venta' ? 'Desde' : 'Desde/mes'}
                    </p>
                    <p className="font-num text-2xl font-bold text-[var(--color-text-primary)]">
                      {formatCurrency(recommendation.modalidad === 'venta'
                        ? recommendation.product.precioDesde
                        : recommendation.product.preciosAlquiler[recommendation.periodo || 'mensual']
                      )}
                    </p>
                    <Link href={`/productos/${recommendation.product.slug}`}
                      className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-semibold text-[#E8821C] hover:underline group">
                      Ver equipo <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Product Catalog */}
      <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8821C] mb-3">Catalogo</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
              Maquinaria de clase mundial
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-3 max-w-lg">
              Cada equipo incluye garantía, soporte técnico y opciones de financiamiento
            </p>
          </div>

          {/* Modalidad Toggle */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex h-10 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] p-1">
              {[
                { value: 'venta' as Modalidad, label: 'Comprar' },
                { value: 'alquiler' as Modalidad, label: 'Alquilar' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setModalidad(opt.value)}
                  className={cn(
                    'px-4 rounded-lg text-[12px] font-semibold transition-all',
                    modalidad === opt.value
                      ? 'bg-[#E8821C] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
            {modalidad === 'alquiler' && (
              <div className="flex h-8 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] p-0.5">
                {(['diario', 'semanal', 'mensual', 'anual'] as PeriodoAlquiler[]).map(p => (
                  <button key={p} onClick={() => setPeriodo(p)}
                    className={cn(
                      'px-3 rounded-md text-[11px] font-medium transition-all',
                      periodo === p
                        ? 'bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                    )}>
                    {periodoLabels[p]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {storeProducts.map((product) => (
            <Link key={product.id} href={`/productos/${product.slug}?modalidad=${modalidad}${modalidad === 'alquiler' ? `&periodo=${periodo}` : ''}`}
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
              <div className="relative aspect-[3/4] bg-[var(--color-surface-elevated)] flex items-center justify-center rounded-t-2xl p-4">
                <Image
                  src={product.imagen}
                  alt={`${product.marca} ${product.modelo}`}
                  width={400}
                  height={500}
                  className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-700"
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
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {modalidad === 'alquiler' ? `Desde/${periodoLabels[periodo]}` : 'Desde'}
                    </p>
                    <p className="font-num text-xl font-bold text-[var(--color-text-primary)]">{formatCurrency(getDisplayPrice(product))}</p>
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

      {/* TCO Calculator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="glass rounded-2xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#E8821C]/[0.03] rounded-full blur-[120px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={18} className="text-[#E8821C]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8821C]">Calculadora de Costo Total</p>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight max-w-lg">
              Eléctrico vs Combustión: el ahorro real
            </h2>
            <p className="text-[var(--color-text-secondary)] text-[14px] mt-2 max-w-lg">
              Comparación de costo total de propiedad a {tcoMonths} meses incluyendo equipo, combustible/energía y mantenimiento
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
              {/* Electric */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Image src={tcoElectric.imagenNoBg} alt={tcoElectric.modelo} width={50} height={40} className="object-contain" />
                  <div>
                    <p className="text-[10px] font-bold text-[#E8821C] uppercase tracking-wider">{tcoElectric.marca}</p>
                    <p className="font-display font-bold text-[var(--color-text-primary)]">{tcoElectric.modelo}</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">Eléctrico Li-Ion</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--color-text-secondary)]">Equipo</span>
                    <span className="font-num text-[var(--color-text-primary)]">{formatCurrency(tcoElectric.precioDesde)}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--color-text-secondary)]">Energía ({tcoMonths} meses)</span>
                    <span className="font-num text-[var(--color-text-primary)]">{formatCurrency(tcoElectric.costoOperativo.combustibleMes * tcoMonths)}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--color-text-secondary)]">Mantenimiento ({tcoMonths} meses)</span>
                    <span className="font-num text-[var(--color-text-primary)]">{formatCurrency(tcoElectric.costoOperativo.mantenimientoMes * tcoMonths)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-500/20">
                    <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Total</span>
                    <span className="font-num text-lg font-bold text-emerald-400">{formatCurrency(tcoElectricTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Diesel */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Image src={tcoDiesel.imagenNoBg} alt={tcoDiesel.modelo} width={50} height={40} className="object-contain" />
                  <div>
                    <p className="text-[10px] font-bold text-[#E8821C] uppercase tracking-wider">{tcoDiesel.marca}</p>
                    <p className="font-display font-bold text-[var(--color-text-primary)]">{tcoDiesel.modelo}</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">Diesel Turbo</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--color-text-secondary)]">Equipo</span>
                    <span className="font-num text-[var(--color-text-primary)]">{formatCurrency(tcoDiesel.precioDesde)}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--color-text-secondary)]">Combustible ({tcoMonths} meses)</span>
                    <span className="font-num text-[var(--color-text-primary)]">{formatCurrency(tcoDiesel.costoOperativo.combustibleMes * tcoMonths)}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--color-text-secondary)]">Mantenimiento ({tcoMonths} meses)</span>
                    <span className="font-num text-[var(--color-text-primary)]">{formatCurrency(tcoDiesel.costoOperativo.mantenimientoMes * tcoMonths)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
                    <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Total</span>
                    <span className="font-num text-lg font-bold text-[var(--color-text-primary)]">{formatCurrency(tcoDieselTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings banner */}
            <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">
              <TrendingDown size={20} className="text-emerald-400 flex-shrink-0" />
              <p className="text-[13px] text-[var(--color-text-primary)]">
                <span className="font-semibold">Ahorro con eléctrico:</span>{' '}
                <span className="font-num font-bold text-emerald-400">{formatCurrency(tcoSavings)}</span>{' '}
                en {tcoMonths} meses de operación
              </p>
            </div>
          </div>
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
                { num: '01', title: 'Cotiza Online', desc: 'Configura tu equipo, elige compra o alquiler, y recibe una cotización en minutos' },
                { num: '02', title: 'Personaliza', desc: 'Agrega accesorios de seguridad, productividad y tecnologia' },
                { num: '03', title: 'Financiamiento', desc: 'Opciones flexibles de pago, leasing y alquiler adaptadas a tu operación' },
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
