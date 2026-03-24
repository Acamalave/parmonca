'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[var(--color-void)]">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#E8821C]/[0.04] rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#E8821C]/[0.03] rounded-full blur-[120px]" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E8821C]/20 to-transparent" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[420px] mx-4">
        {/* Brand */}
        <div className="text-center mb-10">
          <Image
            src={isDark ? '/images/isotipo-white.png' : '/images/isotipo.png'}
            alt="PARMONCA"
            width={56}
            height={56}
            className="mx-auto mb-5"
          />
          <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">
            PARMONCA
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-2 tracking-wide">
            Plataforma Inteligente de Ventas
          </p>
        </div>

        {/* Form */}
        <div className="glass-strong rounded-2xl p-7">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mb-2">
                Correo electronico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@parmonca.com"
                className="w-full h-11 px-4 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 focus:bg-[var(--color-surface-hover)] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mb-2">
                Contrasena
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 focus:bg-[var(--color-surface-hover)] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[#E8821C] to-[#C96A10] hover:from-[#FF9F43] hover:to-[#E8821C] text-white font-semibold rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-60 glow-brand-sm flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--color-text-muted)] mt-5">
          Demo — usa cualquier credencial
        </p>
      </div>
    </div>
  );
}
