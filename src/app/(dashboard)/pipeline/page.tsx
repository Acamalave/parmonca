'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { pipelineCards as initialCards } from '@/lib/demo-data';
import { PipelineCard } from '@/types';
import { GripVertical, Clock, DollarSign, User } from 'lucide-react';

const etapas = [
  { id: 'prospecto', label: 'Prospecto', color: 'bg-zinc-500', dot: '#71717A' },
  { id: 'contacto', label: 'Contacto', color: 'bg-blue-500', dot: '#3B82F6' },
  { id: 'cotizado', label: 'Cotizado', color: 'bg-[#E8821C]', dot: '#E8821C' },
  { id: 'negociacion', label: 'Negociacion', color: 'bg-amber-500', dot: '#F59E0B' },
  { id: 'ganada', label: 'Ganada', color: 'bg-emerald-500', dot: '#22C55E' },
  { id: 'perdida', label: 'Perdida', color: 'bg-red-500', dot: '#EF4444' },
] as const;

export default function PipelinePage() {
  const [cards, setCards] = useState<PipelineCard[]>(initialCards);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  const handleDrop = (etapa: string) => {
    if (!draggedCard) return;
    setCards(prev => prev.map(c => c.id === draggedCard ? { ...c, etapa: etapa as PipelineCard['etapa'], diasEnEtapa: 0 } : c));
    setDraggedCard(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Pipeline de Ventas</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Arrastra las tarjetas entre columnas</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {etapas.map((etapa) => {
          const ec = cards.filter(c => c.etapa === etapa.id);
          const total = ec.reduce((a, c) => a + c.monto, 0);
          return (
            <div key={etapa.id} className="glass rounded-lg px-3 py-2 flex items-center gap-2 min-w-fit">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: etapa.dot }} />
              <div>
                <p className="text-[10px] text-[var(--color-text-muted)]">{etapa.label}</p>
                <p className="text-[13px] font-bold text-[var(--color-text-primary)]">{formatCurrency(total)}</p>
              </div>
              <span className="text-[10px] bg-[var(--color-surface-hover)] px-1.5 py-0.5 rounded font-semibold text-[var(--color-text-secondary)]">{ec.length}</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 min-h-[480px]">
        {etapas.map((etapa) => {
          const ec = cards.filter(c => c.etapa === etapa.id);
          return (
            <div key={etapa.id} className="min-w-[260px] w-[260px] flex-shrink-0"
              onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(etapa.id)}>
              <div className="flex items-center gap-2 mb-2 px-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: etapa.dot }} />
                <h3 className="text-[12px] font-semibold text-[var(--color-text-secondary)]">{etapa.label}</h3>
                <span className="text-[10px] bg-[var(--color-surface-glass)] px-1.5 py-0.5 rounded font-medium text-[var(--color-text-muted)] ml-auto">{ec.length}</span>
              </div>
              <div className="space-y-2 min-h-[400px] bg-[var(--color-surface-glass)] rounded-xl p-1.5 border border-[var(--color-border)]">
                {ec.map((card) => (
                  <div key={card.id} draggable onDragStart={() => setDraggedCard(card.id)}
                    className={`glass rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-[var(--color-surface-glass)] transition-all ${draggedCard === card.id ? 'opacity-40 scale-95' : ''}`}>
                    <div className="flex items-start justify-between">
                      <h4 className="text-[13px] font-medium text-[var(--color-text-secondary)] leading-tight">{card.clienteNombre}</h4>
                      <GripVertical size={12} className="text-[var(--color-text-muted)] flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]"><DollarSign size={11} /><span className="font-bold text-[var(--color-text-primary)]">{formatCurrency(card.monto)}</span></div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]"><User size={11} /><span>{card.comercial}</span></div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]"><Clock size={11} /><span>{card.diasEnEtapa}d en esta etapa</span></div>
                    </div>
                  </div>
                ))}
                {ec.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-[11px] text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-lg">Arrastra aqui</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
