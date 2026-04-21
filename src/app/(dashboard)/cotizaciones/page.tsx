'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Download, Sparkles, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

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
  created_at: string;
};

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
  const [rows, setRows] = useState<CotizacionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroModalidad, setFiltroModalidad] = useState<string>('todas');

  const supabase = useMemo(() => createClient(), []);

  const fetchRows = async () => {
    setError(null);
    const { data, error } = await supabase
      .from('parmonca_cotizaciones')
      .select('id, numero, nombre, empresa, email, telefono, pais, ciudad, modalidad, periodo, producto, total, estado, etapa_pipeline, origen, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data || []) as CotizacionRow[]);
    }
  };

  useEffect(() => {
    fetchRows().finally(() => setLoading(false));

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

  const filtered = rows.filter((r) => {
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRows();
    setRefreshing(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {loading ? 'Cargando…' : `${filtered.length} de ${rows.length} cotizaciones`}
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
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                {['Número', 'Cliente', 'Producto', 'Modalidad', 'Total', 'Fecha', 'Estado'].map((h, i) => (
                  <th
                    key={h}
                    className={`text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] px-4 py-2.5 ${i === 2 ? 'hidden md:table-cell' : ''} ${i === 3 ? 'hidden sm:table-cell' : ''} ${i === 5 ? 'hidden lg:table-cell' : ''} ${i === 4 ? 'text-right' : ''} ${i === 6 ? 'text-center' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
                    Cargando cotizaciones…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
                    {rows.length === 0 ? 'Aún no hay cotizaciones. Las solicitudes de la tienda aparecerán aquí en tiempo real.' : 'Ninguna cotización coincide con los filtros.'}
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-glass)] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/cotizaciones/${r.id}`} className="text-[13px] font-medium text-[#E8821C] hover:underline">
                      {r.numero}
                    </Link>
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
                      {r.modalidad}{r.periodo ? ` · ${r.periodo}` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-[var(--color-text-primary)] text-right">{formatCurrency(r.total)}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--color-text-muted)] hidden lg:table-cell">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${ESTADO_STYLES[r.estado]}`}>
                      {ESTADO_LABEL[r.estado]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
