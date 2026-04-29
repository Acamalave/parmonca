'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Check, AlertCircle, Search, Package, User, Plus, Minus, Trash2,
  ShoppingCart, X, Wrench,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, cn } from '@/lib/utils';
import { periodoLabels, type PeriodoAlquiler } from '@/lib/store-data';
import { useProfile } from '@/lib/supabase/use-profile';

// ────────────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────────────

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
};

type ProductoRow = {
  id: number;
  slug: string;
  modelo: string;
  marca: string | null;
  categoria: string | null;
  capacidad_kg: number | null;
  imagen_local: string | null;
  imagen_url: string | null;
  precio_venta: number | string | null;
  precio_alquiler_1ano: number | string | null;
  precio_alquiler_2anos: number | string | null;
  precio_alquiler_3anos: number | string | null;
  precio_alquiler_5anos: number | string | null;
};

type RepuestoRow = {
  id: string;
  sku: string | null;
  nombre: string;
  categoria: string;
  marca: string | null;
  imagen_url: string | null;
  precio_venta: number | string | null;
  stock: number;
};

type ItemCatalogo = {
  key: string;                 // id único: producto-<num> | repuesto-<uuid>
  tipo: 'producto' | 'repuesto';
  modelo: string;              // nombre/modelo
  marca: string | null;
  categoria: string;
  capacidad: string | null;    // "3,500 kg" para productos, null para repuestos
  imagen: string | null;
  // Precios indexados por modalidad/plazo
  precios: {
    venta: number | null;
    '1_ano': number | null;
    '2_anos': number | null;
    '3_anos': number | null;
    '5_anos': number | null;
  };
  raw: ProductoRow | RepuestoRow;
};

type CartLine = {
  key: string;                 // mismo key del catálogo
  item: ItemCatalogo;
  cantidad: number;
};

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

const num = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toItem = (row: ProductoRow | RepuestoRow, tipo: 'producto' | 'repuesto'): ItemCatalogo => {
  if (tipo === 'producto') {
    const p = row as ProductoRow;
    return {
      key: `producto-${p.id}`,
      tipo: 'producto',
      modelo: p.modelo,
      marca: p.marca,
      categoria: p.categoria || 'Equipo',
      capacidad: p.capacidad_kg ? `${p.capacidad_kg.toLocaleString()} kg` : null,
      imagen: p.imagen_local || p.imagen_url || null,
      precios: {
        venta: num(p.precio_venta),
        '1_ano': num(p.precio_alquiler_1ano),
        '2_anos': num(p.precio_alquiler_2anos),
        '3_anos': num(p.precio_alquiler_3anos),
        '5_anos': num(p.precio_alquiler_5anos),
      },
      raw: p,
    };
  } else {
    const r = row as RepuestoRow;
    return {
      key: `repuesto-${r.id}`,
      tipo: 'repuesto',
      modelo: r.nombre,
      marca: r.marca,
      categoria: `Repuesto · ${r.categoria.replace(/_/g, ' ')}`,
      capacidad: r.stock > 0 ? `Stock: ${r.stock}` : 'Sin stock',
      imagen: r.imagen_url,
      precios: {
        venta: num(r.precio_venta),
        '1_ano': null,
        '2_anos': null,
        '3_anos': null,
        '5_anos': null,
      },
      raw: r,
    };
  }
};

const precioActivo = (item: ItemCatalogo, modalidad: 'venta' | 'alquiler', periodo: PeriodoAlquiler): number => {
  if (modalidad === 'venta') return item.precios.venta || 0;
  return item.precios[periodo] || 0;
};

// ────────────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────────────

export default function NuevaCotizacionPage() {
  const supabase = useMemo(() => createClient(), []);
  // Identidad del admin que crea la cotización: la auto-asignamos a él
  // mismo (puede reasignar después desde el detalle si era para otro
  // vendedor). Antes la cotización quedaba sin dueño y caía al pool.
  const { profile } = useProfile();
  const router = useRouter();

  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [repuestos, setRepuestos] = useState<RepuestoRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Cliente
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteExistenteId, setClienteExistenteId] = useState<string | null>(null);
  const [clienteManual, setClienteManual] = useState({ nombre: '', email: '', telefono: '', empresa: '' });

  // Catálogo
  const [busquedaItem, setBusquedaItem] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'productos' | 'repuestos'>('todos');

  // Carrito
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCartMobile, setShowCartMobile] = useState(false);

  // Condiciones
  const [modalidad, setModalidad] = useState<'venta' | 'alquiler'>('venta');
  const [periodo, setPeriodo] = useState<PeriodoAlquiler>('1_ano');
  const [mensaje, setMensaje] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Carga inicial + realtime ──
  useEffect(() => {
    const reload = async () => {
      const [{ data: c }, { data: p }, { data: r }] = await Promise.all([
        supabase.from('parmonca_clientes').select('*').order('nombre'),
        supabase.from('parmonca_productos')
          .select('id, slug, modelo, marca, categoria, capacidad_kg, imagen_local, imagen_url, precio_venta, precio_alquiler_1ano, precio_alquiler_2anos, precio_alquiler_3anos, precio_alquiler_5anos')
          .eq('activo', true).order('modelo'),
        supabase.from('parmonca_repuestos')
          .select('id, sku, nombre, categoria, marca, imagen_url, precio_venta, stock')
          .eq('activo', true).gt('stock', 0).order('nombre'),
      ]);
      setClientes((c || []) as ClienteRow[]);
      setProductos((p || []) as ProductoRow[]);
      setRepuestos((r || []) as RepuestoRow[]);
      setLoadingData(false);
    };
    reload();

    const channel = supabase
      .channel('cotizacion_nueva_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_productos' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_repuestos' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_clientes' }, reload)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Catálogo unificado
  const catalogo: ItemCatalogo[] = useMemo(() => {
    const items: ItemCatalogo[] = [];
    if (filtroTipo === 'todos' || filtroTipo === 'productos') {
      items.push(...productos.map(p => toItem(p, 'producto')));
    }
    // Repuestos sólo cuando modalidad=venta (no se alquilan)
    if (modalidad === 'venta' && (filtroTipo === 'todos' || filtroTipo === 'repuestos')) {
      items.push(...repuestos.map(r => toItem(r, 'repuesto')));
    }
    return items;
  }, [productos, repuestos, filtroTipo, modalidad]);

  const filteredCatalogo = useMemo(() => {
    if (!busquedaItem.trim()) return catalogo;
    const q = busquedaItem.toLowerCase();
    return catalogo.filter(i =>
      i.modelo.toLowerCase().includes(q) ||
      (i.marca || '').toLowerCase().includes(q) ||
      i.categoria.toLowerCase().includes(q)
    );
  }, [catalogo, busquedaItem]);

  // Carrito helpers
  const addItem = (item: ItemCatalogo) => {
    setCart(prev => {
      const existing = prev.find(l => l.key === item.key);
      if (existing) {
        return prev.map(l => l.key === item.key ? { ...l, cantidad: l.cantidad + 1 } : l);
      }
      return [...prev, { key: item.key, item, cantidad: 1 }];
    });
  };
  const setCantidad = (key: string, c: number) => {
    if (c <= 0) return setCart(prev => prev.filter(l => l.key !== key));
    setCart(prev => prev.map(l => l.key === key ? { ...l, cantidad: c } : l));
  };
  const removeItem = (key: string) => setCart(prev => prev.filter(l => l.key !== key));

  // Cálculos
  const subtotal = cart.reduce((acc, l) => acc + precioActivo(l.item, modalidad, periodo) * l.cantidad, 0);
  const impuesto = modalidad === 'venta' ? subtotal * 0.07 : 0;
  const total = subtotal + impuesto;
  const cartCount = cart.reduce((a, l) => a + l.cantidad, 0);

  // Cliente seleccionado
  const cliente = clienteExistenteId ? clientes.find(c => c.id === clienteExistenteId) : null;
  const filteredClientes = busquedaCliente
    ? clientes.filter(c => {
        const q = busquedaCliente.toLowerCase();
        return c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.empresa || '').toLowerCase().includes(q);
      })
    : clientes.slice(0, 6);

  const puedeGuardar =
    cart.length > 0 &&
    (clienteExistenteId || (clienteManual.nombre.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteManual.email)));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puedeGuardar) return;
    setSaving(true);
    setError(null);

    const datosCliente = cliente
      ? {
          nombre: cliente.nombre,
          email: cliente.email,
          telefono: cliente.telefono || '',
          empresa: cliente.empresa || '',
          pais: cliente.pais || '',
          ciudad: cliente.ciudad || '',
          industria: cliente.industria || '',
          ruc: cliente.ruc || '',
        }
      : {
          nombre: clienteManual.nombre.trim(),
          email: clienteManual.email.trim().toLowerCase(),
          telefono: clienteManual.telefono.trim(),
          empresa: clienteManual.empresa.trim(),
          pais: '', ciudad: '', industria: '', ruc: '',
        };

    // El primer ítem va como `producto` (lo usa el PDF/email actual);
    // todos los items completos van en `accesorios` (jsonb) — esto preserva
    // el detalle multi-ítem en el detalle de la cotización.
    const principal = cart[0];
    const productoPayload = principal
      ? {
          modelo: principal.item.modelo,
          marca: principal.item.marca || '',
          categoria: principal.item.categoria,
          precio: precioActivo(principal.item, modalidad, periodo),
          imagen: principal.item.imagen || '',
        }
      : null;

    const lineItems = cart.map(l => ({
      tipo: l.item.tipo,
      modelo: l.item.modelo,
      marca: l.item.marca || '',
      categoria: l.item.categoria,
      cantidad: l.cantidad,
      precio_unitario: precioActivo(l.item, modalidad, periodo),
      precio_total: precioActivo(l.item, modalidad, periodo) * l.cantidad,
      imagen: l.item.imagen || '',
    }));

    // Cantidad principal = cantidad del primer ítem (compat con campo legacy);
    // suma total de unidades cotizadas se preserva en accesorios.length / line_items
    const { data, error: rpcErr } = await supabase.rpc('parmonca_insert_cotizacion', {
      p_nombre: datosCliente.nombre,
      p_empresa: datosCliente.empresa || null,
      p_email: datosCliente.email,
      p_telefono: datosCliente.telefono,
      p_pais: datosCliente.pais || null,
      p_ciudad: datosCliente.ciudad || null,
      p_mensaje: mensaje || null,
      p_industria: datosCliente.industria || null,
      p_tamano_flota: null,
      p_presupuesto: null,
      p_financiamiento: null,
      p_ruc: datosCliente.ruc || null,
      p_modalidad: modalidad,
      p_periodo: modalidad === 'alquiler' ? periodo : null,
      p_producto: productoPayload,
      p_accesorios: lineItems,
      p_cantidad: principal?.cantidad || 1,
      p_subtotal: subtotal,
      p_impuesto: impuesto,
      p_total: total,
      p_origen: 'manual',
      // Auto-asignar al admin que crea la cotización. Si era para otro
      // vendedor, se cambia con el dropdown de asignación en el detalle.
      p_asignado_a: profile?.id || null,
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setSaving(false);
      return;
    }

    const newId = Array.isArray(data) ? data[0]?.id : null;
    router.push(newId ? `/cotizaciones/${newId}` : '/cotizaciones');
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-24 lg:pb-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/cotizaciones" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors">
          <ArrowLeft size={14} />Volver a Cotizaciones
        </Link>
        {/* Botón flotante mobile para abrir el carrito */}
        <button
          type="button"
          onClick={() => setShowCartMobile(true)}
          className="lg:hidden inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#E8821C] text-white text-[12px] font-semibold relative"
        >
          <ShoppingCart size={14} />
          Carrito
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Nueva cotización</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          Selecciona el cliente, agrega los productos y revisa el resumen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        {/* Columna principal: cliente + catálogo */}
        <div className="space-y-4 min-w-0">
          {/* Cliente */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <User size={15} className="text-[#E8821C]" />
              <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Cliente</h2>
              {cliente && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">Seleccionado</span>}
            </div>
            <div className="relative mb-2.5">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={busquedaCliente}
                onChange={e => { setBusquedaCliente(e.target.value); setClienteExistenteId(null); }}
                placeholder="Buscar cliente existente por nombre, empresa o email…"
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
              />
            </div>

            {loadingData ? (
              <p className="text-[12px] text-[var(--color-text-muted)] py-3">Cargando…</p>
            ) : filteredClientes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto">
                {filteredClientes.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClienteExistenteId(c.id === clienteExistenteId ? null : c.id)}
                    className={cn(
                      'text-left p-2.5 rounded-lg border transition-all',
                      clienteExistenteId === c.id
                        ? 'border-[#E8821C]/40 bg-[#E8821C]/[0.06]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-glass)] hover:border-[#E8821C]/30'
                    )}
                  >
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{c.empresa || c.nombre}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
                      {c.empresa && `${c.nombre} · `}{c.email}
                    </p>
                  </button>
                ))}
              </div>
            ) : null}

            {!clienteExistenteId && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">
                  …o crea uno nuevo en esta cotización
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input required={!clienteExistenteId} type="text" value={clienteManual.nombre} onChange={e => setClienteManual(c => ({ ...c, nombre: e.target.value }))} placeholder="Nombre *"
                    className="h-9 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px]" />
                  <input required={!clienteExistenteId} type="email" value={clienteManual.email} onChange={e => setClienteManual(c => ({ ...c, email: e.target.value }))} placeholder="Email *"
                    className="h-9 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px]" />
                  <input type="tel" value={clienteManual.telefono} onChange={e => setClienteManual(c => ({ ...c, telefono: e.target.value }))} placeholder="Teléfono"
                    className="h-9 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px]" />
                  <input type="text" value={clienteManual.empresa} onChange={e => setClienteManual(c => ({ ...c, empresa: e.target.value }))} placeholder="Empresa"
                    className="h-9 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px]" />
                </div>
              </div>
            )}
          </div>

          {/* Modalidad — afecta los precios mostrados */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Package size={15} className="text-[#E8821C]" />
                <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Modalidad</h2>
              </div>
              <div className="flex gap-1.5">
                {(['venta', 'alquiler'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModalidad(m)}
                    className={cn(
                      'h-8 px-3 rounded-md text-[12px] font-semibold capitalize',
                      modalidad === m
                        ? 'bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white'
                        : 'bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                    )}
                  >{m}</button>
                ))}
              </div>
            </div>
            {modalidad === 'alquiler' && (
              <div className="grid grid-cols-4 gap-1.5">
                {(['1_ano', '2_anos', '3_anos', '5_anos'] as PeriodoAlquiler[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriodo(p)}
                    className={cn(
                      'h-8 rounded-md text-[11px] font-semibold',
                      periodo === p
                        ? 'bg-[#E8821C]/10 border border-[#E8821C]/30 text-[#E8821C]'
                        : 'bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                    )}
                  >{periodoLabels[p]}</button>
                ))}
              </div>
            )}
          </div>

          {/* Catálogo */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
                Catálogo {loadingData ? '' : `(${filteredCatalogo.length})`}
              </h2>
              <div className="flex gap-1">
                {([
                  { v: 'todos' as const, label: 'Todos' },
                  { v: 'productos' as const, label: 'Maquinaria' },
                  { v: 'repuestos' as const, label: 'Repuestos', disabled: modalidad === 'alquiler' },
                ]).map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setFiltroTipo(opt.v)}
                    disabled={opt.disabled}
                    className={cn(
                      'h-7 px-2.5 rounded-md text-[11px] font-medium transition-colors',
                      filtroTipo === opt.v ? 'bg-[#E8821C] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                      opt.disabled && 'opacity-30 cursor-not-allowed'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={busquedaItem}
                onChange={e => setBusquedaItem(e.target.value)}
                placeholder="Buscar por modelo, marca o categoría…"
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
              />
            </div>

            {loadingData ? (
              <p className="text-[12px] text-[var(--color-text-muted)] text-center py-6">Cargando catálogo…</p>
            ) : filteredCatalogo.length === 0 ? (
              <p className="text-[12px] text-[var(--color-text-muted)] text-center py-6">Sin resultados.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredCatalogo.map(item => {
                  const enCarrito = cart.find(l => l.key === item.key);
                  const precio = precioActivo(item, modalidad, periodo);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => addItem(item)}
                      className={cn(
                        'group text-left rounded-xl overflow-hidden bg-[var(--color-surface)] border transition-all',
                        enCarrito
                          ? 'border-[#E8821C]/50 ring-1 ring-[#E8821C]/30'
                          : 'border-[var(--color-border)] hover:border-[#E8821C]/40 hover:shadow-md'
                      )}
                    >
                      <div className="aspect-square relative bg-[var(--color-surface-elevated)] flex items-center justify-center p-2 overflow-hidden">
                        {item.imagen ? (
                          <Image src={item.imagen} alt={item.modelo} fill sizes="160px" className="object-contain group-hover:scale-105 transition-transform" unoptimized />
                        ) : (
                          (item.tipo === 'repuesto' ? <Wrench size={32} className="text-[var(--color-text-muted)]/40" /> : <Package size={32} className="text-[var(--color-text-muted)]/40" />)
                        )}
                        {enCarrito && (
                          <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#E8821C] text-white text-[11px] font-bold flex items-center justify-center shadow-md">
                            {enCarrito.cantidad}
                          </span>
                        )}
                        {item.tipo === 'repuesto' && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Repuesto
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-[#E8821C]">{item.marca || '—'}</p>
                        <p className="text-[12px] font-bold text-[var(--color-text-primary)] truncate leading-tight mt-0.5">{item.modelo}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] truncate">{item.categoria}{item.capacidad ? ` · ${item.capacidad}` : ''}</p>
                        <p className="text-[12px] font-bold mt-1.5 font-mono">
                          {precio > 0
                            ? <span className="text-[var(--color-text-primary)]">{formatCurrency(precio)}</span>
                            : <span className="text-[var(--color-text-muted)] text-[10px] font-sans font-normal">A cotizar</span>}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mensaje */}
          <div className="glass rounded-xl p-5">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">
              Mensaje / notas para el cliente
            </label>
            <textarea
              rows={3}
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="Términos especiales, accesorios, observaciones…"
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 resize-none"
            />
          </div>
        </div>

        {/* Carrito (sticky lateral en desktop, modal en mobile) */}
        <CartPanel
          cart={cart}
          modalidad={modalidad}
          periodo={periodo}
          subtotal={subtotal}
          impuesto={impuesto}
          total={total}
          puedeGuardar={puedeGuardar}
          saving={saving}
          error={error}
          showMobile={showCartMobile}
          onCloseMobile={() => setShowCartMobile(false)}
          setCantidad={setCantidad}
          removeItem={removeItem}
        />
      </form>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Cart Panel
// ────────────────────────────────────────────────────────────────────────

function CartPanel({
  cart, modalidad, periodo, subtotal, impuesto, total,
  puedeGuardar, saving, error, showMobile, onCloseMobile,
  setCantidad, removeItem,
}: {
  cart: CartLine[];
  modalidad: 'venta' | 'alquiler';
  periodo: PeriodoAlquiler;
  subtotal: number; impuesto: number; total: number;
  puedeGuardar: boolean | string | null; saving: boolean; error: string | null;
  showMobile: boolean; onCloseMobile: () => void;
  setCantidad: (key: string, c: number) => void;
  removeItem: (key: string) => void;
}) {
  const wrapperCls = cn(
    'glass rounded-xl p-5 lg:sticky lg:top-4',
    'lg:block',
    showMobile ? 'fixed inset-x-3 bottom-3 top-3 z-50 overflow-y-auto' : 'hidden'
  );

  return (
    <>
      {showMobile && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} />}
      <div className={wrapperCls}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={15} className="text-[#E8821C]" />
            <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
              Resumen ({cart.length} {cart.length === 1 ? 'ítem' : 'ítems'})
            </h2>
          </div>
          <button type="button" onClick={onCloseMobile} className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--color-surface-glass)]">
            <X size={14} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingCart size={28} className="text-[var(--color-text-muted)]/40 mx-auto mb-2" />
            <p className="text-[12px] text-[var(--color-text-secondary)]">Aún no agregaste productos</p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Click en cualquier producto del catálogo para agregarlo.</p>
          </div>
        ) : (
          <div className="space-y-2.5 mb-4 max-h-[40vh] lg:max-h-[40vh] overflow-y-auto">
            {cart.map(l => {
              const precio = modalidad === 'venta' ? (l.item.precios.venta || 0) : (l.item.precios[periodo] || 0);
              const lineTotal = precio * l.cantidad;
              return (
                <div key={l.key} className="flex gap-2.5 p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-glass)]">
                  <div className="w-12 h-12 rounded bg-[var(--color-surface-elevated)] flex items-center justify-center overflow-hidden shrink-0">
                    {l.item.imagen ? (
                      <Image src={l.item.imagen} alt="" width={48} height={48} className="object-contain" unoptimized />
                    ) : (
                      (l.item.tipo === 'repuesto' ? <Wrench size={18} className="text-[var(--color-text-muted)]/40" /> : <Package size={18} className="text-[var(--color-text-muted)]/40" />)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-[var(--color-text-primary)] truncate leading-tight">{l.item.modelo}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{l.item.marca}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setCantidad(l.key, l.cantidad - 1)}
                          className="w-6 h-6 rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:border-[#E8821C]/40">
                          <Minus size={11} />
                        </button>
                        <span className="w-6 text-center text-[12px] font-bold font-mono">{l.cantidad}</span>
                        <button type="button" onClick={() => setCantidad(l.key, l.cantidad + 1)}
                          className="w-6 h-6 rounded bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center hover:border-[#E8821C]/40">
                          <Plus size={11} />
                        </button>
                      </div>
                      <p className="text-[12px] font-bold font-mono text-[var(--color-text-primary)]">
                        {formatCurrency(lineTotal)}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeItem(l.key)} className="p-1 text-[var(--color-text-muted)] hover:text-rose-400 self-start">
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {cart.length > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-[var(--color-border)]">
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            {modalidad === 'venta' && <Row label="Impuesto 7%" value={formatCurrency(impuesto)} />}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
              <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Total</span>
              <span className="text-[20px] font-mono font-bold text-[#E8821C]">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[12px]">
            <AlertCircle size={12} className="mt-0.5 shrink-0" /><span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!puedeGuardar || saving}
          className="w-full mt-4 h-11 bg-gradient-to-r from-[#E8821C] to-[#C96A10] hover:from-[#FF9F43] hover:to-[#E8821C] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-brand-sm inline-flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Check size={15} />Crear cotización</>
          )}
        </button>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-mono text-[var(--color-text-secondary)]">{value}</span>
    </div>
  );
}
