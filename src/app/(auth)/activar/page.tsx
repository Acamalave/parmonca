'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Shield, AlertCircle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { createClient } from '@/lib/supabase/client';

const PIN_LENGTH = 6;

function ActivarContent() {
  const router = useRouter();
  const { isDark } = useTheme();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const supabase = createClient();

  const [step, setStep] = useState<'crear' | 'confirmar' | 'listo'>('crear');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loginEmail, setLoginEmail] = useState<string | null>(null);

  const currentPin = step === 'crear' ? pin1 : pin2;
  const setCurrentPin = step === 'crear' ? setPin1 : setPin2;

  const handleDigit = (d: string) => {
    setError(null);
    if (currentPin.length >= PIN_LENGTH) return;
    setCurrentPin(currentPin + d);
  };

  const handleErase = () => {
    setError(null);
    setCurrentPin(currentPin.slice(0, -1));
  };

  useEffect(() => {
    if (step === 'crear' && pin1.length === PIN_LENGTH) {
      const t = setTimeout(() => setStep('confirmar'), 150);
      return () => clearTimeout(t);
    }
  }, [pin1, step]);

  useEffect(() => {
    if (step === 'confirmar' && pin2.length === PIN_LENGTH) {
      if (pin1 !== pin2) {
        setError('Los PINs no coinciden. Intenta de nuevo.');
        setPin1('');
        setPin2('');
        setStep('crear');
        return;
      }
      submitPin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin2, step]);

  const submitPin = async () => {
    if (!token) {
      setError('Link de activación inválido');
      return;
    }
    setSaving(true);
    setError(null);

    const { data, error: rpcErr } = await supabase.rpc('parmonca_activar_con_pin', {
      p_activation_token: token,
      p_pin: pin1,
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setSaving(false);
      setStep('crear');
      setPin1('');
      setPin2('');
      return;
    }

    const resultEmail = (data as { email?: string })?.email;
    if (!resultEmail) {
      setError('No se pudo activar. Pide un nuevo link al administrador.');
      setSaving(false);
      return;
    }

    // Auto sign-in with the new PIN
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: resultEmail,
      password: pin1,
    });

    if (signInErr) {
      setError('PIN creado, pero hubo un problema al iniciar sesión. Intenta desde /login.');
      setSaving(false);
      return;
    }

    setLoginEmail(resultEmail);
    setStep('listo');
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 1400);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full glass-strong rounded-2xl p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-rose-400 mb-3" />
          <h1 className="font-display text-lg font-bold text-[var(--color-text-primary)]">Link inválido</h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
            Este enlace de activación no es válido. Pídele al administrador uno nuevo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 bg-[var(--color-void)]">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#E8821C]/[0.04] rounded-full blur-[150px] animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-[380px]">
        <div className="text-center mb-8">
          <Image
            src={isDark ? '/images/isotipo-white.png' : '/images/isotipo.png'}
            alt="PARMONCA"
            width={48}
            height={48}
            className="mx-auto mb-4"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 text-[10px] font-semibold uppercase tracking-wider text-[#E8821C] mb-4">
            <Shield size={11} /> Activar cuenta
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {step === 'listo' ? '¡Listo!' : step === 'crear' ? 'Crea tu PIN de acceso' : 'Confírmalo otra vez'}
          </h1>
          <p className="text-[var(--color-text-muted)] text-[13px] mt-2">
            {step === 'listo'
              ? `Tu PIN está activo. Entraremos como ${loginEmail}.`
              : step === 'crear'
                ? 'Elige 6 dígitos que solo tú conozcas. Los usarás cada vez que inicies sesión.'
                : 'Ingresa el mismo PIN una vez más para confirmarlo.'}
          </p>
        </div>

        {/* PIN display */}
        <div className="flex justify-center gap-2.5 mb-8">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < currentPin.length;
            return (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  step === 'listo'
                    ? 'bg-emerald-500 scale-110'
                    : filled
                      ? 'bg-gradient-to-br from-[#E8821C] to-[#C96A10] scale-110'
                      : 'bg-[var(--color-surface-glass)] border border-[var(--color-border)]'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[12px]">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step !== 'listo' && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleDigit(String(n))}
                disabled={saving}
                className="h-14 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-2xl font-num font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] active:scale-[0.96] transition-all disabled:opacity-50"
              >
                {n}
              </button>
            ))}
            <div className="h-14" />
            <button
              type="button"
              onClick={() => handleDigit('0')}
              disabled={saving}
              className="h-14 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-2xl font-num font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] active:scale-[0.96] transition-all disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleErase}
              disabled={!currentPin || saving}
              className="h-14 rounded-xl text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] disabled:opacity-30 flex items-center justify-center"
            >
              Borrar
            </button>
          </div>
        )}

        {step === 'listo' && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-[14px] font-medium">
            <Check size={18} /> PIN configurado, entrando…
          </div>
        )}

        {saving && step !== 'listo' && (
          <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)] text-[12px]">
            <div className="w-4 h-4 border-2 border-[#E8821C]/30 border-t-[#E8821C] rounded-full animate-spin" />
            Guardando…
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivarPage() {
  return (
    <Suspense>
      <ActivarContent />
    </Suspense>
  );
}
