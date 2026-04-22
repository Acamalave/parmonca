'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft, Shield, AlertCircle, LogOut } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { createClient } from '@/lib/supabase/client';

const PIN_LENGTH = 6;

export default function ConfigurarPinPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const supabase = createClient();

  const [step, setStep] = useState<'crear' | 'confirmar'>('crear');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Check user is authenticated
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login');
    });
  }, [router, supabase]);

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

  // Auto-advance to step 'confirmar' when first PIN is complete
  useEffect(() => {
    if (step === 'crear' && pin1.length === PIN_LENGTH) {
      const t = setTimeout(() => setStep('confirmar'), 150);
      return () => clearTimeout(t);
    }
  }, [pin1, step]);

  // When both PINs are complete, submit
  useEffect(() => {
    if (step === 'confirmar' && pin2.length === PIN_LENGTH) {
      if (pin1 !== pin2) {
        setError('Los PINs no coinciden. Intenta de nuevo.');
        setPin2('');
        setStep('crear');
        setPin1('');
        return;
      }
      submitPin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin2, step]);

  const submitPin = async () => {
    setSaving(true);
    setError(null);

    const { error: authErr } = await supabase.auth.updateUser({ password: pin1 });
    if (authErr) {
      setError('No se pudo guardar el PIN: ' + authErr.message);
      setSaving(false);
      setStep('crear');
      setPin1('');
      setPin2('');
      return;
    }

    const { error: rpcErr } = await supabase.rpc('parmonca_marcar_pin_configurado');
    if (rpcErr) {
      setError('No se pudo marcar el PIN como activo: ' + rpcErr.message);
      setSaving(false);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 1400);
  };

  const handleVolverAtras = () => {
    setError(null);
    setStep('crear');
    setPin2('');
  };

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
            <Shield size={11} /> Configura tu PIN
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {done ? '¡Listo!' : step === 'crear' ? 'Crea tu PIN de acceso' : 'Confírmalo otra vez'}
          </h1>
          <p className="text-[var(--color-text-muted)] text-[13px] mt-2">
            {done
              ? 'Tu PIN está activo. Ya puedes entrar.'
              : step === 'crear'
                ? '6 dígitos que solo tú conozcas. Lo usarás de aquí en adelante.'
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
                  done
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

        {!done && (
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
            <button
              type="button"
              onClick={step === 'confirmar' ? handleVolverAtras : undefined}
              disabled={step === 'crear' || saving}
              className="h-14 rounded-xl text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] disabled:opacity-0 flex items-center justify-center gap-1"
            >
              <ArrowLeft size={13} /> Cambiar
            </button>
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

        {done && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-[14px] font-medium">
            <Check size={18} /> PIN configurado
          </div>
        )}

        {saving && !done && (
          <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)] text-[12px]">
            <div className="w-4 h-4 border-2 border-[#E8821C]/30 border-t-[#E8821C] rounded-full animate-spin" />
            Guardando…
          </div>
        )}

        <form action="/api/auth/signout" method="post" className="mt-6 text-center">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)] hover:text-rose-400 transition-colors"
          >
            <LogOut size={11} /> Cancelar y cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
