'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ClipboardList, X, Plus, Minus, Trash2, ArrowRight, Package, Wrench, Info } from 'lucide-react';
import { useCotizacionCart } from '@/lib/cotizacion-cart';
import { usePais } from '@/context/PaisContext';
import { formatCurrency, cn } from '@/lib/utils';

/**
 * Botón flotante + drawer con la lista de equipos por cotizar.
 * IMPORTANTE: el copy deja claro en todo momento que esto NO es una compra,
 * sino una solicitud de cotización formal.
 */
export function CotizacionCart() {
  const { items, totalUnidades, totalEstimado, setCantidad, removeItem } = useCotizacionCart();
  const { moneda, locale } = usePais();
  const [open, setOpen] = useState(false);
  const fmt = (n: number) => formatCurrency(n, moneda, locale);
  // Impuesto al consumo según país: ITBMS en Panamá, IVA en Costa Rica.
  const impuesto = moneda === 'CRC' ? 'IVA' : 'ITBMS';

  return (
    <>
      {/* Botón flotante (sólo visible si hay items) */}
      {totalUnidades > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 z-40 group flex items-center gap-2 h-12 pl-4 pr-3 rounded-full bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold shadow-[0_4px_20px_rgba(232,130,28,0.35)] hover:shadow-[0_4px_25px_rgba(232,130,28,0.5)] hover:scale-105 transition-all active:scale-95"
          aria-label="Ver lista de equipos por cotizar"
        >
          <ClipboardList size={17} />
          <span className="hidden sm:inline">Mi solicitud</span>
          <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-white text-[#E8821C] text-[12px] font-bold">
            {totalUnidades}
          </span>
        </button>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:max-w-md bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--color-text-primary)]">
              Mi solicitud de cotización
            </h2>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              {items.length} {items.length === 1 ? 'equipo' : 'equipos'} · {totalUnidades} {totalUnidades === 1 ? 'unidad' : 'unidades'}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        {/* Aviso: NO es una compra */}
        <div className="mx-5 mt-4 flex items-start gap-2 p-3 rounded-lg bg-[#E8821C]/[0.08] border border-[#E8821C]/20">
          <Info size={14} className="text-[#E8821C] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            <strong className="text-[var(--color-text-primary)]">Esto no es una compra.</strong> Es una
            solicitud de cotización formal. Un asesor PARMONCA te contactará en menos de 2 horas hábiles
            con disponibilidad, condiciones de pago y plazos de entrega.
          </p>
        </div>

        {/* Lista de items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList size={32} className="text-[var(--color-text-muted)]/40 mx-auto mb-3" />
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                Aún no agregaste equipos
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1.5 max-w-[220px] mx-auto">
                Recorre el catálogo y dale click a <strong>+ Agregar a la cotización</strong> para juntar todo lo que te interesa en una sola solicitud.
              </p>
              <Link
                href="/productos"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 mt-4 h-9 px-4 rounded-full bg-[#E8821C] hover:bg-[#FF9F43] text-white text-[12px] font-semibold"
              >
                Ver catálogo
                <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.key}
                className="flex gap-3 p-3 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)]"
              >
                <Link
                  href={item.tipo === 'producto' ? `/productos/${item.ref}` : `/repuestos/${item.ref}`}
                  onClick={() => setOpen(false)}
                  className="w-16 h-16 rounded-lg bg-[var(--color-surface)] flex items-center justify-center overflow-hidden shrink-0"
                >
                  {item.imagen ? (
                    <Image src={item.imagen} alt={item.modelo} width={64} height={64} className="object-contain" unoptimized />
                  ) : item.tipo === 'repuesto' ? (
                    <Wrench size={20} className="text-[var(--color-text-muted)]/40" />
                  ) : (
                    <Package size={20} className="text-[var(--color-text-muted)]/40" />
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#E8821C] truncate">
                        {item.marca || (item.tipo === 'repuesto' ? 'Repuesto' : '—')}
                      </p>
                      <Link
                        href={item.tipo === 'producto' ? `/productos/${item.ref}` : `/repuestos/${item.ref}`}
                        onClick={() => setOpen(false)}
                        className="text-[13px] font-bold text-[var(--color-text-primary)] hover:text-[#E8821C] truncate block leading-tight"
                      >
                        {item.modelo}
                      </Link>
                      {item.categoria && (
                        <p className="text-[10px] text-[var(--color-text-muted)] truncate">{item.categoria}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.key)}
                      className="p-1 text-[var(--color-text-muted)] hover:text-rose-400 shrink-0"
                      aria-label="Quitar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCantidad(item.key, item.cantidad - 1)}
                        className="w-6 h-6 rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:border-[#E8821C]/40"
                        aria-label="Disminuir"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-7 text-center text-[12px] font-bold font-mono">{item.cantidad}</span>
                      <button
                        type="button"
                        onClick={() => setCantidad(item.key, item.cantidad + 1)}
                        className="w-6 h-6 rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:border-[#E8821C]/40"
                        aria-label="Aumentar"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <p className="text-[12px] font-bold font-mono text-[var(--color-text-primary)]">
                      {item.precio > 0 ? fmt(item.precio * item.cantidad) : <span className="text-[10px] font-sans font-normal text-[var(--color-text-muted)]">Por cotizar</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer con CTA */}
        {items.length > 0 && (
          <footer className="border-t border-[var(--color-border)] px-5 py-4 space-y-3 bg-[var(--color-surface)]">
            {totalEstimado > 0 && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Estimado</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] italic">No incluye {impuesto} · sujeto a cotización formal</p>
                </div>
                <p className="text-[20px] font-mono font-bold text-[var(--color-text-primary)]">{fmt(totalEstimado)}</p>
              </div>
            )}
            <Link
              href="/cotizar?desde=carrito"
              onClick={() => setOpen(false)}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#E8821C] to-[#C96A10] hover:from-[#FF9F43] hover:to-[#E8821C] text-white font-semibold flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(232,130,28,0.3)] active:scale-[0.98] transition-all"
            >
              Solicitar cotización formal
              <ArrowRight size={15} />
            </Link>
            <p className="text-[10px] text-center text-[var(--color-text-muted)]">
              Sin compromiso · respuesta en 2 horas hábiles
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}
