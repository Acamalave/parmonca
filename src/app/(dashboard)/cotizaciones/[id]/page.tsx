'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Building2, Mail, Phone, MapPin, Package, Factory, Wallet, StickyNote, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

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
  modalidad: 'venta' | 'alquiler';
  periodo: string | null;
  producto: { marca?: string; modelo?: string; categoria?: string; precio?: number; imagen?: string } | null;
  accesorios: { nombre: string; precio: number }[];
  cantidad: number;
  subtotal: number;
  impuesto: number;
  total: number;
  estado: 'nueva' | 'contactado' | 'cotizado' | 'negociacion' | 'ganada' | 'perdida';
  etapa_pipeline: string;
  origen: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
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
  const [cot, setCot] = useState<CotizacionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nota, setNota] = useState('');
  const [notas, setNotas] = useState<{ id: string; contenido: string; tipo: string; created_at: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    const { data, error } = await supabase.from('parmonca_cotizaciones').select('*').eq('id', id).single();
    if (error) setError(error.message);
    else setCot(data as CotizacionDetail);
    const { data: nd } = await supabase.from('parmonca_cotizacion_notas').select('*').eq('cotizacion_id', id).order('created_at', { ascending: false });
    if (nd) setNotas(nd);
  };

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
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
                {cot.modalidad}{cot.periodo ? ` · ${cot.periodo}` : ''}
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
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">Producto solicitado</h2>
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{productoLabel}</p>
              {cot.producto?.categoria && (
                <p className="text-[11px] text-[var(--color-text-muted)] capitalize">{cot.producto.categoria.replace(/-/g, ' ')}</p>
              )}
              <p className="text-[12px] text-[var(--color-text-secondary)]">Cantidad: <span className="font-medium">{cot.cantidad}</span></p>
            </div>
            {cot.accesorios && cot.accesorios.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Accesorios</p>
                <div className="space-y-1">
                  {cot.accesorios.map((a, i) => (
                    <div key={i} className="flex justify-between text-[12px]">
                      <span className="text-[var(--color-text-secondary)]">{a.nombre}</span>
                      <span className="font-medium text-[var(--color-text-primary)]">{formatCurrency(a.precio)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
