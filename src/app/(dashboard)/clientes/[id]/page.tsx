'use client';

import { use, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, Building2, FileText, MessageSquare, Calendar, Sparkles, Factory, Hash } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { periodoLabels, type PeriodoAlquiler } from '@/lib/store-data';

type ClienteRow = {
  id: string;
  email: string;
  nombre: string;
  empresa: string | null;
  telefono: string | null;
  pais: string | null;
  ciudad: string | null;
  industria: string | null;
  ruc: string | null;
  tipo: 'lead' | 'customer';
  estado: 'activo' | 'inactivo';
  comercial_asignado: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

type CotizacionResumen = {
  id: string;
  numero: string;
  modalidad: 'venta' | 'alquiler';
  periodo: string | null;
  total: number | string;
  estado: 'nueva' | 'contactado' | 'cotizado' | 'negociacion' | 'ganada' | 'perdida';
  producto: { marca?: string; modelo?: string } | null;
  created_at: string;
};

const ESTADO_COLORS: Record<string, string> = {
  nueva:        'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  contactado:   'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  cotizado:     'bg-[#E8821C]/10 text-[#E8821C] border border-[#E8821C]/20',
  negociacion:  'bg-violet-500/10 text-violet-300 border border-violet-500/20',
  ganada:       'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  perdida:      'bg-rose-500/10 text-rose-300 border border-rose-500/20',
};

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = useMemo(() => createClient(), []);

  const [cliente, setCliente] = useState<ClienteRow | null | undefined>(undefined);
  const [cotizaciones, setCotizaciones] = useState<CotizacionResumen[]>([]);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from('parmonca_clientes').select('*').eq('id', id).maybeSingle();
      if (!c) { setCliente(null); return; }
      setCliente(c as ClienteRow);

      // Cotizaciones del cliente (link por email, igual que el trigger upsert_cliente_on_cotizacion)
      const { data: qs } = await supabase
        .from('parmonca_cotizaciones')
        .select('id, numero, modalidad, periodo, total, estado, producto, created_at')
        .eq('email', (c as ClienteRow).email)
        .order('created_at', { ascending: false });
      setCotizaciones((qs || []) as CotizacionResumen[]);
    })();
  }, [id, supabase]);

  if (cliente === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--color-text-muted)] text-sm">Cargando cliente…</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-[var(--color-text-secondary)]">Cliente no encontrado</p>
        <Link href="/clientes" className="text-[13px] text-[#E8821C] hover:underline">Volver al listado</Link>
      </div>
    );
  }

  const totalCotizado = cotizaciones.reduce((a, c) => a + Number(c.total || 0), 0);
  const ganadas = cotizaciones.filter(c => c.estado === 'ganada');
  const totalGanado = ganadas.reduce((a, c) => a + Number(c.total || 0), 0);
  const enPipeline = cotizaciones.filter(c => ['nueva','contactado','cotizado','negociacion'].includes(c.estado));
  const totalPipeline = enPipeline.reduce((a, c) => a + Number(c.total || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Link href="/clientes" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors">
        <ArrowLeft size={14} />Volver a Clientes
      </Link>

      <div className="glass rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#E8821C] to-[#C96A10] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 glow-brand-sm">
            {getInitials(cliente.empresa || cliente.nombre)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-lg font-bold text-[var(--color-text-primary)] font-display">{cliente.empresa || cliente.nombre}</h1>
                {cliente.empresa && <p className="text-[var(--color-text-secondary)] text-[13px] mt-0.5">{cliente.nombre}</p>}
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${cliente.tipo === 'customer' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                  {cliente.tipo === 'customer' ? 'Cliente' : 'Lead'}
                </span>
                <Link
                  href={`/cotizaciones/nueva?email=${encodeURIComponent(cliente.email)}&nombre=${encodeURIComponent(cliente.nombre)}`}
                  className="px-3 py-1 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[11px] font-semibold rounded-lg flex items-center gap-1 glow-brand-sm"
                >
                  <Sparkles size={11} />Cotizar
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
              <Info icon={Mail} value={cliente.email} />
              {cliente.telefono && <Info icon={Phone} value={cliente.telefono} />}
              {(cliente.ciudad || cliente.pais) && (
                <Info icon={MapPin} value={[cliente.ciudad, cliente.pais].filter(Boolean).join(', ')} />
              )}
              {cliente.industria && <Info icon={Factory} value={cliente.industria} />}
              {cliente.ruc && <Info icon={Hash} value={cliente.ruc} />}
              {cliente.empresa && <Info icon={Building2} value={cliente.empresa} />}
            </div>
          </div>
        </div>
        {cliente.notas && (
          <div className="mt-4 p-3 bg-[var(--color-surface-glass)] rounded-lg border border-[var(--color-border)]">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] mb-1 uppercase tracking-wider"><MessageSquare size={10} />Notas</div>
            <p className="text-[13px] text-[var(--color-text-secondary)] whitespace-pre-wrap">{cliente.notas}</p>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Cotizaciones" value={cotizaciones.length.toString()} accent="text-[var(--color-text-primary)]" />
        <Kpi label="Total cotizado" value={formatCurrency(totalCotizado)} accent="text-[var(--color-text-secondary)]" />
        <Kpi label="En pipeline" value={formatCurrency(totalPipeline)} accent="text-[#E8821C]" />
        <Kpi label="Ganado" value={formatCurrency(totalGanado)} accent="text-emerald-400" />
      </div>

      {/* Historial */}
      <div className="glass rounded-xl p-5">
        <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-4">Historial de cotizaciones</h2>
        {cotizaciones.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-muted)] text-center py-8">Sin cotizaciones registradas</p>
        ) : (
          <div className="space-y-3">
            {cotizaciones.map((c, i) => {
              const prod = c.producto ? [c.producto.marca, c.producto.modelo].filter(Boolean).join(' ').trim() : '';
              const modalidad = c.modalidad === 'alquiler'
                ? `Alquiler${c.periodo ? ` · ${periodoLabels[c.periodo as PeriodoAlquiler] || c.periodo}` : ''}`
                : 'Venta';
              return (
                <Link
                  key={c.id}
                  href={`/cotizaciones/${c.id}`}
                  className="flex gap-3 group hover:bg-[var(--color-surface-glass)] rounded-lg p-2 -m-2 transition-all"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/10 text-blue-400">
                      <FileText size={13} />
                    </div>
                    {i < cotizaciones.length - 1 && <div className="w-px h-full bg-[var(--color-border)] mt-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-medium text-[var(--color-text-secondary)] group-hover:text-[#E8821C] transition-colors">
                        Cotización {c.numero}
                      </p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${ESTADO_COLORS[c.estado] || ''}`}>
                        {c.estado}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                      {modalidad}{prod && ` — ${prod}`} · <span className="font-mono">{formatCurrency(Number(c.total || 0))}</span>
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
                      <Calendar size={9} />
                      {new Date(c.created_at).toLocaleDateString('es-PA', { dateStyle: 'medium' })}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-[var(--color-text-secondary)]">
      <Icon size={13} className="text-[var(--color-text-muted)]" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <p className={`text-xl font-bold font-num ${accent}`}>{value}</p>
      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  );
}
