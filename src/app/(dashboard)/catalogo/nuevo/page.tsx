'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Check, Package, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const CATEGORIAS = [
  'Montacarga Electrico',
  'Montacarga Combustion',
  'Apilador Electrico',
  'Traspaleta Electrica',
  'Mastil con Pantografo',
  'Mastil Retractil',
  'Plataforma Elevadora',
];

const MOTORES = ['Electrico', 'Diesel', 'Gas/LPG', 'Dual Fuel'];

const MARCAS = [
  'ANDINO','MEGALIFT','UNILIFT','CROWN','CLARK','DOOSAN','TOYOTA','MITSUBISHI',
  'BT','JUNGHEINRICH','CATERPILLAR','HYSTER','YALE','STILL','RAYMOND','HELI',
  'BENDI','NARROW AISLE','POWER LIFT','HAYTER','JLG','CUSHMAN','TRUCKS','BOBCAT','Otro',
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NuevoProductoPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [form, setForm] = useState({
    modelo: '',
    marca: 'ANDINO',
    categoria: 'Montacarga Electrico',
    motor: 'Electrico',
    badge: '',
    descripcion: '',
    imagen_url: '',

    capacidad_kg: '',
    ancho_pasillo_mm: '',
    longitud_sin_horquillas_mm: '',
    ancho_total_mm: '',
    altura_chasis_mm: '',
    mastil_mm: '',

    precio_venta: '',
    precio_alquiler_1ano: '',
    precio_alquiler_2anos: '',
    precio_alquiler_3anos: '',
    precio_alquiler_5anos: '',

    activo: true,
    destacado: false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  const numberOrNull = (v: string) => {
    if (!v.trim()) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const modelo = form.modelo.trim();
    if (!modelo) { setError('El modelo es obligatorio.'); return; }
    if (!form.marca) { setError('Selecciona una marca.'); return; }

    setSaving(true);

    const slug = slugify(`${form.marca}-${modelo}`);

    const { data, error: dbErr } = await supabase
      .from('parmonca_productos')
      .insert({
        slug,
        modelo,
        marca: form.marca,
        categoria: form.categoria,
        motor: form.motor || null,
        badge: form.badge.trim() || null,
        descripcion: form.descripcion.trim() || null,
        imagen_url: form.imagen_url.trim() || null,
        capacidad_kg: numberOrNull(form.capacidad_kg),
        ancho_pasillo_mm: numberOrNull(form.ancho_pasillo_mm),
        longitud_sin_horquillas_mm: numberOrNull(form.longitud_sin_horquillas_mm),
        ancho_total_mm: numberOrNull(form.ancho_total_mm),
        altura_chasis_mm: numberOrNull(form.altura_chasis_mm),
        mastil_mm: numberOrNull(form.mastil_mm),
        precio_venta: numberOrNull(form.precio_venta),
        precio_alquiler_1ano:  numberOrNull(form.precio_alquiler_1ano),
        precio_alquiler_2anos: numberOrNull(form.precio_alquiler_2anos),
        precio_alquiler_3anos: numberOrNull(form.precio_alquiler_3anos),
        precio_alquiler_5anos: numberOrNull(form.precio_alquiler_5anos),
        activo: form.activo,
        destacado: form.destacado,
        fuente: 'manual',
      })
      .select('id, slug')
      .single();

    setSaving(false);

    if (dbErr) {
      setError(
        dbErr.code === '23505'
          ? `Ya existe un producto con el slug "${slug}". Cambia el modelo o la marca para diferenciarlo.`
          : dbErr.message
      );
      return;
    }

    router.push(`/catalogo/${data?.id || ''}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link href="/catalogo" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors">
        <ArrowLeft size={14} />Volver al Catálogo
      </Link>

      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
          <Package size={22} className="text-[#E8821C]" />
          Nuevo producto
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          Si lo marcas como activo, aparece de inmediato en el landing público de PARMONCA.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-xl p-5 space-y-5">
        {/* Identidad */}
        <section className="space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Identidad</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Modelo *" value={form.modelo} onChange={v => update('modelo', v)} placeholder="Ej: TAN35D" />
            <Select label="Marca *" value={form.marca} onChange={v => update('marca', v)} options={MARCAS} />
            <Select label="Categoría *" value={form.categoria} onChange={v => update('categoria', v)} options={CATEGORIAS} />
            <Select label="Motor" value={form.motor} onChange={v => update('motor', v)} options={MOTORES} />
            <Field label="Badge (opcional)" value={form.badge} onChange={v => update('badge', v)} placeholder='Ej: "Más vendido"' />
          </div>
          <Textarea label="Descripción" value={form.descripcion} onChange={v => update('descripcion', v)} placeholder="Texto que verá el cliente en la ficha del producto." rows={3} />
          <Field
            label="URL de imagen"
            icon={ImageIcon}
            value={form.imagen_url}
            onChange={v => update('imagen_url', v)}
            placeholder="https://… (si la dejas vacía se muestra un placeholder)"
          />
        </section>

        {/* Especificaciones */}
        <section className="space-y-3 pt-3 border-t border-[var(--color-border)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Especificaciones técnicas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Capacidad (kg)" type="number" value={form.capacidad_kg} onChange={v => update('capacidad_kg', v)} placeholder="3500" />
            <Field label="Ancho pasillo (mm)" type="number" value={form.ancho_pasillo_mm} onChange={v => update('ancho_pasillo_mm', v)} placeholder="2510" />
            <Field label="Largo s/horquillas (mm)" type="number" value={form.longitud_sin_horquillas_mm} onChange={v => update('longitud_sin_horquillas_mm', v)} placeholder="2822" />
            <Field label="Ancho total (mm)" type="number" value={form.ancho_total_mm} onChange={v => update('ancho_total_mm', v)} placeholder="1200" />
            <Field label="Altura chasis (mm)" type="number" value={form.altura_chasis_mm} onChange={v => update('altura_chasis_mm', v)} placeholder="2180" />
            <Field label="Mástil (mm)" type="number" value={form.mastil_mm} onChange={v => update('mastil_mm', v)} placeholder="4500" />
          </div>
        </section>

        {/* Precios */}
        <section className="space-y-3 pt-3 border-t border-[var(--color-border)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            Precios (USD) · si los configuras se muestran en el landing
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Precio venta" type="number" prefix="$" value={form.precio_venta} onChange={v => update('precio_venta', v)} placeholder="22000" />
            <Field label="Alquiler 1 año"  type="number" prefix="$" value={form.precio_alquiler_1ano}  onChange={v => update('precio_alquiler_1ano', v)} placeholder="10800" />
            <Field label="Alquiler 2 años" type="number" prefix="$" value={form.precio_alquiler_2anos} onChange={v => update('precio_alquiler_2anos', v)} placeholder="19872" />
            <Field label="Alquiler 3 años" type="number" prefix="$" value={form.precio_alquiler_3anos} onChange={v => update('precio_alquiler_3anos', v)} placeholder="27540" />
            <Field label="Alquiler 5 años" type="number" prefix="$" value={form.precio_alquiler_5anos} onChange={v => update('precio_alquiler_5anos', v)} placeholder="40500" />
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] italic">
            Los productos sin precio venden por cotización (botón &quot;Pedir cotización&quot; en el landing).
          </p>
        </section>

        {/* Visibilidad */}
        <section className="space-y-3 pt-3 border-t border-[var(--color-border)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Visibilidad</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle label="Activo (visible en el landing)" checked={form.activo} onChange={v => update('activo', v)} />
            <Toggle label="Destacado (aparece arriba en la lista)" checked={form.destacado} onChange={v => update('destacado', v)} />
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[12px]">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
          <Link href="/catalogo" className="h-10 px-4 rounded-xl border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-glass)] inline-flex items-center">
            Cancelar
          </Link>
          <button type="submit" disabled={saving}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#E8821C] to-[#C96A10] hover:from-[#FF9F43] hover:to-[#E8821C] text-white text-[13px] font-semibold disabled:opacity-60 glow-brand-sm inline-flex items-center gap-1.5">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Check size={14} />Crear producto</>}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', prefix, icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; prefix?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">{label}</span>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-[13px] font-mono">{prefix}</span>}
        {Icon && <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-10 ${prefix || Icon ? 'pl-7' : 'pl-3'} pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40`}
        />
      </div>
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/40">
        {options.map(o => <option key={o} value={o}>{o || '—'}</option>)}
      </select>
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">{label}</span>
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 resize-none" />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-[#E8821C]' : 'bg-[var(--color-surface-glass)] border border-[var(--color-border)]'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      <span className="text-[12px] text-[var(--color-text-secondary)]">{label}</span>
    </label>
  );
}
