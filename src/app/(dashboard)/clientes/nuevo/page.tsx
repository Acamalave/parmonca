'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, AlertCircle, User, Building2, Mail, Phone, MapPin, Factory, Hash, StickyNote } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/lib/supabase/use-profile';

const PAISES = ['Panamá', 'Costa Rica', 'Venezuela', 'Guatemala', 'Honduras', 'Nicaragua', 'Haiti', 'El Salvador', 'República Dominicana', 'Otro'];

export default function NuevoClientePage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile } = useProfile();
  const router = useRouter();

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    empresa: '',
    telefono: '',
    pais: 'Panamá',
    ciudad: '',
    industria: '',
    ruc: '',
    tipo: 'lead' as 'lead' | 'customer',
    notas: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim().toLowerCase(),
      empresa: form.empresa.trim() || null,
      telefono: form.telefono.trim() || null,
      pais: form.pais || null,
      ciudad: form.ciudad.trim() || null,
      industria: form.industria.trim() || null,
      ruc: form.ruc.trim() || null,
      tipo: form.tipo,
      estado: 'activo' as const,
      notas: form.notas.trim() || null,
      comercial_asignado: profile?.id ?? null,
    };

    if (!payload.nombre || !payload.email) {
      setError('Nombre y email son obligatorios.');
      setSaving(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setError('El email no es válido.');
      setSaving(false);
      return;
    }

    const { data, error: dbErr } = await supabase
      .from('parmonca_clientes')
      .insert(payload)
      .select('id')
      .single();

    if (dbErr) {
      setError(
        dbErr.code === '23505'
          ? 'Ya existe un cliente con ese email. Puedes buscarlo en el listado.'
          : dbErr.message
      );
      setSaving(false);
      return;
    }

    router.push(`/clientes/${data?.id || ''}`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Link href="/clientes" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors">
        <ArrowLeft size={14} />Volver a Clientes
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Nuevo Cliente</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          Se asignará automáticamente a ti como comercial responsable.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-xl p-5 space-y-4">
        {/* Tipo */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Tipo</label>
          <div className="flex gap-2">
            {(['lead', 'customer'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => update('tipo', t)}
                className={`flex-1 h-9 rounded-lg text-[12px] font-semibold transition-all ${
                  form.tipo === t
                    ? 'bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white'
                    : 'bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[#E8821C]/30'
                }`}
              >
                {t === 'lead' ? 'Lead' : 'Cliente activo'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field icon={User} label="Nombre *" value={form.nombre} onChange={v => update('nombre', v)} placeholder="Juan Pérez" />
          <Field icon={Building2} label="Empresa" value={form.empresa} onChange={v => update('empresa', v)} placeholder="ACME Logistics" />
          <Field icon={Mail} label="Email *" value={form.email} onChange={v => update('email', v)} placeholder="juan@acme.com" type="email" />
          <Field icon={Phone} label="Teléfono" value={form.telefono} onChange={v => update('telefono', v)} placeholder="+507 6000-0000" />

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
              <MapPin size={11} />País
            </label>
            <select
              value={form.pais}
              onChange={e => update('pais', e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/40"
            >
              {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Field icon={MapPin} label="Ciudad" value={form.ciudad} onChange={v => update('ciudad', v)} placeholder="Ciudad de Panamá" />

          <Field icon={Factory} label="Industria" value={form.industria} onChange={v => update('industria', v)} placeholder="Logística / Manufactura / etc." />
          <Field icon={Hash} label="RUC / NIT" value={form.ruc} onChange={v => update('ruc', v)} placeholder="Opcional" />
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
            <StickyNote size={11} />Notas internas
          </label>
          <textarea
            rows={3}
            value={form.notas}
            onChange={e => update('notas', e.target.value)}
            placeholder="Contexto del cliente, necesidades, etc."
            className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 resize-none"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[12px]">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <Link href="/clientes" className="h-10 px-4 rounded-xl border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-glass)] inline-flex items-center">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#E8821C] to-[#C96A10] hover:from-[#FF9F43] hover:to-[#E8821C] text-white text-[13px] font-semibold disabled:opacity-60 glow-brand-sm inline-flex items-center gap-1.5"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Check size={14} />Guardar cliente</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  icon: Icon, label, value, onChange, placeholder, type = 'text',
}: {
  icon: typeof User;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
        <Icon size={11} />{label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
      />
    </div>
  );
}
