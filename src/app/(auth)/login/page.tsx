'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, AlertCircle, AtSign, Lock } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const [identificador, setIdentificador] = useState('');
  const [clave, setClave] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirectTo') || '/dashboard';
  const { isDark } = useTheme();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let emailParaLogin = identificador.trim();

    // If it doesn't look like an email, resolve via phone lookup
    if (!emailParaLogin.includes('@')) {
      const { data, error: rpcError } = await supabase.rpc('parmonca_email_por_identificador', {
        p_identificador: emailParaLogin,
      });
      if (rpcError || !data) {
        setError('No encontramos una cuenta con ese teléfono o email.');
        setLoading(false);
        return;
      }
      emailParaLogin = data as string;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: emailParaLogin,
      password: clave,
    });

    if (signInErr) {
      setError(
        signInErr.message === 'Invalid login credentials'
          ? 'Credenciales inválidas. Verifica tu PIN o contraseña temporal.'
          : signInErr.message
      );
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-void)]">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#E8821C]/[0.04] rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#E8821C]/[0.03] rounded-full blur-[120px]" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E8821C]/20 to-transparent" />
      </div>

      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 w-full max-w-[420px] mx-4">
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
            Acceso Colaboradores
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-7">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mb-2">
                Email o teléfono
              </label>
              <div className="relative">
                <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="tu@parmonca.com o 50760000000"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 focus:bg-[var(--color-surface-hover)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mb-2">
                PIN
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  inputMode="numeric"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="••••••"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 focus:bg-[var(--color-surface-hover)] transition-all tracking-widest"
                />
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
                ¿Primera vez? El administrador te envió un link para crear tu PIN.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[12px]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

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
          ¿Problemas para ingresar? Contacta a tu administrador.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
