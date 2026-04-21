'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { GripVertical, Clock, DollarSign, MapPin, Package } from 'lucide-react';

type Etapa = 'prospecto' | 'contacto' | 'cotizado' | 'negociacion' | 'ganada' | 'perdida';

type PipelineRow = {
  id: string;
  numero: string;
  nombre: string;
  empresa: string | null;
  pais: string | null;
  total: number;
  modalidad: 'venta' | 'alquiler';
  producto: { marca?: string; modelo?: string } | null;
  etapa_pipeline: Etapa;
  estado: string;
  created_at: string;
  updated_at: string;
};

const etapas: { id: Etapa; label: string; dot: string }[] = [
  { id: 'prospecto', label: 'Prospecto', dot: '#71717A' },
  { id: 'contacto', label: 'Contacto', dot: '#3B82F6' },
  { id: 'cotizado', label: 'Cotizado', dot: '#E8821C' },
  { id: 'negociacion', label: 'Negociación', dot: '#F59E0B' },
  { id: 'ganada', label: 'Ganada', dot: '#22C55E' },
  { id: 'perdida', label: 'Perdida', dot: '#EF4444' },
];

function daysSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export default function PipelinePage() {
  const supabase = useMemo(() => createClient(), []);
  const [cards, setCards] = useState<PipelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fetchCards = async () => {
    const { data } = await supabase
      .from('parmonca_cotizaciones')
      .select('id, numero, nombre, empresa, pais, total, modalidad, producto, etapa_pipeline, estado, created_at, updated_at')
      .order('updated_at', { ascending: false });
    if (data) setCards(data as PipelineRow[]);
  };

  useEffect(() => {
    fetchCards().finally(() => setLoading(false));
    const channel = supabase
      .channel('parmonca_pipeline_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_cotizaciones' }, () => fetchCards())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrop = async (etapa: Etapa) => {
    if (!draggedId) return;
    const card = cards.find(c => c.id === draggedId);
    if (!card || card.etapa_pipeline === etapa) { setDraggedId(null); return; }

    // Optimistic update
    setCards(prev => prev.map(c => c.id === draggedId ? { ...c, etapa_pipeline: etapa, updated_at: new Date().toISOString() } : c));
    setDraggedId(null);

    // Auto-derive estado from etapa
    const estadoMap: Record<Etapa, string> = {
      prospecto: 'nueva',
      contacto: 'contactado',
      cotizado: 'cotizado',
      negociacion: 'negociacion',
      ganada: 'ganada',
      perdida: 'perdida',
    };

    await supabase.from('parmonca_cotizaciones').update({
      etapa_pipeline: etapa,
      estado: estadoMap[etapa],
      cerrado_at: (etapa === 'ganada' || etapa === 'perdida') ? new Date().toISOString() : null,
    }).eq('id', draggedId);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Pipeline de Ventas</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          Arrastra las tarjetas entre columnas · los cambios se guardan automáticamente
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {etapas.map((et) => {
          const ec = cards.filter(c => c.etapa_pipeline === et.id);
          const total = ec.reduce((a, c) => a + Number(c.total || 0), 0);
          return (
            <div key={et.id} className="glass rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: et.dot }} />
              <div>
                <p className="text-[10px] text-[var(--color-text-muted)]">{et.label}</p>
                <p className="text-[13px] font-bold text-[var(--color-text-primary)]">{formatCurrency(total)}</p>
              </div>
              <span className="text-[10px] bg-[var(--color-surface-hover)] px-1.5 py-0.5 rounded font-semibold text-[var(--color-text-secondary)]">{ec.length}</span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="glass rounded-xl p-10 text-center text-[var(--color-text-muted)] text-sm">Cargando pipeline…</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[480px]">
          {etapas.map((et) => {
            const ec = cards.filter(c => c.etapa_pipeline === et.id);
            return (
              <div
                key={et.id}
                className="min-w-[280px] w-[280px] flex-shrink-0"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(et.id)}
              >
                <div className="flex items-center gap-2 mb-2 px-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: et.dot }} />
                  <h3 className="text-[12px] font-semibold text-[var(--color-text-secondary)]">{et.label}</h3>
                  <span className="text-[10px] bg-[var(--color-surface-glass)] px-1.5 py-0.5 rounded font-medium text-[var(--color-text-muted)] ml-auto">{ec.length}</span>
                </div>
                <div className="space-y-2 min-h-[400px] bg-[var(--color-surface-glass)] rounded-xl p-1.5 border border-[var(--color-border)]">
                  {ec.map((card) => (
                    <Link
                      key={card.id}
                      href={`/cotizaciones/${card.id}`}
                      draggable
                      onDragStart={() => setDraggedId(card.id)}
                      className={`block glass rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-[var(--color-surface-glass)] transition-all ${draggedId === card.id ? 'opacity-40 scale-95' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-[#E8821C] truncate">{card.numero}</p>
                          <h4 className="text-[13px] font-medium text-[var(--color-text-primary)] leading-tight truncate">
                            {card.empresa || card.nombre}
                          </h4>
                        </div>
                        <GripVertical size={12} className="text-[var(--color-text-muted)] flex-shrink-0 mt-0.5" />
                      </div>
                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
                          <DollarSign size={11} />
                          <span className="font-bold text-[var(--color-text-primary)]">{formatCurrency(Number(card.total))}</span>
                          <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-semibold capitalize ${card.modalidad === 'alquiler' ? 'bg-blue-500/10 text-blue-400' : 'bg-[#E8821C]/10 text-[#E8821C]'}`}>
                            {card.modalidad}
                          </span>
                        </div>
                        {card.producto && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                            <Package size={11} />
                            <span className="truncate">{card.producto.marca} {card.producto.modelo}</span>
                          </div>
                        )}
                        {card.pais && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                            <MapPin size={11} />
                            <span>{card.pais}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                          <Clock size={11} />
                          <span>{daysSince(card.updated_at)}d en esta etapa</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {ec.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-[11px] text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-lg">
                      Arrastra aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
