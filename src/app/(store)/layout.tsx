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
