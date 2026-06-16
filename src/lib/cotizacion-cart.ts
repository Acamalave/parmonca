'use client';

/**
 * Carrito de "Solicitud de cotización" para visitantes anónimos del landing.
 *
 * IMPORTANTE: esto NO es un carrito de compras. Es una lista de equipos sobre
 * los que el cliente quiere recibir cotización formal de un asesor PARMONCA.
 * No procesa pagos. No reserva stock. Sólo agrupa los items que llegarán al
 * formulario de /cotizar para enviarse en una sola solicitud al equipo
 * comercial.
 *
 * Persistencia: localStorage (sobrevive recargas y permite seguir navegando
 * el catálogo sin perder lo agregado).
 */

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'parmonca_cotizacion_cart_v1';

export type MonedaCarrito = 'USD' | 'CRC';

export type CartItem = {
  /** ID estable: "producto-<slug>" o "repuesto-<uuid>" */
  key: string;
  tipo: 'producto' | 'repuesto';
  /** Para construir el deeplink a /productos/[slug] o /repuestos/[id] */
  ref: string;
  modelo: string;
  marca: string | null;
  categoria: string | null;
  imagen: string | null;
  /** Precio guardado al momento de agregar (puede ser 0 si "a cotizar") */
  precio: number;
  /** Moneda del precio: USD (Panamá / maquinaria) o CRC (Costa Rica) */
  moneda: MonedaCarrito;
  cantidad: number;
};

type CartState = {
  items: CartItem[];
};

// ────────────────────────────────────────────────────────────────────────────
// Store sin React Context (evita problemas de SSR + permite usarse en
// múltiples componentes sin re-renders innecesarios).
// ────────────────────────────────────────────────────────────────────────────

let memoryState: CartState = { items: [] };
const listeners = new Set<() => void>();

function readFromStorage(): CartState {
  if (typeof window === 'undefined') return { items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    // Backfill de moneda para carritos guardados antes de multi-país.
    const items = (parsed.items as CartItem[]).map(i => ({
      ...i,
      moneda: i.moneda === 'CRC' ? 'CRC' : 'USD',
    } as CartItem));
    return { items };
  } catch {
    return { items: [] };
  }
}

function writeToStorage(state: CartState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode errors
  }
}

function emit() {
  listeners.forEach(l => l());
}

function setState(updater: (prev: CartState) => CartState) {
  memoryState = updater(memoryState);
  writeToStorage(memoryState);
  emit();
}

// Inicializa al import (en cliente)
if (typeof window !== 'undefined') {
  memoryState = readFromStorage();
  // Sincroniza si otra pestaña modifica el localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      memoryState = readFromStorage();
      emit();
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Hook público
// ────────────────────────────────────────────────────────────────────────────

export function useCotizacionCart() {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);
  const getSnapshot = useCallback(() => memoryState, []);
  const getServerSnapshot = useCallback(() => ({ items: [] as CartItem[] }), []);
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Evitar mismatch SSR -> hidratamos al montar
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const items = hydrated ? state.items : [];

  const addItem = useCallback((item: Omit<CartItem, 'cantidad'>, cantidad = 1) => {
    // Sanitización: cantidad mínima 1 entero, precio no-negativo y finito.
    const safeCantidad = Math.max(1, Math.floor(Number.isFinite(cantidad) ? cantidad : 1));
    const safePrecio = Number.isFinite(item.precio) && item.precio >= 0 ? item.precio : 0;
    const safeMoneda: MonedaCarrito = item.moneda === 'CRC' ? 'CRC' : 'USD';
    const safeItem = { ...item, precio: safePrecio, moneda: safeMoneda };
    setState(prev => {
      const existing = prev.items.find(i => i.key === safeItem.key);
      if (existing) {
        return {
          items: prev.items.map(i =>
            i.key === safeItem.key ? { ...i, cantidad: i.cantidad + safeCantidad } : i
          ),
        };
      }
      return { items: [...prev.items, { ...safeItem, cantidad: safeCantidad }] };
    });
  }, []);

  const setCantidad = useCallback((key: string, cantidad: number) => {
    const safe = Math.floor(Number.isFinite(cantidad) ? cantidad : 0);
    if (safe <= 0) {
      setState(prev => ({ items: prev.items.filter(i => i.key !== key) }));
    } else {
      setState(prev => ({
        items: prev.items.map(i => i.key === key ? { ...i, cantidad: safe } : i),
      }));
    }
  }, []);

  const removeItem = useCallback((key: string) => {
    setState(prev => ({ items: prev.items.filter(i => i.key !== key) }));
  }, []);

  const clear = useCallback(() => {
    setState(() => ({ items: [] }));
  }, []);

  const totalUnidades = items.reduce((a, i) => a + i.cantidad, 0);
  const totalEstimado = items.reduce((a, i) => a + i.precio * i.cantidad, 0);

  // Subtotales por moneda — un carrito puede mezclar USD (PA/maquinaria) y CRC
  // (CR) si el visitante cambió de país con ítems ya agregados. Sumar todo en
  // un solo número no tendría sentido, así que agrupamos.
  const totalesPorMoneda = items.reduce<Record<MonedaCarrito, number>>((acc, i) => {
    if (i.precio > 0) acc[i.moneda] = (acc[i.moneda] || 0) + i.precio * i.cantidad;
    return acc;
  }, { USD: 0, CRC: 0 });

  return {
    items,
    totalUnidades,
    totalEstimado,
    totalesPorMoneda,
    addItem,
    setCantidad,
    removeItem,
    clear,
    /** false en SSR + primer render del cliente; true tras montar.
     *  Útil para distinguir "carrito todavía no se sabe" de "carrito vacío". */
    hydrated,
  };
}
