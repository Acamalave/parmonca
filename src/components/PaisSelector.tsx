'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePais, PAISES, type Pais } from '@/context/PaisContext';

/**
 * Selector de país (Panamá / Costa Rica). Determina qué catálogo y precios
 * ve el visitante. La elección se guarda en cookie y sobreescribe la
 * autodetección por geolocalización.
 */
export function PaisSelector() {
  const { pais, setPais, info } = usePais();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-full text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all"
        aria-label="Cambiar país"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{info.bandera}</span>
        <span className="hidden sm:inline">{info.nombre}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl glass-strong border border-[var(--color-border)] shadow-lg overflow-hidden z-50">
          {(Object.keys(PAISES) as Pais[]).map((p) => {
            const data = PAISES[p];
            const active = p === pais;
            return (
              <button
                key={p}
                onClick={() => {
                  setPais(p);
                  setOpen(false);
                }}
                className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] text-left transition-colors ${
                  active
                    ? 'bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span className="text-base leading-none">{data.bandera}</span>
                <span className="flex-1">{data.nombre}</span>
                <span className="text-[11px] text-[var(--color-text-muted)]">{data.moneda}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
