'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchRepuestos, stockBadge, formatPrecio, CATEGORIAS_REPUESTOS, type Repuesto, type CategoriaRepuesto } from '@/lib/repuestos-live';

const BADGE_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  rose: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
  slate: 'bg-[var(--color-surface-glass)] border-[var(--color-border)] text-[var(--color-text-muted)]',
};

export function RepuestosSection() {
  const [items, setItems] = useState<Repuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<CategoriaRepuesto | 'todos'>('todos');

  useEffect(() => {
    fetchRepuestos().then(setItems).finally(() => setLoading(false));
  }, []);

  const conteos = useMemo(() => {
    const c: Record<string, number> = { todos: items.length };
    for (const r of items) c[r.categoria] = (c[r.categoria] || 0) + 1;
    return c;
  }, [items]);

  const filtered = filtro === 'todos' ? items : items.filter(i => i.categoria === filtro);

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
          onClick={() => setFiltro('todos')}
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
            onClick={() => setFiltro(cat.id)}
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
          {filtered.map((r) => {
            const badge = stockBadge(r);
            const precio = formatPrecio(r);
            return (
              <div
                key={r.id}
                className="group rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[#E8821C]/40 hover:shadow-lg transition-all"
              >
                <div className="aspect-square bg-[var(--color-surface-elevated)] flex items-center justify-center p-3 relative overflow-hidden">
                  {r.imagen_url ? (
                    <Image src={r.imagen_url} alt={r.nombre} width={240} height={240} className="object-contain w-full h-full" unoptimized />
                  ) : (
                    <Package size={40} className="text-[var(--color-text-muted)]/40" strokeWidth={1.5} />
                  )}
                  {/* Stock badge */}
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
                <div className="p-3.5">
                  <h3 className="font-display text-[14px] font-bold text-[var(--color-text-primary)] leading-tight truncate">{r.nombre}</h3>
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
                </div>
              </div>
            );
          })}
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
