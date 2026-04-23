'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Package, Zap, CheckCircle2, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import { fetchRepuesto, stockBadge, formatPrecio, CATEGORIAS_REPUESTOS, type Repuesto } from '@/lib/repuestos-live';
import { cn } from '@/lib/utils';

const BADGE_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  rose: 'bg-rose-500/10 border-rose-500/20 text-rose-300',
  slate: 'bg-[var(--color-surface-glass)] border-[var(--color-border)] text-[var(--color-text-muted)]',
};

export default function RepuestoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [r, setR] = useState<Repuesto | null | undefined>(undefined);

  useEffect(() => {
    fetchRepuesto(id).then(setR);
  }, [id]);

  if (r === undefined) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[var(--color-text-muted)] text-sm">Cargando repuesto…</p>
      </div>
    );
  }

  if (!r) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <p className="text-[var(--color-text-secondary)]">Repuesto no encontrado</p>
        <Link href="/productos#repuestos" className="text-[13px] text-[#E8821C] hover:underline">
          Ver todos los repuestos
        </Link>
      </div>
    );
  }

  const badge = stockBadge(r);
  const precio = formatPrecio(r);
  const categoria = CATEGORIAS_REPUESTOS.find(c => c.id === r.categoria);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Breadcrumb */}
      <Link
        href="/productos#repuestos"
        className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)] hover:text-[#E8821C] transition-colors mb-5"
      >
        <ArrowLeft size={13} />
        <span>Volver a repuestos</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-8">
        {/* Imagen + badges */}
        <div className="lg:col-span-2">
          <div className="relative aspect-square rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center p-8 overflow-hidden">
            {r.imagen_url ? (
              <Image
                src={r.imagen_url}
                alt={r.nombre}
                width={480}
                height={480}
                className="object-contain w-full h-full"
                unoptimized
              />
            ) : (
              <Package size={120} className="text-[var(--color-text-muted)]/30" strokeWidth={1} />
            )}
            <span className={cn(
              'absolute top-3 right-3 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider',
              BADGE_COLORS[badge.color]
            )}>
              {badge.label}
            </span>
            {r.marca && (
              <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20">
                <Zap size={10} className="text-[#E8821C]" />
                <span className="text-[10px] font-bold text-[#E8821C] uppercase tracking-wider">{r.marca}</span>
              </span>
            )}
          </div>
        </div>

        {/* Info principal */}
        <div className="lg:col-span-3 flex flex-col">
          {categoria && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8821C] mb-2 flex items-center gap-1.5">
              <span>{categoria.emoji}</span>
              <span>{categoria.label}</span>
            </p>
          )}

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
            {r.nombre}
          </h1>

          {r.subcategoria && (
            <p className="text-[12px] text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">
              {r.subcategoria}
            </p>
          )}

          {/* Precio + CTA */}
          <div className="mt-5 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-glass)]">
            {precio ? (
              <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Precio</p>
                  <p className="font-mono text-[28px] font-bold text-[var(--color-text-primary)] leading-tight">
                    {precio}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Precio por {r.unidad || 'unidad'} · ITBMS no incluido
                  </p>
                </div>
                <Link
                  href={`/cotizar?repuesto=${r.sku || r.id}&nombre=${encodeURIComponent(r.nombre)}`}
                  className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold hover:shadow-[0_0_20px_rgba(232,130,28,0.35)] transition-all"
                >
                  Cotizar ahora
                  <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Precio</p>
                  <p className="text-[15px] font-semibold text-[var(--color-text-primary)] mt-0.5">
                    Cotiza con un asesor
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Un ejecutivo te contacta con el precio vigente.
                  </p>
                </div>
                <Link
                  href={`/cotizar?repuesto=${r.sku || r.id}&nombre=${encodeURIComponent(r.nombre)}`}
                  className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold hover:shadow-[0_0_20px_rgba(232,130,28,0.35)] transition-all"
                >
                  Solicitar cotización
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>

          {/* Descripcion */}
          {r.descripcion && (
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Descripción</p>
              <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                {r.descripcion}
              </p>
            </div>
          )}

          {/* Compatible con */}
          {r.compatible_con && r.compatible_con.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Compatible con</p>
              <div className="flex flex-wrap gap-1.5">
                {r.compatible_con.map(c => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  >
                    <CheckCircle2 size={11} className="text-emerald-400" />
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ficha compacta */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <MiniSpec label="SKU" value={r.sku || '—'} mono />
            <MiniSpec label="Stock" value={`${r.stock} ${r.unidad || 'und.'}`} />
            {r.marca && <MiniSpec label="Marca" value={r.marca} />}
            {categoria && <MiniSpec label="Categoría" value={categoria.label} />}
          </div>
        </div>
      </div>

      {/* Trust row */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TrustChip icon={Truck} title="Entrega rápida" body="Stock en Panamá · despacho 24-72h según destino." />
        <TrustChip icon={ShieldCheck} title="Repuesto original" body="Compatibilidad garantizada con tu equipo." />
        <TrustChip icon={RefreshCw} title="Inventario en vivo" body="Sincronización con Odoo cada 15 min." />
      </div>
    </div>
  );
}

function MiniSpec({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">{label}</p>
      <p className={cn(
        'text-[13px] font-semibold text-[var(--color-text-primary)] mt-0.5',
        mono && 'font-mono'
      )}>
        {value}
      </p>
    </div>
  );
}

function TrustChip({ icon: Icon, title, body }: { icon: typeof Truck; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-4 flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-[#E8821C]/10 border border-[#E8821C]/20 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-[#E8821C]" />
      </div>
      <div>
        <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">{title}</p>
        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-snug">{body}</p>
      </div>
    </div>
  );
}
