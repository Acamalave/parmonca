'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Zap, Shield, Truck, Battery, ChevronRight, Factory, MapPin, Clock, Users, Lightbulb, TrendingDown, Calculator, Search, Package, Boxes, MoveVertical, Grid3x3 } from 'lucide-react';
import { storeProducts, industriaOptions, ambienteOptions, frecuenciaOptions, plazoOptions, getRecommendation, periodoLabels, type Modalidad, type PeriodoAlquiler, type StoreProduct } from '@/lib/store-data';
import { fetchActivos } from '@/lib/productos-live';
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

  // Live catalog (all active products from Supabase)
  const [liveProducts, setLiveProducts] = useState<StoreProduct[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  // Grupos estratégicos de categorías
  type Grupo = 'todos' | 'montacargas' | 'apiladores' | 'altura';
  const [filterGrupo, setFilterGrupo] = useState<Grupo>('todos');
  const [filterMarca, setFilterMarca] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    fetchActivos(300)
      .then((p) => setLiveProducts(p))
      .finally(() => setLoadingLive(false));
  }, []);

  const marcasCatalogo = useMemo(() => {
    const set = new Set(liveProducts.map(p => p.marca).filter(Boolean));
    return Array.from(set).sort();
  }, [liveProducts]);

  // Helper to check if a product belongs to a grupo
  const productoEnGrupo = (p: StoreProduct, g: Grupo): boolean => {
    if (g === 'todos') return true;
    const label = p.categoriaLabel;
    if (g === 'montacargas') return label === 'Montacarga Eléctrico' || label === 'Montacarga Combustión';
    if (g === 'apiladores') return label === 'Traspaleta Eléctrica' || label === 'Apilador Eléctrico';
    if (g === 'altura') return label === 'Mástil Retráctil' || (!['Montacarga Eléctrico','Montacarga Combustión','Traspaleta Eléctrica','Apilador Eléctrico'].includes(label));
    return true;
  };

  const conteoGrupo = (g: Grupo) => liveProducts.filter(p => productoEnGrupo(p, g)).length;

  const filteredLive = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return liveProducts.filter(p => {
      if (!productoEnGrupo(p, filterGrupo)) return false;
      if (filterMarca !== 'todas' && p.marca !== filterMarca) return false;
      if (q && !p.modelo.toLowerCase().includes(q) && !p.marca.toLowerCase().includes(q)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveProducts, filterGrupo, filterMarca, searchTerm]);

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(12); }, [filterGrupo, filterMarca, searchTerm]);

  function getDisplayPrice(product: StoreProduct) {
    if (modalidad === 'alquiler') return product.preciosAlquiler[periodo];
    return product.precioDesde;
  }

  function getPriceLabel() {
    if (modalidad === 'alquiler') return `/${periodoLabels[periodo]}`;
    return '';
  }


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
                    <span className="inline-block px-3 py-1 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 text-[10px] font-semibold text-[#E8821C] uppercase tracking-wider">
                      Precio personalizado
                    </span>
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

        {/* 3 Compact strategic cards — click to filter immediately */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
          {([
            {
              id: 'montacargas' as Grupo,
              icon: Truck,
              title: 'Montacargas',
              hint: 'Mueve pallets y carga pesada en almacén u obra',
            },
            {
              id: 'apiladores' as Grupo,
              icon: Boxes,
              title: 'Apiladores',
              hint: 'Estiba y traslada pallets en pasillos estrechos',
            },
            {
              id: 'altura' as Grupo,
              icon: MoveVertical,
              title: 'Altura',
              hint: 'Trabaja en elevación con mástiles o plataformas',
            },
          ] as const).map(card => {
            const Icon = card.icon;
            const active = filterGrupo === card.id;
            const count = conteoGrupo(card.id);
            return (
              <button
                key={card.id}
                onClick={() => setFilterGrupo(active ? 'todos' : card.id)}
                className={cn(
                  'group flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200',
                  active
                    ? 'border-[#E8821C] bg-[#E8821C]/[0.06]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-glass)] hover:border-[#E8821C]/40'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                  active
                    ? 'bg-[#E8821C] text-white'
                    : 'bg-[var(--color-surface-elevated)] text-[#E8821C]'
                )}>
                  <Icon size={16} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-[14px] font-bold text-[var(--color-text-primary)] tracking-tight leading-none">{card.title}</h3>
                    <span className={cn(
                      'text-[10px] font-semibold whitespace-nowrap',
                      active ? 'text-[#E8821C]' : 'text-[var(--color-text-muted)]'
                    )}>
                      {count}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1 leading-snug line-clamp-2">{card.hint}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Secondary filters: search + brand + clear */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar modelo o marca..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 transition-all"
            />
          </div>
          <select
            value={filterMarca}
            onChange={(e) => setFilterMarca(e.target.value)}
            className="h-10 px-3 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/40"
          >
            <option value="todas">Todas las marcas</option>
            {marcasCatalogo.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {(filterGrupo !== 'todos' || filterMarca !== 'todas' || searchTerm) && (
            <button
              onClick={() => { setFilterGrupo('todos'); setFilterMarca('todas'); setSearchTerm(''); }}
              className="h-10 px-3 rounded-xl text-[12px] font-medium text-[var(--color-text-muted)] hover:text-[#E8821C] transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-[12px] text-[var(--color-text-muted)] mb-4">
          {loadingLive
            ? 'Cargando catálogo…'
            : filterGrupo !== 'todos' || filterMarca !== 'todas' || searchTerm
              ? `Mostrando ${filteredLive.length} de ${liveProducts.length} equipos`
              : `${filteredLive.length} equipos disponibles`}
        </p>

        {loadingLive ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-[var(--color-surface-glass)] aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : filteredLive.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-10 text-center text-[var(--color-text-muted)] text-[13px]">
            No encontramos equipos con esos filtros. Intenta con otra combinación.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredLive.slice(0, visibleCount).map((product) => {
                const hasPrice = getDisplayPrice(product) > 0;
                const hasImage = product.imagen && !product.imagen.includes('placeholder');
                return (
                  <Link
                    key={product.slug}
                    href={`/productos/${product.slug}?modalidad=${modalidad}${modalidad === 'alquiler' ? `&periodo=${periodo}` : ''}`}
                    className="group relative rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[#E8821C]/40 hover:shadow-lg transition-all duration-300"
                  >
                    {product.badge && (
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="px-2 py-0.5 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 text-[9px] font-bold text-[#E8821C] uppercase tracking-wider">
                          {product.badge}
                        </span>
                      </div>
                    )}
                    <div className="relative aspect-square bg-[var(--color-surface-elevated)] flex items-center justify-center p-3 overflow-hidden">
                      {hasImage ? (
                        <Image
                          src={product.imagen}
                          alt={`${product.marca} ${product.modelo}`}
                          width={280}
                          height={280}
                          className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <Package size={40} className="text-[var(--color-text-muted)]/40" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="p-3.5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#E8821C]">{product.marca}</p>
                      <h3 className="font-display text-[15px] font-bold text-[var(--color-text-primary)] mt-0.5 leading-tight truncate">{product.modelo}</h3>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 truncate">{product.categoriaLabel}</p>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8821C]/10 border border-[#E8821C]/20 text-[10px] font-semibold text-[#E8821C]">
                          Cotiza ahora
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">{product.capacidad}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {visibleCount < filteredLive.length && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setVisibleCount(c => c + 12)}
                  className="flex items-center gap-2 h-11 px-6 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] text-[13px] font-semibold text-[var(--color-text-primary)] hover:border-[#E8821C]/40 hover:bg-[var(--color-surface-hover)] transition-all"
                >
                  Mostrar más equipos ({filteredLive.length - visibleCount} restantes)
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
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
