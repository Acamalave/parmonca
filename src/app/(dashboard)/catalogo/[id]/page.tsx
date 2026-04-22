'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Upload, Check, Trash2, Eye, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Producto = {
  id: number;
  slug: string;
  modelo: string;
  marca: string | null;
  categoria: string | null;
  motor: string | null;
  mastil_mm: number | null;
  capacidad_kg: number | null;
  descripcion: string | null;
  ancho_pasillo_mm: number | null;
  longitud_sin_horquillas_mm: number | null;
  ancho_total_mm: number | null;
  altura_chasis_mm: number | null;
  imagen_url: string | null;
  imagen_local: string | null;
  precio_venta: number | null;
  precio_alquiler_diario: number | null;
  precio_alquiler_semanal: number | null;
  precio_alquiler_mensual: number | null;
  precio_alquiler_anual: number | null;
  activo: boolean;
  destacado: boolean;
  badge: string | null;
};

const CATEGORIAS = [
  'Montacarga Electrico',
  'Montacarga Combustion',
  'Apilador Electrico',
  'Traspaleta Electrica',
  'Mastil con Pantografo',
  'Mastil Retractil',
  'Plataforma Elevadora',
];

const MOTORES = ['', 'Electrico', 'Diesel', 'Gas/LPG', 'Dual Fuel'];

const MARCAS = [
  'ANDINO','MEGALIFT','UNILIFT','CROWN','CLARK','DOOSAN','TOYOTA','MITSUBISHI',
  'BT','JUNGHEINRICH','CATERPILLAR','HYSTER','YALE','STILL','RAYMOND','HELI',
  'BENDI','NARROW AISLE','POWER LIFT','HAYTER','JLG','CUSHMAN','TRUCKS','BOBCAT','Otro',
];

export default function EditProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = Number(id);
  const supabase = useMemo(() => createClient(), []);

  const [p, setP] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('parmonca_productos').select('*').eq('id', productId).single();
      if (error) setError(error.message);
      else setP(data as Producto);
      setLoading(false);
    })();
  }, [supabase, productId]);

  const update = <K extends keyof Producto>(key: K, value: Producto[K]) => {
    if (!p) return;
    setP({ ...p, [key]: value });
  };

  const numberOrNull = (v: string): number | null => {
    if (!v.trim()) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const handleUpload = async (file: File) => {
    if (!p) return;
    setUploading(true);
    setError(null);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${p.id}/${p.id}-${Date.now()}.${ext}`;
      const { error: upError } = await supabase.storage
        .from('parmonca-productos')
        .upload(path, file, { cacheControl: '86400', upsert: true, contentType: file.type });
      if (upError) throw upError;
      const { data } = supabase.storage.from('parmonca-productos').getPublicUrl(path);
      update('imagen_local', data.publicUrl);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!p) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const { error } = await supabase.from('parmonca_productos').update({
      modelo: p.modelo,
      marca: p.marca,
      categoria: p.categoria,
      motor: p.motor,
      mastil_mm: p.mastil_mm,
      capacidad_kg: p.capacidad_kg,
      descripcion: p.descripcion,
      ancho_pasillo_mm: p.ancho_pasillo_mm,
      longitud_sin_horquillas_mm: p.longitud_sin_horquillas_mm,
      ancho_total_mm: p.ancho_total_mm,
      altura_chasis_mm: p.altura_chasis_mm,
      imagen_local: p.imagen_local,
      precio_venta: p.precio_venta,
      precio_alquiler_diario: p.precio_alquiler_diario,
      precio_alquiler_semanal: p.precio_alquiler_semanal,
      precio_alquiler_mensual: p.precio_alquiler_mensual,
      precio_alquiler_anual: p.precio_alquiler_anual,
      activo: p.activo,
      destacado: p.destacado,
      badge: p.badge,
    }).eq('id', p.id);
    if (error) setError(error.message);
    else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--color-text-muted)] text-sm">Cargando…</div>;
  if (!p) return (
    <div className="max-w-2xl mx-auto">
      <Link href="/catalogo" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] mb-4"><ArrowLeft size={14} />Volver</Link>
      <div className="glass rounded-xl p-6 text-center text-[var(--color-text-secondary)] text-sm">Producto no encontrado{error ? `: ${error}` : ''}</div>
    </div>
  );

  const currentImg = p.imagen_local || p.imagen_url;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/catalogo" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C]">
          <ArrowLeft size={14} />Volver al catálogo
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/productos/${p.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[13px] hover:bg-[var(--color-surface-hover)] transition-all"
          >
            <Eye size={14} />Ver público
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white font-semibold text-[13px] disabled:opacity-60 transition-all active:scale-[0.97]"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            Guardar
          </button>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">ID #{p.id} · slug: {p.slug}</p>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{p.modelo}</h1>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px]">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[13px]">
          <Check size={14} className="mt-0.5 shrink-0" /><span>Cambios guardados. Ya se reflejan en el sitio público.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: image + flags */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Imagen</p>
            <div className="aspect-square rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center overflow-hidden mb-3">
              {currentImg ? (
                <Image src={currentImg} alt={p.modelo} width={320} height={320} className="object-contain w-full h-full" unoptimized />
              ) : (
                <p className="text-[12px] text-[var(--color-text-muted)]">Sin imagen</p>
              )}
            </div>
            <label className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] cursor-pointer hover:bg-[var(--color-surface-hover)] transition-all">
              {uploading ? <div className="w-4 h-4 border-2 border-[#E8821C]/30 border-t-[#E8821C] rounded-full animate-spin" /> : <Upload size={14} />}
              {uploading ? 'Subiendo…' : 'Subir nueva imagen'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
              />
            </label>
            {currentImg && (
              <button
                onClick={() => update('imagen_local', null)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-[12px] text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 size={12} />Quitar imagen
              </button>
            )}
          </div>

          <div className="glass rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Estado</p>
            <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)] cursor-pointer">
              <input type="checkbox" checked={p.activo} onChange={(e) => update('activo', e.target.checked)} className="accent-[#E8821C]" />
              <span>Activo (visible en sitio público)</span>
            </label>
            <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)] cursor-pointer">
              <input type="checkbox" checked={p.destacado} onChange={(e) => update('destacado', e.target.checked)} className="accent-[#E8821C]" />
              <span>Destacado en landing</span>
            </label>
            <Field label="Badge" value={p.badge || ''} onChange={(v) => update('badge', v || null)} placeholder="Ej: Más vendido, Nuevo" />
          </div>
        </div>

        {/* Right: fields */}
        <div className="lg:col-span-2 space-y-4">
          {/* Identidad */}
          <div className="glass rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Identidad</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Modelo" value={p.modelo} onChange={(v) => update('modelo', v)} />
              <Select label="Marca" value={p.marca || ''} onChange={(v) => update('marca', v || null)} options={MARCAS} />
              <Select label="Categoría" value={p.categoria || ''} onChange={(v) => update('categoria', v || null)} options={CATEGORIAS} />
              <Select label="Motor" value={p.motor || ''} onChange={(v) => update('motor', v || null)} options={MOTORES} />
            </div>
          </div>

          {/* Specs */}
          <div className="glass rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Specs técnicas</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Capacidad (kg)" value={p.capacidad_kg?.toString() || ''} onChange={(v) => update('capacidad_kg', numberOrNull(v))} type="number" />
              <Field label="Mástil (mm)" value={p.mastil_mm?.toString() || ''} onChange={(v) => update('mastil_mm', numberOrNull(v))} type="number" />
              <Field label="Ancho pasillo (mm)" value={p.ancho_pasillo_mm?.toString() || ''} onChange={(v) => update('ancho_pasillo_mm', numberOrNull(v))} type="number" />
              <Field label="Longitud s/horquillas (mm)" value={p.longitud_sin_horquillas_mm?.toString() || ''} onChange={(v) => update('longitud_sin_horquillas_mm', numberOrNull(v))} type="number" />
              <Field label="Ancho total (mm)" value={p.ancho_total_mm?.toString() || ''} onChange={(v) => update('ancho_total_mm', numberOrNull(v))} type="number" />
              <Field label="Altura chasis (mm)" value={p.altura_chasis_mm?.toString() || ''} onChange={(v) => update('altura_chasis_mm', numberOrNull(v))} type="number" />
            </div>
          </div>

          {/* Descripción */}
          <div className="glass rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Descripción comercial</p>
            <textarea
              value={p.descripcion || ''}
              onChange={(e) => update('descripcion', e.target.value || null)}
              placeholder="Describe los beneficios, casos de uso y diferenciadores del equipo…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 transition-all resize-none"
            />
          </div>

          {/* Precios */}
          <div className="glass rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Precios (USD)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Precio venta" value={p.precio_venta?.toString() || ''} onChange={(v) => update('precio_venta', numberOrNull(v))} type="number" prefix="$" />
              <Field label="Alquiler diario" value={p.precio_alquiler_diario?.toString() || ''} onChange={(v) => update('precio_alquiler_diario', numberOrNull(v))} type="number" prefix="$" />
              <Field label="Alquiler semanal" value={p.precio_alquiler_semanal?.toString() || ''} onChange={(v) => update('precio_alquiler_semanal', numberOrNull(v))} type="number" prefix="$" />
              <Field label="Alquiler mensual" value={p.precio_alquiler_mensual?.toString() || ''} onChange={(v) => update('precio_alquiler_mensual', numberOrNull(v))} type="number" prefix="$" />
              <Field label="Alquiler anual" value={p.precio_alquiler_anual?.toString() || ''} onChange={(v) => update('precio_alquiler_anual', numberOrNull(v))} type="number" prefix="$" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--color-text-muted)]">{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-10 ${prefix ? 'pl-7' : 'pl-3'} pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 transition-all`}
        />
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--color-text-muted)] mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/40 transition-all"
      >
        <option value="">(sin asignar)</option>
        {options.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
