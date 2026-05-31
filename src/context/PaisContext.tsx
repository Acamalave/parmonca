'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Pais = 'PA' | 'CR';
export type Moneda = 'USD' | 'CRC';

export const PAIS_COOKIE = 'parmonca_pais';

export const PAISES: Record<Pais, { nombre: string; bandera: string; moneda: Moneda; locale: string }> = {
  PA: { nombre: 'Panamá', bandera: '🇵🇦', moneda: 'USD', locale: 'es-PA' },
  CR: { nombre: 'Costa Rica', bandera: '🇨🇷', moneda: 'CRC', locale: 'es-CR' },
};

interface PaisContextType {
  pais: Pais;
  setPais: (p: Pais) => void;
  moneda: Moneda;
  locale: string;
  info: (typeof PAISES)[Pais];
}

const PaisContext = createContext<PaisContextType | undefined>(undefined);

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  // 1 año, disponible en todo el sitio.
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function normalize(value: string | null): Pais {
  return value === 'CR' ? 'CR' : 'PA';
}

/**
 * Provee el país seleccionado. Fuente de verdad: la cookie `parmonca_pais`,
 * que el middleware fija por geolocalización en la primera visita y que el
 * selector manual sobreescribe. Default seguro: PA (USD).
 */
export function PaisProvider({
  children,
  initialPais,
}: {
  children: ReactNode;
  initialPais?: Pais;
}) {
  const [pais, setPaisState] = useState<Pais>(initialPais ?? 'PA');

  useEffect(() => {
    // Reconcilia con la cookie real del navegador tras montar.
    const fromCookie = normalize(readCookie(PAIS_COOKIE));
    setPaisState(fromCookie);
  }, []);

  const setPais = (p: Pais) => {
    setPaisState(p);
    writeCookie(PAIS_COOKIE, p);
  };

  const info = PAISES[pais];

  return (
    <PaisContext.Provider value={{ pais, setPais, moneda: info.moneda, locale: info.locale, info }}>
      {children}
    </PaisContext.Provider>
  );
}

export function usePais() {
  const ctx = useContext(PaisContext);
  if (!ctx) throw new Error('usePais must be used within PaisProvider');
  return ctx;
}
