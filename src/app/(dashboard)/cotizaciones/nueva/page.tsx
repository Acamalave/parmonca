'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Package, User, FileText, Send, Plus, Minus, Search } from 'lucide-react';
import { clientes, productos, categoriasProducto } from '@/lib/demo-data';
import { formatCurrency, getCategoryLabel, cn } from '@/lib/utils';
import { ItemCotizacion } from '@/types';

const steps = [
  { num: 1, label: 'Cliente', icon: User },
  { num: 2, label: 'Equipos', icon: Package },
  { num: 3, label: 'Condiciones', icon: FileText },
  { num: 4, label: 'Resumen', icon: Send },
];

export default function NuevaCotizacionPage() {
  const [step, setStep] = useState(1);
  const [clienteId, setClienteId] = useState('');
  const [tipo, setTipo] = useState<'venta' | 'renta'>('venta');
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [condiciones, setCondiciones] = useState('50% anticipo, 50% contra entrega');
  const [validez, setValidez] = useState(30);
  const [notas, setNotas] = useState('');
  const [searchProducto, setSearchProducto] = useState('');
  const [catFilter, setCatFilter] = useState('todas');
  const [searchCliente, setSearchCliente] = useState('');
  const [created, setCreated] = useState(false);

  const selectedCliente = clientes.find(c => c.id === clienteId);
  const markup = selectedCliente?.markup || 25;

  const filteredProducts = productos.filter(p => {
    const matchSearch = p.modelo.toLowerCase().includes(searchProducto.toLowerCase()) || p.descripcion.toLowerCase().includes(searchProducto.toLowerCase());
    const matchCat = catFilter === 'todas' || p.categoria === catFilter;
    return matchSearch && matchCat;
  });

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchCliente.toLowerCase()) || c.contactoPrincipal.toLowerCase().includes(searchCliente.toLowerCase())
  );

  const addItem = (productoId: string) => {
    const prod = productos.find(p => p.id === productoId);
    if (!prod) return;
    const existing = items.find(i => i.productoId === productoId);
    if (existing) {
      setItems(items.map(i => i.productoId === productoId ? { ...i, cantidad: i.cantidad + 1, precioTotal: (i.cantidad + 1) * i.precioUnitario } : i));
    } else {
      const precio = prod.precioBase * (1 + markup / 100);
      setItems([...items, { productoId, modelo: prod.modelo, cantidad: 1, precioUnitario: precio, precioTotal: precio }]);
    }
  };

  const removeItem = (productoId: string) => {
    const existing = items.find(i => i.productoId === productoId);
    if (!existing) return;
    if (existing.cantidad <= 1) setItems(items.filter(i => i.productoId !== productoId));
    else setItems(items.map(i => i.productoId === productoId ? { ...i, cantidad: i.cantidad - 1, precioTotal: (i.cantidad - 1) * i.precioUnitario } : i));
  };

  const subtotal = items.reduce((acc, i) => acc + i.precioTotal, 0);
  const impuesto = subtotal * 0.07;
  const total = subtotal + impuesto;
  const canNext = () => { if (step === 1) return !!clienteId; if (step === 2) return items.length > 0; return true; };

  if (created) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] font-display">Cotizacion Creada</h1>
        <p className="text-[var(--color-text-secondary)] text-[13px] mt-1">COT-2026-009 creada exitosamente</p>
        <div className="glass rounded-xl p-5 mt-6 text-left">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div><span className="text-[var(--color-text-muted)]">Cliente:</span> <span className="text-[var(--color-text-secondary)] font-medium">{selectedCliente?.nombre}</span></div>
            <div><span className="text-[var(--color-text-muted)]">Tipo:</span> <span className="text-[var(--color-text-secondary)] font-medium capitalize">{tipo}</span></div>
            <div><span className="text-[var(--color-text-muted)]">Items:</span> <span className="text-[var(--color-text-secondary)] font-medium">{items.length} equipos</span></div>
            <div><span className="text-[var(--color-text-muted)]">Total:</span> <span className="font-bold text-[#E8821C]">{formatCurrency(total)}</span></div>
          </div>
        </div>
        <div className="flex gap-2 justify-center mt-6">
          <Link href="/cotizaciones" className="px-5 py-2 rounded-lg border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-glass)]">Ver Cotizaciones</Link>
          <Link href="/cotizaciones/nueva" className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold glow-brand-sm">Crear Otra</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/cotizaciones" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors"><ArrowLeft size={14} />Volver</Link>
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Nueva Cotizacion</h1>

      {/* Steps */}
      <div className="flex items-center gap-1.5 glass rounded-xl p-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div key={s.num} className="flex items-center flex-1">
              <button onClick={() => isDone && setStep(s.num)}
                className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all w-full',
                  isActive && 'bg-[#E8821C]/10 text-[#E8821C]',
                  isDone && 'text-emerald-400 cursor-pointer hover:bg-emerald-500/5',
                  !isActive && !isDone && 'text-[var(--color-text-muted)]'
                )}>
                <div className={cn('w-6 h-6 rounded-md flex items-center justify-center text-[10px] flex-shrink-0',
                  isActive && 'bg-[#E8821C] text-white glow-brand-sm',
                  isDone && 'bg-emerald-500/20 text-emerald-400',
                  !isActive && !isDone && 'bg-[var(--color-surface-glass)] text-[var(--color-text-muted)]'
                )}>{isDone ? <Check size={12} /> : s.num}</div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && <div className={cn('w-6 h-px mx-0.5 flex-shrink-0', step > s.num ? 'bg-emerald-500/30' : 'bg-[var(--color-surface-glass)]')} />}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="glass rounded-xl p-5 min-h-[380px]">
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[var(--color-text-secondary)]">Seleccionar Cliente</h2>
              <div className="flex gap-1.5">
                {['venta','renta'].map(t => (
                  <button key={t} onClick={() => setTipo(t as 'venta'|'renta')}
                    className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize',
                      tipo === t ? 'bg-[#E8821C] text-white glow-brand-sm' : 'bg-[var(--color-surface-glass)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)]')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input type="text" value={searchCliente} onChange={(e) => setSearchCliente(e.target.value)} placeholder="Buscar cliente..."
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/30 transition-all" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
              {filteredClientes.map((c) => (
                <button key={c.id} onClick={() => setClienteId(c.id)}
                  className={cn('text-left p-3 rounded-lg border transition-all',
                    clienteId === c.id ? 'border-[#E8821C]/40 bg-[#E8821C]/[0.06]' : 'border-[var(--color-border)] hover:border-[var(--color-border)] bg-[var(--color-surface-glass)]')}>
                  <p className="font-medium text-[13px] text-[var(--color-text-secondary)]">{c.nombre}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{c.contactoPrincipal} · {c.pais}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{c.empresaAsignada} (Markup: {c.markup}%)</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[var(--color-text-secondary)]">Seleccionar Equipos</h2>
            <p className="text-[12px] text-[var(--color-text-muted)]">Markup: {markup}% ({selectedCliente?.empresaAsignada})</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input type="text" value={searchProducto} onChange={(e) => setSearchProducto(e.target.value)} placeholder="Buscar equipo..."
                  className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/30 transition-all" />
              </div>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                className="h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] focus:outline-none">
                <option value="todas">Todas</option>
                {categoriasProducto.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {items.length > 0 && (
              <div className="bg-[#E8821C]/[0.06] border border-[#E8821C]/20 rounded-lg p-2.5">
                <p className="text-[12px] font-medium text-[#E8821C]">{items.length} equipo(s) — Subtotal: {formatCurrency(subtotal)}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto">
              {filteredProducts.map((prod) => {
                const item = items.find(i => i.productoId === prod.id);
                const precio = prod.precioBase * (1 + markup / 100);
                return (
                  <div key={prod.id} className={cn('p-3 rounded-lg border transition-all', item ? 'border-[#E8821C]/30 bg-[#E8821C]/[0.04]' : 'border-[var(--color-border)] bg-[var(--color-surface-glass)]')}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-[13px] text-[var(--color-text-secondary)]">{prod.modelo}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">{getCategoryLabel(prod.categoria)} · {prod.marca}</p>
                        <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{prod.capacidad} | {prod.motor}</p>
                      </div>
                      <p className="text-[13px] font-bold text-[#E8821C]">{formatCurrency(precio)}</p>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      {item && <button onClick={() => removeItem(prod.id)} className="w-7 h-7 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-surface-hover)]"><Minus size={12} className="text-[var(--color-text-secondary)]" /></button>}
                      {item && <span className="w-6 text-center text-[13px] font-medium text-[var(--color-text-secondary)]">{item.cantidad}</span>}
                      <button onClick={() => addItem(prod.id)} className="w-7 h-7 rounded-md bg-[#E8821C] text-white flex items-center justify-center hover:bg-[#FF9F43]"><Plus size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[var(--color-text-secondary)]">Condiciones</h2>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mb-1.5">Condiciones de Pago</label>
              <select value={condiciones} onChange={(e) => setCondiciones(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] focus:outline-none focus:border-[#E8821C]/30">
                <option>50% anticipo, 50% contra entrega</option><option>30% anticipo, 70% financiado a 6 meses</option>
                <option>100% anticipo</option><option>40% anticipo, 60% financiado</option><option>Mensual anticipado</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mb-1.5">Validez (dias)</label>
              <input type="number" value={validez} onChange={(e) => setValidez(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] focus:outline-none focus:border-[#E8821C]/30" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mb-1.5">Notas</label>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={4} placeholder="Notas adicionales..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/30 resize-none" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-[var(--color-text-secondary)]">Resumen</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[var(--color-surface-glass)] rounded-lg border border-[var(--color-border)]"><p className="text-[10px] text-[var(--color-text-muted)] uppercase">Cliente</p><p className="text-[13px] font-medium text-[var(--color-text-secondary)] mt-0.5">{selectedCliente?.nombre}</p></div>
              <div className="p-3 bg-[var(--color-surface-glass)] rounded-lg border border-[var(--color-border)]"><p className="text-[10px] text-[var(--color-text-muted)] uppercase">Tipo / Empresa</p><p className="text-[13px] font-medium text-[var(--color-text-secondary)] mt-0.5 capitalize">{tipo} · {selectedCliente?.empresaAsignada}</p></div>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.productoId} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                  <div><p className="text-[13px] font-medium text-[var(--color-text-secondary)]">{item.modelo}</p><p className="text-[11px] text-[var(--color-text-muted)]">{item.cantidad} x {formatCurrency(item.precioUnitario)}</p></div>
                  <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{formatCurrency(item.precioTotal)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--color-border)] pt-3 space-y-1.5">
              <div className="flex justify-between text-[13px]"><span className="text-[var(--color-text-secondary)]">Subtotal</span><span className="text-[var(--color-text-secondary)]">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-[13px]"><span className="text-[var(--color-text-secondary)]">Impuesto (7%)</span><span className="text-[var(--color-text-secondary)]">{formatCurrency(impuesto)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--color-border)]"><span className="text-[var(--color-text-primary)]">Total</span><span className="text-[#E8821C] text-glow">{formatCurrency(total)}</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-glass)] disabled:opacity-30 disabled:cursor-not-allowed">
          <ArrowLeft size={14} />Anterior
        </button>
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canNext()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold glow-brand-sm disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.97]">
            Siguiente<ArrowRight size={14} />
          </button>
        ) : (
          <button onClick={() => setCreated(true)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[13px] font-semibold active:scale-[0.97] shadow-[0_0_15px_#22C55E30]">
            <Check size={14} />Crear Cotizacion
          </button>
        )}
      </div>
    </div>
  );
}
