'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Search, Menu, Plus, Sparkles } from 'lucide-react';
import { notificaciones } from '@/lib/demo-data';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [search, setSearch] = useState('');
  const unread = notificaciones.filter(n => !n.leida).length;

  return (
    <header className="h-14 glass-strong flex items-center justify-between px-4 lg:px-5 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-zinc-500"
        >
          <Menu size={18} />
        </button>

        <div className="relative max-w-sm flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#E8821C]/30 focus:bg-white/[0.06] transition-all"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <Link
          href="/cotizaciones/nueva"
          className="hidden sm:flex items-center gap-1.5 h-8 px-3.5 bg-gradient-to-r from-[#E8821C] to-[#C96A10] hover:from-[#FF9F43] hover:to-[#E8821C] text-white text-[13px] font-semibold rounded-lg transition-all active:scale-[0.97] glow-brand-sm"
        >
          <Sparkles size={13} />
          <span>Cotizar</span>
        </Link>

        <Link
          href="/cotizaciones/nueva"
          className="sm:hidden p-1.5 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white"
        >
          <Plus size={16} />
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#E8821C] rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-[0_0_8px_#E8821C80]">
                {unread}
              </span>
            )}
          </button>

          {showNotif && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
              <div className="absolute right-0 top-10 w-80 glass-strong rounded-xl overflow-hidden z-50 shadow-2xl shadow-black/40">
                <div className="px-4 py-2.5 border-b border-white/[0.06]">
                  <h3 className="font-semibold text-[13px] text-zinc-300">Notificaciones</h3>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notificaciones.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link || '#'}
                      onClick={() => setShowNotif(false)}
                      className={`block px-4 py-2.5 hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] last:border-0 ${!n.leida ? 'bg-[#E8821C]/[0.04]' : ''}`}
                    >
                      <p className="text-[13px] font-medium text-zinc-300">{n.titulo}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">{n.mensaje}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
