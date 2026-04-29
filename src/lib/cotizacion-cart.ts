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
    return parsed as CartState;
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
    setState(prev => {
      const existing = prev.items.find(i => i.key === item.key);
      if (existing) {
        return {
          items: prev.items.map(i =>
            i.key === item.key ? { ...i, cantidad: i.cantidad + cantidad } : i
          ),
        };
      }
      return { items: [...prev.items, { ...item, cantidad }] };
    });
  }, []);

  const setCantidad = useCallback((key: string, cantidad: number) => {
    if (cantidad <= 0) {
      setState(prev => ({ items: prev.items.filter(i => i.key !== key) }));
    } else {
      setState(prev => ({
        items: prev.items.map(i => i.key === key ? { ...i, cantidad } : i),
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

  return {
    items,
    totalUnidades,
    totalEstimado,
    addItem,
    setCantidad,
    removeItem,
    clear,
  };
}
