'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, Plus, Minus, Zap, ArrowRight, ChevronDown } from 'lucide-react';
import { storeProducts, accesoriosParaCategoria, periodoLabels, parseModalidad, parsePeriodoAlquiler, type Modalidad, type PeriodoAlquiler, type StoreProduct, type Accesorio } from '@/lib/store-data';
import { fetchProducto } from '@/lib/productos-live';
import { cn, formatCurrency } from '@/lib/utils';
import { ProductView } from '@/components/PageView';
import { createClient } from '@/lib/supabase/client';
import { useCotizacionCart } from '@/lib/cotizacion-cart';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const cart = useCotizacionCart();
  const [product, setProduct] = useState<StoreProduct | null | undefined>(undefined); // undefined = loading
  const [selectedAccesorios, setSelectedAccesorios] = useState<string[]>([]);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    const supabase = createClient();
    // Try live DB first (covers all 207 products), fall back to hardcoded if not found
    const reload = () =>
      fetchProducto(id).then((p) => {
        setProduct(p || storeProducts.find(sp => sp.slug === id) || null);
      });
    reload();

    // Realtime: si el admin edita este producto (imagen, precios, specs),
    // el detalle se recarga automáticamente.
    const channel = supabase
      .channel(`producto_${id}_feed`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parmonca_productos', filter: `slug=eq.${id}` },
        reload
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Modalidad from URL — usamos parsers que validan runtime (no sólo cast).
  // Con `as Modalidad` un `?modalidad=hola` se colaba al state silenciosamente.
  const initialModalidad = parseModalidad(searchParams.get('modalidad'));
  const initialPeriodo = parsePeriodoAlquiler(searchParams.get('periodo'));
  const [modalidad, setModalidad] = useState<Modalidad>(initialModalidad);
  const [periodo, setPeriodo] = useState<PeriodoAlquiler>(initialPeriodo);

  if (product === undefined) {
    return <div className="flex items-center justify-center h-[60vh]"><p className="text-[var(--color-text-muted)] text-sm">Cargando producto…</p></div>;
  }
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <p className="text-[var(--color-text-secondary)]">Producto no encontrado</p>
        <Link href="/productos" className="text-[13px] text-[#E8821C] hover:underline">Ver catálogo</Link>
      </div>
    );
  }

  // Accesorios aplicables a la categoría de este producto
  const accesoriosAplicables: Accesorio[] = accesoriosParaCategoria(product.categoriaLabel);

  const toggleAccesorio = (id: string) => {
    setSelectedAccesorios(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const cotizarUrl = `/cotizar?producto=${product.slug}&accesorios=${selectedAccesorios.join(',')}&cantidad=${cantidad}&modalidad=${modalidad}${modalidad === 'alquiler' ? `&periodo=${periodo}` : ''}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <ProductView slug={product.slug} marca={product.marca} categoria={product.categoriaLabel} />
      <Link href="/productos" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors mb-6">
        <ArrowLeft size={14} />Volver al catálogo
      </Link>

      {/* Product Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Image */}
        <div className="relative glass rounded-2xl overflow-hidden flex items-center justify-center min-h-[400px] p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8821C]/[0.03] to-transparent" />
          <Image
            src={product.imagenNoBg}
            alt={`${product.marca} ${product.modelo}`}
            width={500}
            height={500}
            className="relative z-10 object-contain w-full h-full max-h-[420px] drop-shadow-[0_20px_50px_rgba(232,130,28,0.2)]"
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
          <h1 className="font-display text-4xl font-bold text-[var(--color-text-primary)] mt-1 tracking-tight">{product.modelo}</h1>
          <p className="text-[var(--color-text-secondary)] text-[13px] mt-1">{product.categoriaLabel} · Capacidad {product.capacidad}</p>

          {/* Modalidad Toggle */}
          <div className="mt-5 p-4 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)]">
            <div className="flex h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-1 mb-3">
              {[
                { value: 'venta' as Modalidad, label: 'Comprar' },
                { value: 'alquiler' as Modalidad, label: 'Alquilar' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setModalidad(opt.value)}
                  className={cn(
                    'flex-1 rounded-lg text-[13px] font-semibold transition-all',
                    modalidad === opt.value
                      ? 'bg-[#E8821C] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>

            {modalidad === 'alquiler' && (
              <div className="flex h-9 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-0.5 mb-3">
                {(['1_ano', '2_anos', '3_anos', '5_anos'] as PeriodoAlquiler[]).map(p => (
                  <button key={p} onClick={() => setPeriodo(p)}
                    className={cn(
                      'flex-1 rounded-md text-[11px] font-medium transition-all',
                      periodo === p
                        ? 'bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                    )}>
                    {periodoLabels[p]}
                  </button>
                ))}
              </div>
            )}

            {(() => {
              const precio = modalidad === 'alquiler'
                ? product.preciosAlquiler[periodo] || 0
                : product.precioDesde || 0;
              const tienePrecio = precio > 0;
              return (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">
                      {tienePrecio ? (modalidad === 'alquiler' ? `Alquiler ${periodoLabels[periodo]}` : 'Precio') : 'Precio'}
                    </p>
                    {tienePrecio ? (
                      <>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono mt-0.5">
                          {formatCurrency(precio)}
                          {modalidad === 'alquiler' && (
                            <span className="text-[12px] text-[var(--color-text-muted)] font-sans font-normal ml-1.5">
                              / {periodoLabels[periodo].toLowerCase()}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          {modalidad === 'alquiler'
                            ? 'Incluye mantenimiento básico · ITBMS no incluido'
                            : 'Precio EXW Panamá · ITBMS no incluido'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[15px] font-semibold text-[var(--color-text-primary)] mt-0.5">
                          Cotiza con un asesor
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          {modalidad === 'alquiler'
                            ? `Renta ${periodoLabels[periodo].toLowerCase()} · personalizado`
                            : 'Precio personalizado según tu operación y volumen'}
                        </p>
                      </>
                    )}
                  </div>
                  {(() => {
                    const enCarrito = cart.items.find(i => i.key === `producto-${product.slug}`);
                    return (
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={() => cart.addItem({
                            key: `producto-${product.slug}`,
                            tipo: 'producto',
                            ref: product.slug,
                            modelo: product.modelo,
                            marca: product.marca,
                            categoria: product.categoriaLabel,
                            imagen: product.imagen || null,
                            precio,
                          }, cantidad)}
                          className={cn(
                            'inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-[13px] font-semibold transition-all',
                            enCarrito
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white hover:shadow-[0_0_20px_rgba(232,130,28,0.35)]'
                          )}
                        >
                          {enCarrito ? <><Check size={13} />Ya lo agregaste ({enCarrito.cantidad}) — sumar más</> : <><Plus size={13} />Agregar a la cotización</>}
                        </button>
                        <Link
                          href={`/cotizar?producto=${product.slug}&modalidad=${modalidad}${modalidad === 'alquiler' ? `&periodo=${periodo}` : ''}`}
                          className="text-[11px] text-[var(--color-text-muted)] hover:text-[#E8821C] transition-colors"
                        >
                          o pedir cotización sólo de este equipo →
                        </Link>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>

          <p className="text-[var(--color-text-secondary)] text-[14px] mt-4 leading-relaxed">{product.descripcion}</p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2 mt-6">
            {product.caracteristicas.map((feat) => (
              <div key={feat} className="flex items-start gap-2">
                <Check size={13} className="text-[#E8821C] mt-0.5 flex-shrink-0" />
                <span className="text-[12px] text-[var(--color-text-secondary)]">{feat}</span>
              </div>
            ))}
          </div>

          {/* Specs Accordion */}
          <button onClick={() => setSpecsOpen(!specsOpen)}
            className="flex items-center justify-between w-full mt-6 py-3 border-t border-b border-[var(--color-border)] text-[13px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
            Especificaciones Técnicas
            <ChevronDown size={16} className={cn('transition-transform', specsOpen && 'rotate-180')} />
          </button>
          {specsOpen && (
            <div className="grid grid-cols-2 gap-3 py-4">
              {Object.entries(product.specs).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-[13px] font-medium text-[var(--color-text-secondary)] mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Accessories Configurator */}
      <section className="mb-12">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8821C] mb-1">Personaliza</p>
          <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] tracking-tight">Agrega accesorios</h2>
          {modalidad === 'alquiler' && (
            <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">Los accesorios se cotizan por separado en modalidad de alquiler</p>
          )}
        </div>

        {[
          { cat: 'seguridad', label: 'Seguridad' },
          { cat: 'productividad', label: 'Productividad' },
          { cat: 'proteccion', label: 'Protección' },
          { cat: 'tecnologia', label: 'Tecnología' },
        ].map(({ cat, label }) => {
          const catAccs = accesoriosAplicables.filter(a => a.categoria === cat);
          if (catAccs.length === 0) return null;
          return (
            <div key={cat} className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-2">{label}</p>
              <div className="flex flex-col gap-1.5">
                {catAccs.map((acc) => {
                  const selected = selectedAccesorios.includes(acc.id);
                  return (
                    <div key={acc.id}>
                      <button onClick={() => toggleAccesorio(acc.id)}
                        className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all text-left',
                          selected
                            ? 'bg-[#E8821C]/15 text-[#E8821C] border border-[#E8821C]/30'
                            : 'bg-[var(--color-surface-glass)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]')}>
                        <div className={cn('w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all',
                          selected ? 'bg-[#E8821C] border-[#E8821C]' : 'border-[var(--color-text-muted)]')}>
                          {selected && <Check size={10} className="text-white" />}
                        </div>
                        <span className="font-medium flex-1">{acc.nombre}</span>
                        <span className={cn('text-[10px] uppercase tracking-wider', selected ? 'text-[#E8821C]/70' : 'text-[var(--color-text-muted)]')}>
                          {selected ? 'Incluido' : 'Agregar'}
                        </span>
                        <ChevronDown size={12} className={cn('text-[var(--color-text-muted)] transition-transform', selected && 'rotate-180')} />
                      </button>
                      {selected && (
                        <p className="text-[11px] text-[var(--color-text-secondary)] px-9 py-1.5 leading-relaxed">{acc.descripcion}</p>
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
        <div className="rounded-t-2xl p-3 sm:p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.6)] bg-[var(--color-surface)] border-t border-[var(--color-border)]">
          <div className="max-w-5xl mx-auto">
            {/* Mobile layout */}
            <div className="flex items-center justify-between gap-3 sm:hidden">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[var(--color-text-primary)] truncate">{product.marca} {product.modelo}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                  {modalidad === 'alquiler' ? `Alquiler/${periodoLabels[periodo]}` : 'Compra'}
                  {selectedAccesorios.length > 0 && ` · ${selectedAccesorios.length} acc.`}
                  {' · x'}{cantidad}
                </p>
              </div>
              <Link href={cotizarUrl}
                className="flex items-center gap-1.5 h-10 px-5 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold rounded-full whitespace-nowrap active:scale-[0.97]">
                Cotizar
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:flex items-center gap-6">
              <div className="flex items-center gap-5 flex-1">
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Equipo</p>
                  <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{product.marca} {product.modelo}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Modalidad</p>
                  <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
                    {modalidad === 'alquiler' ? `Alquiler/${periodoLabels[periodo]}` : 'Compra'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Accesorios</p>
                  <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">{selectedAccesorios.length} seleccionados</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-7 h-7 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                    <Minus size={12} />
                  </button>
                  <span className="font-num text-[14px] font-semibold text-[var(--color-text-primary)] w-6 text-center">{cantidad}</span>
                  <button onClick={() => setCantidad(cantidad + 1)}
                    className="w-7 h-7 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <Link href={cotizarUrl}
                className="flex items-center gap-2 h-10 px-6 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold rounded-full hover:shadow-[0_0_25px_#E8821C40] transition-all active:scale-[0.97] group whitespace-nowrap">
                Solicitar cotización
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
