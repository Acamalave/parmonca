'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, AlertCircle, Search, Package, User, Plus, Minus } from 'lucide-react';
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

const PERIODO_KEY: Record<PeriodoAlquiler, keyof ProductoRow> = {
  '1_ano': 'precio_alquiler_1ano',
  '2_anos': 'precio_alquiler_2anos',
  '3_anos': 'precio_alquiler_3anos',
  '5_anos': 'precio_alquiler_5anos',
};

export default function NuevaCotizacionPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  // Catalog + clientes
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [productos, setProductos] = useState<ProductoRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteExistenteId, setClienteExistenteId] = useState<string | null>(null);
  const [clienteManual, setClienteManual] = useState({ nombre: '', email: '', telefono: '', empresa: '' });

  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoId, setProductoId] = useState<number | null>(null);

  const [modalidad, setModalidad] = useState<'venta' | 'alquiler'>('venta');
  const [periodo, setPeriodo] = useState<PeriodoAlquiler>('1_ano');
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reload = async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('parmonca_clientes').select('id, email, nombre, empresa, telefono, pais, ciudad, industria, ruc').order('nombre'),
        supabase.from('parmonca_productos').select('id, slug, modelo, marca, categoria, capacidad_kg, imagen_local, imagen_url, precio_venta, precio_alquiler_1ano, precio_alquiler_2anos, precio_alquiler_3anos, precio_alquiler_5anos').eq('activo', true).order('modelo'),
      ]);
      setClientes((c || []) as ClienteRow[]);
      setProductos((p || []) as ProductoRow[]);
      setLoadingData(false);
    };
    reload();

    // Realtime: si el admin edita precios/visibilidad mientras estás armando
    // una cotización, el selector se refresca solo para que no uses datos viejos.
    const channel = supabase
      .channel('cotizacion_nueva_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_productos' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_clientes' }, reload)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const cliente = clienteExistenteId ? clientes.find(c => c.id === clienteExistenteId) : null;
  const producto = productoId ? productos.find(p => p.id === productoId) : null;

  const filteredClientes = busquedaCliente
    ? clientes.filter(c => {
        const q = busquedaCliente.toLowerCase();
        return c.nombre.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.empresa || '').toLowerCase().includes(q);
      })
    : clientes.slice(0, 8);

  const filteredProductos = busquedaProducto
    ? productos.filter(p => {
        const q = busquedaProducto.toLowerCase();
        return p.modelo.toLowerCase().includes(q) || (p.marca || '').toLowerCase().includes(q) || (p.categoria || '').toLowerCase().includes(q);
      }).slice(0, 20)
    : productos.slice(0, 20);

  // Cálculos
  const precioUnit = useMemo(() => {
    if (!producto) return 0;
    if (modalidad === 'venta') return Number(producto.precio_venta || 0);
    return Number(producto[PERIODO_KEY[periodo]] || 0);
  }, [producto, modalidad, periodo]);

  const subtotal = precioUnit * cantidad;
  const impuesto = modalidad === 'venta' ? subtotal * 0.07 : 0;
  const total = subtotal + impuesto;

  const puedeGuardar =
    !!producto &&
    cantidad > 0 &&
    (
      clienteExistenteId ||
      (clienteManual.nombre.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteManual.email))
    );

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

    const productoPayload = producto
      ? {
          modelo: producto.modelo,
          marca: producto.marca || '',
          categoria: producto.categoria || '',
          precio: precioUnit,
          imagen: producto.imagen_local || producto.imagen_url || '',
        }
      : null;

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
      p_accesorios: [],
      p_cantidad: cantidad,
      p_subtotal: subtotal,
      p_impuesto: impuesto,
      p_total: total,
      p_origen: 'manual',
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setSaving(false);
      return;
    }

    // Redirige al detalle de la cotización creada
    const newId = Array.isArray(data) && data[0]?.id;
    router.push(newId ? `/cotizaciones/${newId}` : '/cotizaciones');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Link href="/cotizaciones" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors">
        <ArrowLeft size={14} />Volver a Cotizaciones
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Nueva Cotización</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Se asignará automáticamente a ti como responsable.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cliente */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <User size={15} className="text-[#E8821C]" />
              <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Cliente</h2>
            </div>

            <div className="relative mb-2.5">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={busquedaCliente}
                onChange={e => { setBusquedaCliente(e.target.value); setClienteExistenteId(null); }}
                placeholder="Buscar cliente existente…"
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
              />
            </div>

            {loadingData ? (
              <p className="text-[12px] text-[var(--color-text-muted)] text-center py-4">Cargando clientes…</p>
            ) : filteredClientes.length > 0 ? (
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {filteredClientes.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClienteExistenteId(c.id === clienteExistenteId ? null : c.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      clienteExistenteId === c.id
                        ? 'border-[#E8821C]/40 bg-[#E8821C]/[0.06]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-glass)] hover:border-[#E8821C]/30'
                    }`}
                  >
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{c.empresa || c.nombre}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
                      {c.empresa && `${c.nombre} · `}{c.email}{c.pais && ` · ${c.pais}`}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[var(--color-text-muted)] text-center py-3">Sin resultados. Llena los datos abajo para crear un cliente nuevo junto con la cotización.</p>
            )}

            {/* Fallback: cliente manual */}
            {!clienteExistenteId && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  O crea uno nuevo en esta cotización
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    required={!clienteExistenteId}
                    type="text"
                    value={clienteManual.nombre}
                    onChange={e => setClienteManual(c => ({ ...c, nombre: e.target.value }))}
                    placeholder="Nombre *"
                    className="h-9 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
                  />
                  <input
                    required={!clienteExistenteId}
                    type="email"
                    value={clienteManual.email}
                    onChange={e => setClienteManual(c => ({ ...c, email: e.target.value }))}
                    placeholder="Email *"
                    className="h-9 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
                  />
                  <input
                    type="tel"
                    value={clienteManual.telefono}
                    onChange={e => setClienteManual(c => ({ ...c, telefono: e.target.value }))}
                    placeholder="Teléfono"
                    className="h-9 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
                  />
                  <input
                    type="text"
                    value={clienteManual.empresa}
                    onChange={e => setClienteManual(c => ({ ...c, empresa: e.target.value }))}
                    placeholder="Empresa"
                    className="h-9 px-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Producto */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package size={15} className="text-[#E8821C]" />
              <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Producto</h2>
            </div>

            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={busquedaProducto}
                onChange={e => setBusquedaProducto(e.target.value)}
                placeholder="Buscar por modelo, marca o categoría…"
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
              />
            </div>

            {loadingData ? (
              <p className="text-[12px] text-[var(--color-text-muted)] text-center py-4">Cargando productos…</p>
            ) : filteredProductos.length === 0 ? (
              <p className="text-[12px] text-[var(--color-text-muted)] text-center py-3">Sin resultados.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto">
                {filteredProductos.map(p => {
                  const selected = productoId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProductoId(selected ? null : p.id)}
                      className={`text-left p-2.5 rounded-lg border transition-all ${
                        selected
                          ? 'border-[#E8821C]/40 bg-[#E8821C]/[0.06]'
                          : 'border-[var(--color-border)] bg-[var(--color-surface-glass)] hover:border-[#E8821C]/30'
                      }`}
                    >
                      <p className="text-[13px] font-bold text-[var(--color-text-primary)] truncate">{p.modelo}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-0.5">
                        {p.marca || 'Sin marca'} · {p.categoria || 'Sin categoría'}
                      </p>
                      {p.capacidad_kg && (
                        <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">Capacidad: {p.capacidad_kg.toLocaleString()} kg</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mensaje */}
          <div className="glass rounded-xl p-5">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Mensaje / notas</label>
            <textarea
              rows={3}
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              placeholder="Detalles de la cotización, términos especiales, accesorios, etc."
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 resize-none"
            />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-5 space-y-4">
            {/* Modalidad */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Modalidad</label>
              <div className="flex gap-1.5">
                {(['venta', 'alquiler'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModalidad(m)}
                    className={`flex-1 h-9 rounded-lg text-[12px] font-semibold transition-all capitalize ${
                      modalidad === m
                        ? 'bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white'
                        : 'bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[#E8821C]/30'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {modalidad === 'alquiler' && (
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Plazo</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['1_ano', '2_anos', '3_anos', '5_anos'] as PeriodoAlquiler[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriodo(p)}
                      className={`h-9 rounded-lg text-[12px] font-semibold transition-all ${
                        periodo === p
                          ? 'bg-[#E8821C]/10 border border-[#E8821C]/30 text-[#E8821C]'
                          : 'bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {periodoLabels[p]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Cantidad</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))} className="w-9 h-9 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[#E8821C]/30 flex items-center justify-center">
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={e => setCantidad(Math.max(1, Number(e.target.value) || 1))}
                  className="flex-1 h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-center text-[14px] font-mono font-bold text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/40"
                />
                <button type="button" onClick={() => setCantidad(c => c + 1)} className="w-9 h-9 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[#E8821C]/30 flex items-center justify-center">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-border)] space-y-1.5">
              <Row label="Precio unitario" value={formatCurrency(precioUnit)} />
              <Row label={`Cantidad × ${cantidad}`} value={formatCurrency(subtotal)} />
              {modalidad === 'venta' && <Row label="Impuesto 7%" value={formatCurrency(impuesto)} />}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Total</span>
                <span className="text-[20px] font-mono font-bold text-[#E8821C]">{formatCurrency(total)}</span>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[12px]">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!puedeGuardar || saving}
              className="w-full h-11 bg-gradient-to-r from-[#E8821C] to-[#C96A10] hover:from-[#FF9F43] hover:to-[#E8821C] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-brand-sm inline-flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Check size={15} />Crear cotización</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
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
