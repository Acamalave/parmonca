'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Zap, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen mesh-bg">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/productos" className="flex items-center">
            {/* Mobile: logo con nombre */}
            <Image src={isDark ? '/images/logo-white-clean.png' : '/images/logo-dark.png'} alt="PARMONCA" width={160} height={40} className="sm:hidden h-8 w-auto object-contain" />
            {/* Desktop: logo completo más grande */}
            <Image src={isDark ? '/images/logo-white-clean.png' : '/images/logo-dark.png'} alt="PARMONCA" width={200} height={50} className="hidden sm:block h-10 w-auto object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/productos" className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Maquinaria</Link>
            <Link href="/productos#montacarga" className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Montacargas</Link>
            <Link href="/productos#apilador" className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Apiladores</Link>
            <Link href="/cotizar" className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Cotizar</Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all"
              aria-label="Cambiar tema"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/cotizar"
              className="flex items-center gap-1.5 h-9 px-4 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold rounded-full transition-all hover:shadow-[0_0_20px_#E8821C40] active:scale-[0.97]">
              <Zap size={14} />
              Cotizar Ahora
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] px-4 py-4 space-y-3">
            <Link href="/productos" onClick={() => setMenuOpen(false)} className="block text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Maquinaria</Link>
            <Link href="/cotizar" onClick={() => setMenuOpen(false)} className="block text-[14px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">Cotizar</Link>
          </div>
        )}
      </nav>

      <main className="pt-16">
        {children}
      </main>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/50760000000?text=Hola%20PARMONCA%2C%20me%20interesa%20informaci%C3%B3n%20sobre%20sus%20montacargas."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:shadow-[0_4px_30px_rgba(37,211,102,0.6)] hover:scale-110 transition-all active:scale-95 group"
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg text-[12px] font-medium text-[var(--color-text-primary)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Escríbenos por WhatsApp
        </span>
      </a>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col items-center gap-6 text-center">
            <Image src={isDark ? '/images/logo-white.png' : '/images/logo-dark.png'} alt="PARMONCA - Partes y Montacargas" width={220} height={60} className="h-12 w-auto object-contain opacity-70" />
            <p className="text-[11px] text-[var(--color-text-muted)]">Panama | Costa Rica | Venezuela | Guatemala | Honduras | Nicaragua | Haiti</p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-[11px] text-[var(--color-text-muted)] hover:text-[#E8821C] transition-colors">Acceso Colaboradores</Link>
              <span className="text-[var(--color-text-muted)]">•</span>
              <a href="https://www.accioscore.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-[var(--color-text-muted)] hover:text-[#7c3aed] transition-colors">
                Desarrollado por <span className="text-[#7c3aed] font-medium">Accios Core</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
