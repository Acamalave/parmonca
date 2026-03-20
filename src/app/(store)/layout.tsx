'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, ShoppingCart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen mesh-bg">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/productos" className="flex items-center">
            {/* Mobile: solo isotipo */}
            <Image src="/images/isotipo-white.png" alt="PARMONCA" width={36} height={36} className="sm:hidden" />
            {/* Desktop: logo sin subtitulo */}
            <Image src="/images/logo-white-clean.png" alt="PARMONCA" width={200} height={50} className="hidden sm:block h-9 w-auto object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/productos" className="text-[13px] text-zinc-400 hover:text-white transition-colors">Maquinaria</Link>
            <Link href="/productos#montacarga" className="text-[13px] text-zinc-400 hover:text-white transition-colors">Montacargas</Link>
            <Link href="/productos#apilador" className="text-[13px] text-zinc-400 hover:text-white transition-colors">Apiladores</Link>
            <Link href="/cotizar" className="text-[13px] text-zinc-400 hover:text-white transition-colors">Cotizar</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/cotizar"
              className="flex items-center gap-1.5 h-9 px-4 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold rounded-full transition-all hover:shadow-[0_0_20px_#E8821C40] active:scale-[0.97]">
              <Zap size={14} />
              Cotizar Ahora
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-zinc-400 hover:text-white">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.06] px-4 py-4 space-y-3">
            <Link href="/productos" onClick={() => setMenuOpen(false)} className="block text-[14px] text-zinc-300 hover:text-white">Maquinaria</Link>
            <Link href="/cotizar" onClick={() => setMenuOpen(false)} className="block text-[14px] text-zinc-300 hover:text-white">Cotizar</Link>
          </div>
        )}
      </nav>

      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/images/isotipo-white.png" alt="PARMONCA" width={24} height={24} />
              <span className="text-[13px] text-zinc-600">Partes y Montacargas</span>
            </div>
            <p className="text-[11px] text-zinc-700">Panama | Costa Rica | Venezuela | Guatemala | Honduras | Nicaragua | Haiti</p>
            <Link href="/login" className="text-[11px] text-zinc-700 hover:text-[#E8821C] transition-colors">Acceso Colaboradores</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
