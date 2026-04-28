'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, User, Building2, Mail, Phone, MapPin, Package, Factory, Wallet, StickyNote, MessageSquare, Activity, Eye, Filter, HelpCircle, Zap, FileText, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { periodoLabels, type PeriodoAlquiler } from '@/lib/store-data';

const AMBIENTE_LABELS: Record<string, string> = {
  interior: 'Interior (almacén, nave)',
  exterior: 'Exterior (patio, obra)',
  mixto: 'Mixto (ambos)',
};

const FRECUENCIA_LABELS: Record<string, string> = {
  '1_turno': '1 turno (8h/día)',
  '2_turnos': '2 turnos (16h/día)',
  '3_turnos': '3 turnos (24h/día)',
};

const PLAZO_LABELS: Record<string, string> = {
  inmediato: 'Inmediato',
  '1-2-semanas': '1 – 2 semanas',
  planificando: 'Planificando',
  explorando: 'Investigando',
};

const prettyAmbiente = (v: string | null) => (v ? AMBIENTE_LABELS[v] || v : null);
const prettyFrecuencia = (v: string | null) => (v ? FRECUENCIA_LABELS[v] || v : null);
const prettyPlazo = (v: string | null) => (v ? PLAZO_LABELS[v] || v : null);

type CotizacionDetail = {
  id: string;
  numero: string;
  nombre: string;
  empresa: string | null;
  email: string;
  telefono: string;
  pais: string | null;
  ciudad: string | null;
  mensaje: string | null;
  industria: string | null;
  tamano_flota: string | null;
  presupuesto: string | null;
  financiamiento: string | null;
  ruc: string | null;
  ambiente: string | null;
  frecuencia: string | null;
  plazo: string | null;
  modalidad: 'venta' | 'alquiler';
  periodo: string | null;
  producto: { marca?: string; modelo?: string; categoria?: string; precio?: number; imagen?: string } | null;
  accesorios: Array<{
    // Forma legacy (accesorios sueltos)
    nombre?: string;
    precio?: number;
    // Forma nueva (line items completos del carrito)
    tipo?: 'producto' | 'repuesto';
    modelo?: string;
    marca?: string;
    categoria?: string;
    cantidad?: number;
    precio_unitario?: number;
    precio_total?: number;
    imagen?: string;
  }>;
  cantidad: number;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: 'nueva' | 'contactado' | 'cotizado' | 'negociacion' | 'ganada' | 'perdida';
  etapa_pipeline: string;
  origen: string;
  notas: string | null;
  device_id: string | null;
  created_at: string;
  updated_at: string;
};

type Visitante = {
  device_id: string;
  primera_visita: string;
  ultima_visita: string;
  visitas_totales: number;
  productos_vistos: string[] | null;
  marcas_vistas: string[] | null;
  categorias_vistas: string[] | null;
  perfil: Record<string, { valor: unknown; fuente?: string; ts?: string }> | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
};

type Evento = {
  id: number;
  tipo: string;
  data: Record<string, unknown>;
  ruta: string | null;
  created_at: string;
};

const ESTADO_STYLES: Record<CotizacionDetail['estado'], string> = {
  nueva: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  contactado: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  cotizado: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  negociacion: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  ganada: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  perdida: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

const ESTADO_OPTIONS: CotizacionDetail['estado'][] = ['nueva', 'contactado', 'cotizado', 'negociacion', 'ganada', 'perdida'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-PA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CotizacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [cot, setCot] = useState<CotizacionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nota, setNota] = useState('');
  const [notas, setNotas] = useState<{ id: string; contenido: string; tipo: string; created_at: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [visitante, setVisitante] = useState<Visitante | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);

  const loadAll = async () => {
    const { data, error } = await supabase.from('parmonca_cotizaciones').select('*').eq('id', id).single();
    if (error) setError(error.message);
    else {
      const c = data as CotizacionDetail;
      setCot(c);
      if (c.device_id) {
        const [{ data: v }, { data: ev }] = await Promise.all([
          supabase.from('parmonca_visitantes').select('*').eq('device_id', c.device_id).maybeSingle(),
          supabase.from('parmonca_visitante_eventos').select('*').eq('device_id', c.device_id).order('created_at', { ascending: false }).limit(30),
        ]);
        if (v) setVisitante(v as Visitante);
        if (ev) setEventos(ev as Evento[]);
      }
    }
    const { data: nd } = await supabase.from('parmonca_cotizacion_notas').select('*').eq('cotizacion_id', id).order('created_at', { ascending: false });
    if (nd) setNotas(nd);
  };

  useEffect(() => {
    loadAll().finally(() => setLoading(false));

    // Realtime: si otro admin/asesor edita el estado, se asigna la cotización
    // o añade una nota, los cambios aparecen sin necesidad de recargar.
    const channel = supabase
      .channel(`cotizacion_${id}_feed`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_cotizaciones', filter: `id=eq.${id}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_cotizacion_notas', filter: `cotizacion_id=eq.${id}` }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateEstado = async (nuevo: CotizacionDetail['estado']) => {
    if (!cot) return;
    setSaving(true);
    const { error } = await supabase.from('parmonca_cotizaciones').update({
      estado: nuevo,
      contactado_at: nuevo === 'contactado' ? new Date().toISOString() : cot.estado === 'contactado' ? undefined : null,
      cerrado_at: nuevo === 'ganada' || nuevo === 'perdida' ? new Date().toISOString() : null,
    }).eq('id', id);
    if (!error) setCot({ ...cot, estado: nuevo });
    setSaving(false);
  };

  const facturar = async () => {
    if (!cot) return;
    setSaving(true);
    const { data, error } = await supabase.rpc('parmonca_facturar_cotizacion', { p_cotizacion_id: cot.id });
    setSaving(false);
    if (error) { setError(error.message); return; }
    const newId = Array.isArray(data) ? data[0]?.id : null;
    if (newId) router.push(`/facturas/${newId}`);
  };

  const agregarNota = async () => {
    if (!nota.trim()) return;
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from('parmonca_cotizacion_notas').insert({
      cotizacion_id: id,
      contenido: nota.trim(),
      tipo: 'nota',
      autor_id: auth.user?.id || null,
    });
    if (!error) {
      setNota('');
      const { data: nd } = await supabase.from('parmonca_cotizacion_notas').select('*').eq('cotizacion_id', id).order('created_at', { ascending: false });
      if (nd) setNotas(nd);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-[var(--color-text-muted)] text-sm">Cargando…</div>;
  if (error || !cot) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link href="/cotizaciones" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C]"><ArrowLeft size={14} />Volver</Link>
      <div className="glass rounded-xl p-6 text-center text-[var(--color-text-secondary)] text-sm">Cotización no encontrada{error ? `: ${error}` : ''}</div>
    </div>
  );

  const productoLabel = cot.producto ? `${cot.producto.marca || ''} ${cot.producto.modelo || ''}`.trim() : '—';
  const whatsappNum = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Link href="/cotizaciones" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors"><ArrowLeft size={14} />Volver a cotizaciones</Link>

      {/* Header */}
      <div className="glass rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[var(--color-text-primary)] font-display">{cot.numero}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ESTADO_STYLES[cot.estado]}`}>{cot.estado}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${cot.modalidad === 'alquiler' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-[#E8821C]/10 text-[#E8821C] border border-[#E8821C]/20'}`}>
                {cot.modalidad}{cot.periodo ? ` · ${periodoLabels[cot.periodo as PeriodoAlquiler] || cot.periodo}` : ''}
              </span>
            </div>
            <p className="text-[var(--color-text-secondary)] text-[13px] mt-0.5">Recibida {formatDate(cot.created_at)} · Origen: {cot.origen}</p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <select
              value={cot.estado}
              onChange={(e) => updateEstado(e.target.value as CotizacionDetail['estado'])}
              disabled={saving}
              className="h-8 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[12px] text-[var(--color-text-secondary)] focus:outline-none focus:border-[#E8821C]/30"
            >
              {ESTADO_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <a href={`/api/cotizacion/${cot.id}/pdf`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#E8821C]/10 text-[#E8821C] border border-[#E8821C]/30 text-[12px] font-medium hover:bg-[#E8821C]/20 transition-all"><FileText size={12} />PDF</a>
            {cot.estado === 'ganada' && (
              <button
                onClick={facturar}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold disabled:opacity-50 shadow-[0_0_12px_#22C55E30]"
              >
                <Receipt size={12} />Facturar
              </button>
            )}
            <a href={`mailto:${cot.email}`} className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-glass)] text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all"><Mail size={12} />Email</a>
            {whatsappNum && (
              <a href={`https://wa.me/${cot.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${cot.nombre}, nos contactamos respecto a la cotización ${cot.numero}...`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-[12px] font-medium hover:bg-[#25D366]/20 transition-all"><MessageSquare size={12} />WhatsApp</a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Cliente info + Contexto */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass rounded-xl p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">Contacto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: User, label: 'Nombre', v: cot.nombre },
                { icon: Building2, label: 'Empresa', v: cot.empresa || '—' },
                { icon: Mail, label: 'Email', v: cot.email },
                { icon: Phone, label: 'Teléfono', v: cot.telefono },
                { icon: MapPin, label: 'País / Ciudad', v: [cot.pais, cot.ciudad].filter(Boolean).join(' · ') || '—' },
                { icon: Calendar, label: 'Fecha', v: formatDate(cot.created_at) },
              ].map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-[13px]">
                  <d.icon size={13} className="text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{d.label}</p>
                    <p className="font-medium text-[var(--color-text-secondary)]">{d.v}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">Contexto comercial</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Factory, label: 'Industria', v: cot.industria },
                { icon: Package, label: 'Flota actual', v: cot.tamano_flota },
                { icon: Wallet, label: 'Presupuesto', v: cot.presupuesto },
                { icon: StickyNote, label: 'Financiamiento', v: cot.financiamiento === 'si' ? 'Sí, necesita' : cot.financiamiento === 'no' ? 'No necesita' : cot.financiamiento },
                { icon: Building2, label: 'RUC / NIT', v: cot.ruc },
                { icon: MapPin, label: 'Ambiente de trabajo', v: prettyAmbiente(cot.ambiente) },
                { icon: Activity, label: 'Frecuencia de uso', v: prettyFrecuencia(cot.frecuencia) },
                { icon: Calendar, label: 'Plazo de compra', v: prettyPlazo(cot.plazo) },
              ].map((d, i) => d.v && (
                <div key={i} className="flex items-start gap-2 text-[13px]">
                  <d.icon size={13} className="text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{d.label}</p>
                    <p className="font-medium text-[var(--color-text-secondary)]">{d.v}</p>
                  </div>
                </div>
              ))}
            </div>
            {cot.mensaje && (
              <div className="mt-4 p-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)]">
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Mensaje del cliente</p>
                <p className="text-[13px] text-[var(--color-text-secondary)] whitespace-pre-wrap">{cot.mensaje}</p>
              </div>
            )}
          </div>

          {/* Historial de navegación del visitante */}
          {visitante && (
            <div className="glass rounded-xl p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3 flex items-center gap-1.5">
                <Activity size={11} className="text-[#E8821C]" />
                Comportamiento del visitante
              </h2>

              {/* Resumen stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)]">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Visitas</p>
                  <p className="text-[14px] font-bold text-[var(--color-text-primary)]">{visitante.visitas_totales}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)]">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Productos vistos</p>
                  <p className="text-[14px] font-bold text-[#E8821C]">{visitante.productos_vistos?.length || 0}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)]">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Primera visita</p>
                  <p className="text-[12px] font-semibold text-[var(--color-text-secondary)]">
                    {new Date(visitante.primera_visita).toLocaleDateString('es-PA', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)]">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">Origen</p>
                  <p className="text-[12px] font-semibold text-[var(--color-text-secondary)] truncate" title={visitante.utm_source || visitante.referrer || 'Directo'}>
                    {visitante.utm_source || (visitante.referrer ? new URL(visitante.referrer).hostname : 'Directo')}
                  </p>
                </div>
              </div>

              {/* Intereses detectados */}
              {((visitante.marcas_vistas && visitante.marcas_vistas.length > 0) || (visitante.categorias_vistas && visitante.categorias_vistas.length > 0)) && (
                <div className="mb-4 space-y-2">
                  {visitante.marcas_vistas && visitante.marcas_vistas.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Marcas que vio:</span>
                      {visitante.marcas_vistas.slice(0, 8).map((m) => (
                        <span key={m} className="px-2 py-0.5 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 text-[10px] font-semibold text-[#E8821C]">{m}</span>
                      ))}
                    </div>
                  )}
                  {visitante.categorias_vistas && visitante.categorias_vistas.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Categorías:</span>
                      {visitante.categorias_vistas.slice(0, 6).map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-full bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[10px] text-[var(--color-text-secondary)]">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Perfil progresivo (respuestas de formularios) */}
              {visitante.perfil && Object.keys(visitante.perfil).length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Respuestas registradas</p>
                  <div className="space-y-1">
                    {Object.entries(visitante.perfil).map(([campo, info]) => (
                      <div key={campo} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] last:border-0 text-[12px]">
                        <span className="text-[var(--color-text-muted)] capitalize">{campo.replace(/_/g, ' ')}</span>
                        <span className="text-[var(--color-text-secondary)] font-medium">
                          {typeof info?.valor === 'string' ? info.valor : JSON.stringify(info?.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline de eventos */}
              {eventos.length > 0 && (
                <details className="mt-3">
                  <summary className="text-[11px] text-[#E8821C] cursor-pointer hover:underline font-medium">
                    Ver timeline completa ({eventos.length} eventos)
                  </summary>
                  <div className="mt-3 space-y-1.5 max-h-80 overflow-y-auto pr-1">
                    {eventos.map((e) => {
                      const icon = e.tipo === 'product_view' ? Eye
                        : e.tipo === 'filter_applied' || e.tipo === 'category_selected' ? Filter
                        : e.tipo === 'form_answer' ? HelpCircle
                        : e.tipo === 'quote_submitted' ? Zap
                        : Activity;
                      const Icon = icon;
                      const label = e.tipo.replace(/_/g, ' ');
                      const summary = (() => {
                        if (e.tipo === 'product_view') return String(e.data?.slug || '');
                        if (e.tipo === 'category_selected') return String(e.data?.label || '');
                        if (e.tipo === 'form_answer') return `${String(e.data?.campo || '')} = ${String(e.data?.valor || '')}`;
                        return e.ruta || '';
                      })();
                      return (
                        <div key={e.id} className="flex items-start gap-2 text-[11px] py-1">
                          <Icon size={10} className="text-[var(--color-text-muted)] mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="capitalize text-[var(--color-text-secondary)] font-medium">{label}</span>
                            {summary && <span className="text-[var(--color-text-muted)]"> · {summary}</span>}
                          </div>
                          <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">
                            {new Date(e.created_at).toLocaleString('es-PA', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Notas / actividad */}
          <div className="glass rounded-xl p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">Actividad interna</h2>
            <div className="flex gap-2 mb-4">
              <input
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarNota()}
                placeholder="Agregar nota (ej: llamé al cliente, quiere financiar 60%)..."
                className="flex-1 h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/30"
              />
              <button onClick={agregarNota} disabled={saving || !nota.trim()} className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[12px] font-semibold disabled:opacity-50">
                Añadir
              </button>
            </div>
            <div className="space-y-2">
              {notas.length === 0 ? (
                <p className="text-[12px] text-[var(--color-text-muted)]">Sin actividad aún.</p>
              ) : (
                notas.map(n => (
                  <div key={n.id} className="p-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)]">
                    <p className="text-[13px] text-[var(--color-text-secondary)] whitespace-pre-wrap">{n.contenido}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{formatDate(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Precios + producto */}
        <div className="space-y-5">
          <div className="glass rounded-xl p-5">
            {(() => {
              // Detecta el formato: cotizaciones nuevas vienen con line items
              // completos (tipo, modelo, cantidad, precio_unitario, precio_total)
              // en accesorios. Cotizaciones viejas tienen sólo {nombre, precio}.
              const lineItems = (cot.accesorios || []).filter(a => a.modelo || a.tipo);
              const accesoriosLegacy = (cot.accesorios || []).filter(a => !a.modelo && !a.tipo && a.nombre);

              if (lineItems.length > 0) {
                return (
                  <>
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">
                      Productos cotizados ({lineItems.length})
                    </h2>
                    <div className="space-y-2.5">
                      {lineItems.map((it, i) => (
                        <div key={i} className="flex justify-between gap-3 pb-2.5 border-b border-[var(--color-border)] last:border-0 last:pb-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{it.modelo || '—'}</p>
                              {it.tipo === 'repuesto' && (
                                <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">Repuesto</span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                              {it.marca}{it.categoria && ` · ${it.categoria}`}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-mono">
                              {it.cantidad} × {formatCurrency(Number(it.precio_unitario || 0))}
                            </p>
                          </div>
                          <p className="text-[13px] font-bold font-mono text-[var(--color-text-primary)] whitespace-nowrap">
                            {formatCurrency(Number(it.precio_total || 0))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                );
              }

              // Formato legacy
              return (
                <>
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">Producto solicitado</h2>
                  <div className="space-y-2">
                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{productoLabel}</p>
                    {cot.producto?.categoria && (
                      <p className="text-[11px] text-[var(--color-text-muted)] capitalize">{cot.producto.categoria.replace(/-/g, ' ')}</p>
                    )}
                    <p className="text-[12px] text-[var(--color-text-secondary)]">Cantidad: <span className="font-medium">{cot.cantidad}</span></p>
                  </div>
                  {accesoriosLegacy.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Accesorios</p>
                      <div className="space-y-1">
                        {accesoriosLegacy.map((a, i) => (
                          <div key={i} className="flex justify-between text-[12px]">
                            <span className="text-[var(--color-text-secondary)]">{a.nombre}</span>
                            <span className="font-medium text-[var(--color-text-primary)]">{formatCurrency(Number(a.precio || 0))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="glass rounded-xl p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">Totales</h2>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Subtotal</span>
                <span className="font-medium text-[var(--color-text-primary)]">{formatCurrency(cot.subtotal)}</span>
              </div>
              {cot.modalidad !== 'alquiler' && (
                <div className="flex justify-between text-[var(--color-text-secondary)]">
                  <span>Impuesto</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{formatCurrency(cot.impuesto)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[var(--color-border)] text-[14px]">
                <span className="font-semibold text-[var(--color-text-primary)]">Total</span>
                <span className="font-bold text-[#E8821C]">{formatCurrency(cot.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
