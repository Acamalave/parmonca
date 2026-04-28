'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchRepuestos, stockBadge, formatPrecio, CATEGORIAS_REPUESTOS, type Repuesto, type CategoriaRepuesto } from '@/lib/repuestos-live';
import { createClient } from '@/lib/supabase/client';

const BADGE_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  rose: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
  slate: 'bg-[var(--color-surface-glass)] border-[var(--color-border)] text-[var(--color-text-muted)]',
};

const PAGE_SIZE = 10;

export function RepuestosSection() {
  const [items, setItems] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<CategoriaRepuesto | 'todos'>('todos');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const supabase = createClient();
    fetchRepuestos().then(setItems).finally(() => setLoading(false));

    // Realtime: cualquier cambio en parmonca_repuestos refresca el listado.
    // El cron de Odoo + el admin editando disparan eventos aquí.
    const channel = supabase
      .channel('repuestos_landing_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_repuestos' }, async () => {
        const fresh = await fetchRepuestos();
        setItems(fresh);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const conteos = useMemo(() => {
    const c: Record<string, number> = { todos: items.length };
    for (const r of items) c[r.categoria] = (c[r.categoria] || 0) + 1;
    return c;
  }, [items]);

  const filtered = filtro === 'todos' ? items : items.filter(i => i.categoria === filtro);
  const visible = filtered.slice(0, visibleCount);
  const hayMas = visibleCount < filtered.length;

  // Cuando cambias de filtro, vuelve a mostrar sólo los primeros 10.
  // (Usar useEffect dispararía render extra; lo controlamos en el handler).
  const aplicarFiltro = (f: CategoriaRepuesto | 'todos') => {
    setFiltro(f);
    setVisibleCount(PAGE_SIZE);
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8821C] mb-3">Repuestos y consumibles</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Repuestos originales con stock real
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-3 max-w-lg">
            Llantas, asientos, traspaletas manuales y tanques GLP — inventario conectado en tiempo real.
          </p>
        </div>
      </div>

      {/* 4 category cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        <button
          onClick={() => aplicarFiltro('todos')}
          className={cn(
            'flex flex-col items-start gap-1 p-3 rounded-xl border transition-all',
            filtro === 'todos'
              ? 'border-[#E8821C] bg-[#E8821C]/[0.06]'
              : 'border-[var(--color-border)] bg-[var(--color-surface-glass)] hover:border-[#E8821C]/40'
          )}
        >
          <span className="text-2xl">📦</span>
          <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Todos</span>
          <span className="text-[10px] text-[var(--color-text-muted)]">{conteos.todos || 0} disponibles</span>
        </button>
        {CATEGORIAS_REPUESTOS.map(cat => (
          <button
            key={cat.id}
            onClick={() => aplicarFiltro(cat.id)}
            className={cn(
              'flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all',
              filtro === cat.id
                ? 'border-[#E8821C] bg-[#E8821C]/[0.06]'
                : 'border-[var(--color-border)] bg-[var(--color-surface-glass)] hover:border-[#E8821C]/40'
            )}
          >
            <span className="text-2xl">{cat.emoji}</span>
            <span className="text-[13px] font-bold text-[var(--color-text-primary)]">{cat.label}</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">{conteos[cat.id] || 0} disponibles</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-[var(--color-surface-glass)] aspect-[4/5] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-10 text-center text-[var(--color-text-muted)] text-sm">
          Sin repuestos en esta categoría por ahora.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {visible.map((r) => {
            const badge = stockBadge(r);
            const precio = formatPrecio(r);
            return (
              <div
                key={r.id}
                className="group rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[#E8821C]/40 hover:shadow-lg transition-all flex flex-col"
              >
                {/* Imagen + título clickeables — navegan al detalle */}
                <Link href={`/repuestos/${r.id}`} className="block">
                  <div className="aspect-square bg-[var(--color-surface-elevated)] flex items-center justify-center p-3 relative overflow-hidden">
                    {r.imagen_url ? (
                      <Image src={r.imagen_url} alt={r.nombre} width={240} height={240} className="object-contain w-full h-full group-hover:scale-[1.03] transition-transform" unoptimized />
                    ) : (
                      <Package size={40} className="text-[var(--color-text-muted)]/40" strokeWidth={1.5} />
                    )}
                    <span className={cn(
                      'absolute top-2 right-2 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider',
                      BADGE_COLORS[badge.color]
                    )}>
                      {badge.label}
                    </span>
                    {r.marca && (
                      <span className="absolute top-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#E8821C]/10 border border-[#E8821C]/20">
                        <Zap size={8} className="text-[#E8821C]" />
                        <span className="text-[9px] font-bold text-[#E8821C] uppercase tracking-wider">{r.marca}</span>
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-3.5 flex flex-col flex-1">
                  <Link href={`/repuestos/${r.id}`} className="block group-hover:text-[#E8821C] transition-colors">
                    <h3 className="font-display text-[14px] font-bold text-[var(--color-text-primary)] group-hover:text-[#E8821C] leading-tight truncate transition-colors">{r.nombre}</h3>
                  </Link>
                  {r.subcategoria && (
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 uppercase tracking-wider truncate">{r.subcategoria}</p>
                  )}
                  {r.descripcion && (
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-1.5 line-clamp-2 leading-snug">{r.descripcion}</p>
                  )}

                  {/* Precio o CTA según disponibilidad en Odoo */}
                  {precio ? (
                    <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] flex items-end justify-between gap-2">
                      <div className="leading-tight">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Precio</p>
                        <p className="font-mono text-[15px] font-bold text-[var(--color-text-primary)]">{precio}</p>
                      </div>
                      <Link
                        href={`/cotizar?repuesto=${r.sku || r.id}&nombre=${encodeURIComponent(r.nombre)}`}
                        className="flex items-center justify-center gap-1 h-8 px-3 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[11px] font-semibold whitespace-nowrap"
                      >
                        Cotizar
                        <ArrowRight size={11} />
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-3 pt-2.5 border-t border-[var(--color-border)]">
                      <Link
                        href={`/cotizar?repuesto=${r.sku || r.id}&nombre=${encodeURIComponent(r.nombre)}`}
                        className="w-full flex items-center justify-center gap-1 h-8 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[11px] font-semibold"
                      >
                        Cotizar precio
                        <ArrowRight size={11} />
                      </Link>
                    </div>
                  )}

                  {/* Enlace secundario al detalle (refuerza CTA) */}
                  <Link
                    href={`/repuestos/${r.id}`}
                    className="mt-2 text-[10px] text-[var(--color-text-muted)] hover:text-[#E8821C] text-center transition-colors"
                  >
                    Ver detalles →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botón "Ver más" — paginación incremental para no saturar el landing */}
      {!loading && hayMas && (
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <button
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl border border-[#E8821C]/30 bg-[#E8821C]/[0.06] hover:bg-[#E8821C]/[0.12] text-[#E8821C] text-[13px] font-semibold transition-all"
          >
            Ver más repuestos
            <ArrowRight size={13} />
          </button>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Mostrando {visible.length} de {filtered.length}
          </span>
        </div>
      )}

      <p className="text-center text-[11px] text-[var(--color-text-muted)] mt-5">
        El stock se actualiza en tiempo real desde nuestro sistema Odoo. Última sincronización:
        <span className="ml-1 font-medium text-[var(--color-text-secondary)]">
          {items[0]?.ultima_sync_at
            ? new Date(items[0].ultima_sync_at).toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'short' })
            : 'manual'}
        </span>
      </p>
    </section>
  );
}
