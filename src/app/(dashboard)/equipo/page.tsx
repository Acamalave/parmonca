'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { UserPlus, TrendingUp, Phone, Mail, Target, Award, AlertCircle, Check, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

type RankingRow = {
  id: string;
  nombre: string | null;
  email: string;
  telefono: string | null;
  rol: string;
  activo: boolean;
  meta_mensual_usd: number | null;
  avatar_url: string | null;
  cotizaciones_mes: number;
  ganadas_mes: number;
  pipeline_abiertas: number;
  monto_cerrado_mes: number | string;
  monto_pipeline: number | string;
  tasa_conversion_mes: number | string;
  clientes_asignados: number;
};

function getInitials(nombre: string | null, email: string) {
  const base = (nombre || email.split('@')[0]).trim();
  return base.split(/[\s.]+/).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('') || 'US';
}

export default function EquipoPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchRanking = async () => {
    const { data, error } = await supabase
      .from('parmonca_v_ranking_vendedores')
      .select('*')
      .order('monto_cerrado_mes', { ascending: false });
    if (error) setError(error.message);
    else setRows((data || []) as RankingRow[]);
  };

  useEffect(() => {
    fetchRanking().finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const maxMontoCerrado = Math.max(1, ...rows.map(r => Number(r.monto_cerrado_mes) || 0));
  const totalCerrado = rows.reduce((s, r) => s + (Number(r.monto_cerrado_mes) || 0), 0);
  const totalPipeline = rows.reduce((s, r) => s + (Number(r.monto_pipeline) || 0), 0);
  const totalGanadas = rows.reduce((s, r) => s + (r.ganadas_mes || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Mi Equipo</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {loading ? 'Cargando…' : `${rows.length} ${rows.length === 1 ? 'vendedor' : 'vendedores'} activos`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold transition-all active:scale-[0.97]"
        >
          <UserPlus size={14} />
          Agregar vendedor
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Cerrado (mes)</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalCerrado)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Pipeline</p>
          <p className="text-xl font-bold text-[#E8821C] mt-1">{formatCurrency(totalPipeline)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Ganadas</p>
          <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1">{totalGanadas}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Equipo</p>
          <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1">{rows.length}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px]">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Ranking list */}
      {loading ? (
        <div className="glass rounded-xl p-10 text-center text-[var(--color-text-muted)] text-sm">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center">
          <p className="text-[var(--color-text-secondary)] text-sm mb-3">Aún no has agregado vendedores.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold"
          >
            <UserPlus size={14} /> Agregar el primer vendedor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r, idx) => {
            const monto = Number(r.monto_cerrado_mes) || 0;
            const meta = Number(r.meta_mensual_usd) || 0;
            const pctMeta = meta > 0 ? Math.min(100, Math.round((monto / meta) * 100)) : null;
            const barPct = Math.round((monto / maxMontoCerrado) * 100);
            return (
              <Link
                href={`/cotizaciones?asignado=${r.id}`}
                key={r.id}
                className="group block glass rounded-xl p-4 hover:bg-[var(--color-surface-glass)] transition-all"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Rank badge */}
                  <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E8821C] to-[#C96A10] flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(r.nombre, r.email)}
                      </div>
                      {idx === 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center" title="Top del mes">
                          <Trophy size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-[15px] font-bold text-[var(--color-text-primary)] truncate group-hover:text-[#E8821C] transition-colors">
                        {r.nombre || r.email.split('@')[0]}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)] truncate">{r.email}</p>
                    </div>
                  </div>

                  {/* Bar + stats */}
                  <div className="flex-1 min-w-[260px]">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-[var(--color-text-muted)]">Cerrado del mes</span>
                      <span className="font-num font-bold text-emerald-400">{formatCurrency(monto)}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-surface-glass)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    {pctMeta !== null && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Target size={10} className="text-[var(--color-text-muted)]" />
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          Meta: {formatCurrency(meta)} — {pctMeta}% cumplido
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metric chips */}
                  <div className="flex gap-2 flex-wrap">
                    <MetricChip label="Cotizaciones" value={r.cotizaciones_mes} />
                    <MetricChip label="Ganadas" value={r.ganadas_mes} emerald />
                    <MetricChip label="Pipeline" value={formatCurrency(Number(r.monto_pipeline))} orange />
                    <MetricChip label="Conv." value={`${r.tasa_conversion_mes}%`} />
                    <MetricChip label="Clientes" value={r.clientes_asignados} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showForm && (
        <NuevoVendedorModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchRanking(); }}
        />
      )}
    </div>
  );
}

function MetricChip({ label, value, emerald, orange }: { label: string; value: React.ReactNode; emerald?: boolean; orange?: boolean }) {
  return (
    <div className={`px-2.5 py-1 rounded-lg border text-center min-w-[70px] ${
      emerald ? 'bg-emerald-500/[0.05] border-emerald-500/15' :
      orange ? 'bg-[#E8821C]/[0.06] border-[#E8821C]/15' :
      'bg-[var(--color-surface-glass)] border-[var(--color-border)]'
    }`}>
      <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">{label}</p>
      <p className={`text-[12px] font-bold ${
        emerald ? 'text-emerald-400' :
        orange ? 'text-[#E8821C]' :
        'text-[var(--color-text-primary)]'
      }`}>{value}</p>
    </div>
  );
}

function NuevoVendedorModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [meta, setMeta] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { error } = await supabase.rpc('parmonca_crear_vendedor', {
      p_email: email.trim().toLowerCase(),
      p_password: password,
      p_nombre: nombre.trim(),
      p_telefono: telefono.trim() || null,
      p_rol: 'asesor',
      p_meta_mensual: meta ? Number(meta) : null,
    });
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    setSuccess(true);
    setSaving(false);
    setTimeout(onSuccess, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md glass-strong rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-1">Nuevo vendedor</h2>
        <p className="text-[12px] text-[var(--color-text-muted)] mb-5">
          Crea una cuenta para que el vendedor pueda entrar con su email y contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field icon={UserPlus} label="Nombre completo*" value={nombre} onChange={setNombre} placeholder="Juan Pérez" />
          <Field icon={Mail} label="Email*" type="email" value={email} onChange={setEmail} placeholder="juan@parmonca.com" />
          <Field icon={Check} label="Contraseña temporal*" type="text" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />
          <Field icon={Phone} label="Teléfono" value={telefono} onChange={setTelefono} placeholder="+507 6000 0000" />
          <Field icon={Target} label="Meta mensual (USD)" type="number" value={meta} onChange={setMeta} placeholder="Ej: 25000" />

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[12px]">
              <AlertCircle size={12} className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[12px]">
              <Check size={12} className="mt-0.5 shrink-0" /><span>Vendedor creado. Comparte las credenciales.</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !nombre || !email || password.length < 6}
              className="flex-1 h-10 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold disabled:opacity-60"
            >
              {saving ? 'Creando…' : 'Crear vendedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder, type = 'text' }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-muted)] mb-1">
        <Icon size={11} className="text-[#E8821C]" /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
      />
    </div>
  );
}
