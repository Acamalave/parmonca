'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Download, Sparkles, RefreshCw, Flame, User, Hand, Check, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/lib/supabase/use-profile';
import { isAdmin } from '@/lib/supabase/roles';
import { formatCurrency } from '@/lib/utils';
import { periodoLabels, type PeriodoAlquiler } from '@/lib/store-data';

const prettyPeriodo = (p: string | null): string =>
  p ? (periodoLabels[p as PeriodoAlquiler] || p) : '';

type CotizacionRow = {
  id: string;
  numero: string;
  nombre: string;
  empresa: string | null;
  email: string;
  telefono: string;
  pais: string | null;
  ciudad: string | null;
  modalidad: 'venta' | 'alquiler';
  periodo: string | null;
  producto: { marca?: string; modelo?: string } | null;
  total: number;
  estado: 'nueva' | 'contactado' | 'cotizado' | 'negociacion' | 'ganada' | 'perdida';
  etapa_pipeline: string;
  origen: string;
  asignado_a: string | null;
  created_at: string;
};

type ProfileRow = { id: string; nombre: string | null; email: string; rol: string };

const ESTADO_STYLES: Record<CotizacionRow['estado'], string> = {
  nueva: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  contactado: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  cotizado: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  negociacion: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  ganada: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  perdida: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

const ESTADO_LABEL: Record<CotizacionRow['estado'], string> = {
  nueva: 'Nueva',
  contactado: 'Contactado',
  cotizado: 'Cotizado',
  negociacion: 'Negociación',
  ganada: 'Ganada',
  perdida: 'Perdida',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PA', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Tiempo transcurrido en formato compacto, pensado para badges de SLA
 * tipo "lleva 12 min sin tomar". Devuelve también el "nivel" (verde /
 * amarillo / rojo) según umbrales de urgencia.
 */
function tiempoSinTomar(iso: string): { label: string; nivel: 'fresh' | 'warm' | 'hot' } {
  const minutos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  let label: string;
  if (minutos < 1) label = 'recién';
  else if (minutos < 60) label = `${minutos} min`;
  else if (minutos < 60 * 24) label = `${Math.floor(minutos / 60)} h`;
  else label = `${Math.floor(minutos / (60 * 24))} d`;
  // Umbrales: <30 min OK, 30-120 min llama la atención, >2h urgente.
  const nivel = minutos < 30 ? 'fresh' : minutos < 120 ? 'warm' : 'hot';
  return { label, nivel };
}

function exportCSV(rows: CotizacionRow[]) {
  const headers = ['Numero', 'Fecha', 'Cliente', 'Empresa', 'Email', 'Telefono', 'Pais', 'Ciudad', 'Modalidad', 'Periodo', 'Producto', 'Total', 'Estado', 'Origen'];
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.numero,
      new Date(r.created_at).toISOString(),
      r.nombre,
      r.empresa || '',
      r.email,
      r.telefono,
      r.pais || '',
      r.ciudad || '',
      r.modalidad,
      r.periodo || '',
      r.producto ? `${r.producto.marca || ''} ${r.producto.modelo || ''}`.trim() : '',
      r.total,
      ESTADO_LABEL[r.estado],
      r.origen,
    ].map(escape).join(',')),
  ];
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `parmonca-cotizaciones-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CotizacionesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40 text-[var(--color-text-muted)] text-sm">Cargando…</div>}>
      <CotizacionesContent />
    </Suspense>
  );
}

function CotizacionesContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter'); // 'disponibles' → unassigned pool
  const asignadoParam = searchParams.get('asignado'); // admin drill-down to specific vendedor
  const { profile } = useProfile();
  const userIsAdmin = isAdmin(profile?.rol);

  const [rows, setRows] = useState<CotizacionRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroModalidad, setFiltroModalidad] = useState<string>('todas');
  const [filtroAsignado, setFiltroAsignado] = useState<string>(asignadoParam || 'todos');
  const [claiming, setClaiming] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchRows = async () => {
    setError(null);
    const { data, error } = await supabase
      .from('parmonca_cotizaciones')
      .select('id, numero, nombre, empresa, email, telefono, pais, ciudad, modalidad, periodo, producto, total, estado, etapa_pipeline, origen, asignado_a, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data || []) as CotizacionRow[]);
    }
  };

  // Incluimos también gerentes y super-admins porque pueden recibir leads
  // (la RPC parmonca_asignar_lead lo permite). Los asesores aparecen primero
  // porque son los destinatarios más comunes.
  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('parmonca_profiles')
      .select('id, nombre, email, rol')
      .in('rol', ['asesor', 'gerente', 'super-admin'])
      .eq('activo', true);
    if (data) {
      const sorted = (data as ProfileRow[]).sort((a, b) => {
        // Asesores primero, luego gerentes, luego super-admins
        const order: Record<string, number> = { 'asesor': 0, 'gerente': 1, 'super-admin': 2 };
        return (order[a.rol] ?? 99) - (order[b.rol] ?? 99);
      });
      setProfiles(sorted);
    }
  };

  const handleTomarLead = async (id: string) => {
    setClaiming(id);
    const { data, error } = await supabase.rpc('parmonca_tomar_lead', { p_cotizacion_id: id });
    if (error) {
      setError(error.message);
    } else if (data === 0) {
      setError('Este lead ya fue tomado por otro vendedor.');
    }
    await fetchRows();
    setClaiming(null);
  };

  // Asignación manual por admin: pasa null para devolver al pool.
  const handleAsignar = async (cotizacionId: string, vendedorId: string | null) => {
    setClaiming(cotizacionId);
    const { error } = await supabase.rpc('parmonca_asignar_lead', {
      p_cotizacion_id: cotizacionId,
      p_vendedor_id: vendedorId,
    });
    if (error) setError(error.message);
    await fetchRows();
    setClaiming(null);
  };

  useEffect(() => {
    fetchRows().finally(() => setLoading(false));
    fetchProfiles();

    // Realtime subscription: cualquier nueva cotizacion aparece sin refrescar
    const channel = supabase
      .channel('parmonca_cotizaciones_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parmonca_cotizaciones' },
        () => fetchRows()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (asignadoParam) setFiltroAsignado(asignadoParam);
  }, [asignadoParam]);

  const filtered = rows.filter((r) => {
    if (filterParam === 'disponibles' && r.asignado_a !== null) return false;
    if (filtroAsignado === 'sin-asignar' && r.asignado_a !== null) return false;
    if (filtroAsignado !== 'todos' && filtroAsignado !== 'sin-asignar' && r.asignado_a !== filtroAsignado) return false;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.numero.toLowerCase().includes(q) ||
      r.nombre.toLowerCase().includes(q) ||
      (r.empresa || '').toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q);
    const matchEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
    const matchMod = filtroModalidad === 'todas' || r.modalidad === filtroModalidad;
    return matchSearch && matchEstado && matchMod;
  });

  const profileName = (id: string | null) => {
    if (!id) return null;
    const p = profiles.find(pr => pr.id === id);
    return p?.nombre || p?.email?.split('@')[0] || id.slice(0, 6);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRows();
    setRefreshing(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {filterParam === 'disponibles' ? (
              <span className="flex items-center gap-2">
                <Flame size={20} className="text-[#E8821C]" />
                Leads disponibles
              </span>
            ) : userIsAdmin ? 'Todas las Cotizaciones' : 'Mis Cotizaciones'}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {loading
              ? 'Cargando…'
              : filterParam === 'disponibles'
                ? `${filtered.length} lead${filtered.length === 1 ? '' : 's'} sin vendedor — toma uno antes de que lo haga otro`
                : `${filtered.length} de ${rows.length} cotizaciones`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-glass)] text-[var(--color-text-secondary)] text-[12px] hover:bg-[var(--color-surface-hover)] transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refrescar
          </button>
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-glass)] text-[var(--color-text-secondary)] text-[12px] hover:bg-[var(--color-surface-hover)] transition-all disabled:opacity-50"
          >
            <Download size={13} /> Exportar CSV
          </button>
          <Link
            href="/cotizaciones/nueva"
            className="flex items-center gap-1.5 h-8 px-3.5 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold rounded-lg transition-all active:scale-[0.97] glow-brand-sm"
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">Nueva Cotización</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="glass rounded-xl p-4 border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm">
          Error al cargar cotizaciones: {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, nombre, empresa o email..."
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/30 transition-all"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] focus:outline-none focus:border-[#E8821C]/30"
        >
          <option value="todos">Todos los estados</option>
          <option value="nueva">Nueva</option>
          <option value="contactado">Contactado</option>
          <option value="cotizado">Cotizado</option>
          <option value="negociacion">Negociación</option>
          <option value="ganada">Ganada</option>
          <option value="perdida">Perdida</option>
        </select>
        <select
          value={filtroModalidad}
          onChange={(e) => setFiltroModalidad(e.target.value)}
          className="h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] focus:outline-none focus:border-[#E8821C]/30"
        >
          <option value="todas">Venta y Alquiler</option>
          <option value="venta">Solo Venta</option>
          <option value="alquiler">Solo Alquiler</option>
        </select>
        {userIsAdmin && profiles.length > 0 && (
          <select
            value={filtroAsignado}
            onChange={(e) => setFiltroAsignado(e.target.value)}
            className="h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] focus:outline-none focus:border-[#E8821C]/30"
          >
            <option value="todos">Todo el equipo</option>
            <option value="sin-asignar">🔥 Sin asignar</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.nombre || p.email}</option>
            ))}
          </select>
        )}
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {(userIsAdmin
                  ? ['Número', 'Cliente', 'Producto', 'Modalidad', 'Total', 'Asignado', 'Fecha', 'Estado']
                  : ['Número', 'Cliente', 'Producto', 'Modalidad', 'Total', 'Fecha', 'Estado', 'Acción']).map((h, i, arr) => (
                  <th
                    key={h}
                    className={`text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-4 py-2.5 ${i === 2 ? 'hidden md:table-cell' : ''} ${i === 3 ? 'hidden sm:table-cell' : ''} ${arr[i] === 'Fecha' ? 'hidden lg:table-cell' : ''} ${arr[i] === 'Total' ? 'text-right' : ''} ${arr[i] === 'Estado' || arr[i] === 'Acción' ? 'text-center' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
                    Cargando cotizaciones…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
                    {rows.length === 0 ? 'Aún no hay cotizaciones. Las solicitudes de la tienda aparecerán aquí en tiempo real.' : 'Ninguna cotización coincide con los filtros.'}
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const assignedName = profileName(r.asignado_a);
                const isUnassigned = !r.asignado_a;
                const sla = isUnassigned ? tiempoSinTomar(r.created_at) : null;
                return (
                <tr key={r.id} className={`border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-glass)] transition-colors ${isUnassigned && !userIsAdmin ? 'bg-[#E8821C]/[0.03]' : ''}`}>
                  <td className="px-4 py-3">
                    <Link href={`/cotizaciones/${r.id}`} className="text-[13px] font-medium text-[#E8821C] hover:underline">
                      {r.numero}
                    </Link>
                    {isUnassigned && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#E8821C]/10 border border-[#E8821C]/20 text-[9px] font-semibold text-[#E8821C]">
                        <Flame size={9} /> Lead
                      </span>
                    )}
                    {sla && (
                      <span
                        className={`ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                          sla.nivel === 'hot'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : sla.nivel === 'warm'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                        title={`Sin asignar desde hace ${sla.label}`}
                      >
                        <Clock size={9} /> {sla.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[13px] text-[var(--color-text-primary)] font-medium">{r.nombre}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">{r.empresa || r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[var(--color-text-secondary)] hidden md:table-cell">
                    {r.producto ? `${r.producto.marca || ''} ${r.producto.modelo || ''}`.trim() : '—'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${r.modalidad === 'alquiler' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-[#E8821C]/10 text-[#E8821C] border border-[#E8821C]/20'}`}>
                      {r.modalidad}{r.periodo ? ` · ${prettyPeriodo(r.periodo)}` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-[var(--color-text-primary)] text-right">{formatCurrency(r.total)}</td>
                  {userIsAdmin && (
                    <td className="px-4 py-3 text-[12px]">
                      <select
                        value={r.asignado_a || ''}
                        onChange={(e) => handleAsignar(r.id, e.target.value || null)}
                        disabled={claiming === r.id}
                        className={`h-7 max-w-[150px] px-2 rounded-md border text-[11px] focus:outline-none focus:border-[#E8821C]/40 transition-all disabled:opacity-50 cursor-pointer ${
                          r.asignado_a
                            ? 'bg-[var(--color-surface-glass)] border-[var(--color-border)] text-[var(--color-text-secondary)]'
                            : 'bg-[#E8821C]/[0.06] border-[#E8821C]/25 text-[#E8821C] italic'
                        }`}
                        title={assignedName ? `Asignado a ${assignedName}` : 'Sin asignar — elegir vendedor'}
                      >
                        <option value="">— sin asignar —</option>
                        {profiles.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre || p.email.split('@')[0]}{p.rol !== 'asesor' ? ` (${p.rol === 'super-admin' ? 'admin' : p.rol})` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="px-4 py-3 text-[13px] text-[var(--color-text-muted)] hidden lg:table-cell">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${ESTADO_STYLES[r.estado]}`}>
                      {ESTADO_LABEL[r.estado]}
                    </span>
                  </td>
                  {!userIsAdmin && (
                    <td className="px-4 py-3 text-center">
                      {isUnassigned ? (
                        <button
                          onClick={(e) => { e.preventDefault(); handleTomarLead(r.id); }}
                          disabled={claiming === r.id}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[11px] font-semibold disabled:opacity-50"
                        >
                          {claiming === r.id ? <Check size={10} /> : <Hand size={10} />}
                          Tomar
                        </button>
                      ) : (
                        <span className="text-[11px] text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
