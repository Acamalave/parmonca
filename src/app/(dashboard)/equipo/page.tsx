'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { UserPlus, Phone, Mail, Target, AlertCircle, Check, Trophy, Eye, EyeOff, Link as LinkIcon, RotateCcw, Copy, Shield, Crown } from 'lucide-react';
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

// Perfiles con rol administrativo — no entran al ranking de ventas, pero
// queremos verlos arriba para gestionar accesos (PIN, link de activación).
type AdminRow = {
  id: string;
  nombre: string | null;
  email: string;
  telefono: string | null;
  rol: 'super-admin' | 'gerente';
  activo: boolean;
  avatar_url: string | null;
  created_at: string;
};

const SITE_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : 'https://parmonca.com';

function getInitials(nombre: string | null, email: string) {
  const base = (nombre || email.split('@')[0]).trim();
  return base.split(/[\s.]+/).slice(0, 2).map(s => s[0]?.toUpperCase() || '').join('') || 'US';
}

export default function EquipoPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
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

  // Lista de super-admins y gerentes (no aparecen en el ranking de ventas).
  // RLS profiles_read permite a cualquier usuario autenticado leerlos.
  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from('parmonca_profiles')
      .select('id, nombre, email, telefono, rol, activo, avatar_url, created_at')
      .in('rol', ['super-admin', 'gerente'])
      .eq('activo', true)
      .order('created_at', { ascending: true });
    if (error) setError(error.message);
    else setAdmins((data || []) as AdminRow[]);
  };

  const refreshAll = async () => {
    await Promise.all([fetchRanking(), fetchAdmins()]);
  };

  useEffect(() => {
    refreshAll().finally(() => setLoading(false));
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
            {loading ? 'Cargando…' : (
              <>
                {rows.length} {rows.length === 1 ? 'vendedor' : 'vendedores'}
                {admins.length > 0 && (
                  <> · {admins.length} {admins.length === 1 ? 'cuenta administrativa' : 'cuentas administrativas'}</>
                )}
              </>
            )}
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

      {/* Administración — super-admins y gerentes (no entran al ranking de
          ventas porque no son vendedores, pero los listamos aparte para
          gestionar accesos y dejar claro quién más tiene permisos). */}
      {!loading && admins.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2.5">
            <Shield size={14} className="text-[#E8821C]" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
              Administración
            </h2>
            <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              Acceso completo al CRM, no entran al ranking de ventas
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {admins.map(a => (
              <AdminCard key={a.id} admin={a} onRefresh={refreshAll} />
            ))}
          </div>
        </section>
      )}

      {/* Ranking list */}
      {loading ? (
        <div className="glass rounded-xl p-10 text-center text-[var(--color-text-muted)] text-sm">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center">
          <p className="text-[var(--color-text-secondary)] text-sm mb-1">
            {admins.length > 0 ? 'Aún no has agregado vendedores (rol asesor).' : 'Aún no has agregado vendedores.'}
          </p>
          <p className="text-[var(--color-text-muted)] text-[12px] mb-3">
            Los asesores son los que aparecen en el ranking — tienen meta mensual y pipeline.
          </p>
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
              <div key={r.id} className="group block glass rounded-xl p-4 hover:bg-[var(--color-surface-glass)] transition-all">
                <div className="flex items-center gap-4 flex-wrap">
                  <Link
                    href={`/cotizaciones?asignado=${r.id}`}
                    className="flex items-center gap-3 flex-1 min-w-[220px] hover:opacity-90"
                  >
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
                  </Link>

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
                  </div>
                </div>

                <VendedorAccesoActions vendedor={r} onRefresh={fetchRanking} />
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <NuevoVendedorModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); refreshAll(); }}
        />
      )}
    </div>
  );
}

// Tarjeta compacta para super-admins / gerentes — sin métricas de venta.
// Reutiliza los mismos RPCs (parmonca_ver_pin, parmonca_regenerar_token)
// porque trabajan sobre cualquier perfil, no sólo asesores.
function AdminCard({ admin, onRefresh }: { admin: AdminRow; onRefresh: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [pin, setPin] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isSuperAdmin = admin.rol === 'super-admin';
  const RoleIcon = isSuperAdmin ? Crown : Shield;
  const roleLabel = isSuperAdmin ? 'Super Admin' : 'Gerente';

  const fetchPin = async () => {
    if (pin !== null) { setShowPin(s => !s); return; }
    setLoading(true);
    const { data, error } = await supabase.rpc('parmonca_ver_pin', { p_vendedor_id: admin.id });
    setLoading(false);
    if (error) { alert('Error al obtener PIN: ' + error.message); return; }
    setPin(data || 'sin configurar aún');
    setShowPin(true);
  };

  const regenerar = async () => {
    if (!confirm(`Esto invalida el PIN actual de ${admin.nombre || admin.email} y genera un nuevo link. ¿Continuar?`)) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('parmonca_regenerar_token', { p_vendedor_id: admin.id });
    setLoading(false);
    if (error) { alert('Error: ' + error.message); return; }
    setNewLink(`${SITE_URL}/activar?token=${data}`);
    setPin(null);
    onRefresh();
  };

  const handleCopyLink = async () => {
    if (!newLink) return;
    await navigator.clipboard.writeText(newLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[13px] ${
          isSuperAdmin
            ? 'bg-gradient-to-br from-amber-500 to-amber-600'
            : 'bg-gradient-to-br from-violet-500 to-violet-700'
        }`}>
          {getInitials(admin.nombre, admin.email)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-display text-[14px] font-bold text-[var(--color-text-primary)] truncate">
              {admin.nombre || admin.email.split('@')[0]}
            </p>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
              isSuperAdmin
                ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                : 'bg-violet-500/10 border border-violet-500/25 text-violet-300'
            }`}>
              <RoleIcon size={9} />
              {roleLabel}
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] truncate">{admin.email}</p>
          {admin.telefono && (
            <p className="text-[10px] text-[var(--color-text-muted)] truncate">{admin.telefono}</p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center gap-2">
        <button
          onClick={fetchPin}
          disabled={loading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[#E8821C] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
        >
          {showPin ? <EyeOff size={12} /> : <Eye size={12} />}
          {pin === null ? 'Ver PIN' : showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
        </button>
        {showPin && pin !== null && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E8821C]/10 border border-[#E8821C]/20 font-mono text-[13px] font-bold tracking-widest text-[#E8821C]">
            {pin || '—'}
          </span>
        )}
        <button
          onClick={regenerar}
          disabled={loading}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 ml-auto"
        >
          <RotateCcw size={12} /> Regenerar link
        </button>
        {newLink && (
          <div className="w-full flex items-center gap-2 mt-1">
            <p className="text-[10px] font-mono text-[var(--color-text-muted)] break-all flex-1">{newLink}</p>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#E8821C]/10 text-[#E8821C] text-[11px] font-semibold"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        )}
      </div>
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
  const [telefono, setTelefono] = useState('');
  const [meta, setMeta] = useState('');
  const [rol, setRol] = useState<'super-admin' | 'gerente' | 'asesor'>('asesor');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { data, error } = await supabase.rpc('parmonca_crear_vendedor', {
      p_email: email.trim().toLowerCase(),
      p_nombre: nombre.trim(),
      p_telefono: telefono.trim() || null,
      p_rol: rol,
      // La meta sólo aplica para asesores (vendedores en pipeline)
      p_meta_mensual: rol === 'asesor' && meta ? Number(meta) : null,
    });
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setCreated({
      email: row?.email || email,
      token: row?.activation_token || '',
    });
    setSaving(false);
  };

  const activationUrl = created ? `${SITE_URL}/activar?token=${created.token}` : '';
  const shareMessage = created
    ? `Hola ${nombre.split(' ')[0] || ''}, ya tienes acceso al CRM PARMONCA.\n\n` +
      `Abre este link desde tu celular o computador para crear tu PIN de acceso:\n${activationUrl}\n\n` +
      `Una vez lo crees, podrás entrar a https://parmonca.com/login con tu email o teléfono + tu PIN.`
    : '';

  const handleCopyLink = async () => {
    if (!activationUrl) return;
    await navigator.clipboard.writeText(activationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMessage = async () => {
    if (!shareMessage) return;
    await navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md glass-strong rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {!created ? (
          <>
            <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-1">Nuevo miembro del equipo</h2>
            <p className="text-[12px] text-[var(--color-text-muted)] mb-5">
              Al crear la cuenta obtendrás un link único para que la persona configure su propio PIN de acceso.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Selector de rol — define qué ve y qué puede hacer */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">
                  Rol *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { v: 'asesor' as const,      label: 'Asesor',      hint: 'Sólo sus leads' },
                    { v: 'gerente' as const,     label: 'Gerente',     hint: 'Vista global' },
                    { v: 'super-admin' as const, label: 'Super Admin', hint: 'Todo + equipo' },
                  ]).map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setRol(opt.v)}
                      className={`flex flex-col items-start gap-0.5 p-2.5 rounded-lg border text-left transition-all ${
                        rol === opt.v
                          ? 'border-[#E8821C] bg-[#E8821C]/[0.08]'
                          : 'border-[var(--color-border)] bg-[var(--color-surface-glass)] hover:border-[#E8821C]/30'
                      }`}
                    >
                      <span className={`text-[12px] font-bold ${rol === opt.v ? 'text-[#E8821C]' : 'text-[var(--color-text-primary)]'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">{opt.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Field icon={UserPlus} label="Nombre completo *" value={nombre} onChange={setNombre} placeholder="Juan Pérez" />
              <Field icon={Mail} label="Email *" type="email" value={email} onChange={setEmail} placeholder="juan@parmonca.com" />
              <Field icon={Phone} label="Teléfono (sin +)" value={telefono} onChange={setTelefono} placeholder="50760000000" />
              {rol === 'asesor' && (
                <Field icon={Target} label="Meta mensual (USD)" type="number" value={meta} onChange={setMeta} placeholder="Ej: 25000" />
              )}

              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[12px]">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" /><span>{error}</span>
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
                  disabled={saving || !nombre || !email}
                  className="flex-1 h-10 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold disabled:opacity-60"
                >
                  {saving ? 'Creando…' : 'Crear vendedor'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Check size={18} className="text-emerald-400" />
              </div>
              <h2 className="font-display text-xl font-bold text-[var(--color-text-primary)]">Cuenta creada</h2>
            </div>
            <p className="text-[12px] text-[var(--color-text-muted)] mb-4">
              Comparte este link único con {nombre.split(' ')[0] || 'el vendedor'}. Al abrirlo creará su PIN de acceso.
            </p>

            <div className="rounded-xl border border-[#E8821C]/30 bg-[#E8821C]/[0.06] p-4 space-y-2 mb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
                  <LinkIcon size={10} /> Link de activación (válido 30 días)
                </p>
                <p className="text-[11px] font-mono text-[var(--color-text-primary)] break-all mt-1">{activationUrl}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={handleCopyLink}
                className="h-10 rounded-lg border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] flex items-center justify-center gap-1.5"
              >
                {copied ? <><Check size={12} className="text-emerald-400" /> Copiado</> : <><Copy size={12} /> Solo link</>}
              </button>
              <button
                onClick={handleCopyMessage}
                className="h-10 rounded-lg border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] flex items-center justify-center gap-1.5"
              >
                <Copy size={12} /> Mensaje para WhatsApp
              </button>
            </div>
            <button
              onClick={onSuccess}
              className="w-full h-10 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold"
            >
              Listo
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function VendedorAccesoActions({ vendedor, onRefresh }: { vendedor: RankingRow; onRefresh: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [pin, setPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchPin = async () => {
    if (pin !== null) { setShowPin(!showPin); return; }
    setLoading(true);
    const { data, error } = await supabase.rpc('parmonca_ver_pin', { p_vendedor_id: vendedor.id });
    setLoading(false);
    if (error) { alert('Error al obtener PIN: ' + error.message); return; }
    setPin(data || 'sin configurar aún');
    setShowPin(true);
  };

  const regenerar = async () => {
    if (!confirm(`Esto invalida el PIN actual de ${vendedor.nombre || vendedor.email} y genera un nuevo link. ¿Continuar?`)) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('parmonca_regenerar_token', { p_vendedor_id: vendedor.id });
    setLoading(false);
    if (error) { alert('Error: ' + error.message); return; }
    setNewLink(`${SITE_URL}/activar?token=${data}`);
    setPin(null);
    onRefresh();
  };

  const handleCopyLink = async () => {
    if (!newLink) return;
    await navigator.clipboard.writeText(newLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center gap-2">
      <button
        onClick={fetchPin}
        disabled={loading}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[#E8821C] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
      >
        {showPin ? <EyeOff size={12} /> : <Eye size={12} />}
        {pin === null ? 'Ver PIN' : showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
      </button>
      {showPin && pin !== null && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E8821C]/10 border border-[#E8821C]/20 font-mono text-[13px] font-bold tracking-widest text-[#E8821C]">
          {pin || '—'}
        </span>
      )}
      <button
        onClick={regenerar}
        disabled={loading}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 ml-auto"
      >
        <RotateCcw size={12} /> Regenerar link
      </button>
      {newLink && (
        <div className="w-full flex items-center gap-2 mt-1">
          <p className="text-[10px] font-mono text-[var(--color-text-muted)] break-all flex-1">{newLink}</p>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#E8821C]/10 text-[#E8821C] text-[11px] font-semibold"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
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
