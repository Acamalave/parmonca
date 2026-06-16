'use client';

import { useState, Suspense, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Check, Send, Package,
  Factory, Truck, Leaf, Pill, ShoppingBag, HardHat, MoreHorizontal,
  Home, CloudSun, ArrowLeftRight,
  Clock3, Sun, RotateCw,
  Zap, CalendarDays, CalendarClock, Telescope,
  Sparkles, Layers3, Building2,
  DollarSign, Wallet, CreditCard,
  Hash, MapPin, Phone, Mail, User, FileText, MessageSquare,
  Info, Trash2, Minus, Plus, ArrowRight,
} from 'lucide-react';
import {
  storeProducts, periodoLabels,
  parseModalidad, parsePeriodoAlquiler,
  type Modalidad, type PeriodoAlquiler,
} from '@/lib/store-data';
import { cn } from '@/lib/utils';
import { track, getDeviceId } from '@/lib/visitor';
import { fetchProducto } from '@/lib/productos-live';
import { createClient } from '@/lib/supabase/client';
import type { StoreProduct } from '@/lib/store-data';
import { useCotizacionCart } from '@/lib/cotizacion-cart';
import { usePais } from '@/context/PaisContext';

// ────────────────────────────────────────────────────────────────────────────
// Wizard configuration
// ────────────────────────────────────────────────────────────────────────────

type StepId =
  | 'industria'
  | 'operacion'
  | 'frecuencia'
  | 'plazo'
  | 'flota'
  | 'presupuesto'
  | 'financiamiento'
  | 'contacto'
  | 'confirmar';

// Los accesorios y opciones de seguridad no se muestran al cliente:
// los explica un asesor durante el seguimiento de la cotización.
const STEP_ORDER: StepId[] = [
  'industria', 'operacion', 'frecuencia', 'plazo',
  'flota', 'presupuesto', 'financiamiento',
  'contacto', 'confirmar',
];

type OptionCard = {
  value: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
};

const INDUSTRIAS: OptionCard[] = [
  { value: 'almacen', title: 'Almacén', icon: Package },
  { value: 'manufactura', title: 'Manufactura', icon: Factory },
  { value: 'construccion', title: 'Construcción', icon: HardHat },
  { value: 'logistica', title: 'Logística', icon: Truck },
  { value: 'retail', title: 'Retail', icon: ShoppingBag },
  { value: 'agricola', title: 'Agrícola', icon: Leaf },
  { value: 'farmaceutica', title: 'Farmacéutica', icon: Pill },
  { value: 'otro', title: 'Otro', icon: MoreHorizontal },
];

const OPERACIONES: OptionCard[] = [
  { value: 'interior', title: 'Interior', icon: Home },
  { value: 'exterior', title: 'Exterior', icon: CloudSun },
  { value: 'mixto', title: 'Mixto', icon: ArrowLeftRight },
];

const FRECUENCIAS: OptionCard[] = [
  { value: '1_turno', title: '1 turno', icon: Sun },
  { value: '2_turnos', title: '2 turnos', icon: Clock3 },
  { value: '3_turnos', title: '3 turnos', icon: RotateCw },
];

const PLAZOS: OptionCard[] = [
  { value: 'inmediato', title: 'Inmediato', icon: Zap },
  { value: '1-2-semanas', title: '1 – 2 semanas', icon: CalendarDays },
  { value: 'planificando', title: 'Planificando', icon: CalendarClock },
  { value: 'explorando', title: 'Investigando', icon: Telescope },
];

const FLOTAS: OptionCard[] = [
  { value: '0', title: 'Ninguno', icon: Sparkles },
  { value: '1-3', title: '1 – 3 equipos', icon: Package },
  { value: '4-10', title: '4 – 10 equipos', icon: Layers3 },
  { value: '10+', title: 'Más de 10', icon: Building2 },
];

const PRESUPUESTOS: OptionCard[] = [
  { value: '<10k', title: 'Menos de $10K', icon: DollarSign },
  { value: '10k-25k', title: '$10K – $25K', icon: DollarSign },
  { value: '25k-50k', title: '$25K – $50K', icon: DollarSign },
  { value: '50k+', title: 'Más de $50K', icon: DollarSign },
  { value: 'flexible', title: 'Flexible', icon: Sparkles },
];

const FINANCIAMIENTOS: OptionCard[] = [
  { value: 'no', title: 'Pago contado', icon: Wallet },
  { value: 'si', title: 'Financiamiento', icon: CreditCard },
];

// ────────────────────────────────────────────────────────────────────────────
// Teléfono por país: código de marcación + cantidad de dígitos nacionales.
// ────────────────────────────────────────────────────────────────────────────
const PAISES_TEL: Record<string, { dial: string; digits: number }> = {
  'Panamá': { dial: '+507', digits: 8 },
  'Costa Rica': { dial: '+506', digits: 8 },
  'Venezuela': { dial: '+58', digits: 10 },
  'Guatemala': { dial: '+502', digits: 8 },
  'Honduras': { dial: '+504', digits: 8 },
  'Nicaragua': { dial: '+505', digits: 8 },
  'Haití': { dial: '+509', digits: 8 },
};
const PAISES_LISTA = Object.keys(PAISES_TEL);
const telInfo = (pais: string) => PAISES_TEL[pais] || { dial: '', digits: 8 };

/** Dígitos nacionales del teléfono, quitando el código de marcación. */
function nationalDigits(telefono: string, pais: string): string {
  const info = telInfo(pais);
  let t = (telefono || '').trim();
  if (info.dial && t.startsWith(info.dial)) t = t.slice(info.dial.length);
  else t = t.replace(/^\+\d{1,4}/, ''); // quita cualquier +código previo
  return t.replace(/\D/g, '');
}

/** ¿El teléfono tiene la cantidad de dígitos esperada para el país? */
function telefonoValido(telefono: string, pais: string): boolean {
  return nationalDigits(telefono, pais).length === telInfo(pais).digits;
}

/** Aplica el código de marcación del país, conservando los dígitos ya escritos. */
function aplicarDial(telefono: string, pais: string): string {
  const info = telInfo(pais);
  const nat = nationalDigits(telefono, pais);
  return nat ? `${info.dial} ${nat}` : `${info.dial} `;
}

// ────────────────────────────────────────────────────────────────────────────
// UI primitives
// ────────────────────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          Paso {current + 1} de {total}
        </p>
        <p className="text-[10px] font-semibold text-[#E8821C]">{pct}%</p>
      </div>
      <div className="h-1 bg-[var(--color-surface-glass)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#E8821C] to-[#C96A10] transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OptionGrid({
  options,
  value,
  onSelect,
  columns = 2,
}: {
  options: OptionCard[];
  value: string | null;
  onSelect: (v: string) => void;
  columns?: 2 | 3 | 4;
}) {
  const colsClass = columns === 4 ? 'sm:grid-cols-4' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';
  return (
    <div className={cn('grid grid-cols-2 gap-2.5', colsClass)}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn(
              'flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors duration-150',
              selected
                ? 'border-[#E8821C] bg-[#E8821C]/[0.06]'
                : 'border-[var(--color-border)] bg-[var(--color-surface-glass)] hover:border-[var(--color-text-muted)]'
            )}
          >
            <Icon
              size={18}
              strokeWidth={1.75}
              className={cn(
                'flex-shrink-0 transition-colors',
                selected ? 'text-[#E8821C]' : 'text-[var(--color-text-secondary)]'
              )}
            />
            <span
              className={cn(
                'text-[13.5px] font-medium leading-tight',
                selected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
              )}
            >
              {opt.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StepHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--color-text-primary)] tracking-tight leading-snug">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1.5 max-w-md">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main wizard
// ────────────────────────────────────────────────────────────────────────────

function CotizarContent() {
  const searchParams = useSearchParams();
  const productoSlug = searchParams.get('producto');
  const cantidadParam = parseInt(searchParams.get('cantidad') || '1');
  // Validamos runtime (no sólo cast) para que un URL malicioso/typeado mal
  // no nos meta strings basura al state.
  const modalidadParam = parseModalidad(searchParams.get('modalidad'));
  const periodoParam = parsePeriodoAlquiler(searchParams.get('periodo'));

  // ── Carrito multi-equipo (visitantes anónimos del landing) ──
  // Si hay items en el carrito, esta página se comporta como "checkout de
  // solicitud de cotización" (multi-producto). Si está vacío, mantiene el
  // flow legacy ?producto=slug.
  const cart = useCotizacionCart();
  const useCart = cart.items.length > 0;
  const [sent, setSent] = useState(false);
  // #16: true salvo que el envío del correo al cliente haya fallado.
  const [emailEnviado, setEmailEnviado] = useState(true);

  // Detección de "vine del carrito pero el carrito está vacío":
  // pasa cuando alguien guarda el link `/cotizar?desde=carrito` o cuando
  // el carrito se vacía en otra pestaña. En ese caso no tiene sentido el
  // wizard — mostramos un fallback que invita a volver al catálogo.
  const desdeCarrito = searchParams.get('desde') === 'carrito';
  // `!sent`: tras enviar limpiamos el carrito (useCart pasa a false); sin este
  // guard, esta pantalla de "vacío" tapaba la de éxito y parecía un error (#15).
  const carritoVacioInesperado =
    cart.hydrated && desdeCarrito && !useCart && !productoSlug && !sent;

  // Producto en vivo desde Supabase; fallback a catálogo estático si
  // todavía no cargó o el slug no existe en la BD.
  const [liveProduct, setLiveProduct] = useState<StoreProduct | null>(null);
  useEffect(() => {
    if (!productoSlug) { setLiveProduct(null); return; }
    const supabase = createClient();
    const reload = () => fetchProducto(productoSlug).then(p => setLiveProduct(p || null));
    reload();

    // Realtime: si el admin cambia el precio/imagen/specs mientras el
    // usuario arma su cotización, la página se actualiza sola.
    const channel = supabase
      .channel(`cotizar_producto_${productoSlug}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parmonca_productos', filter: `slug=eq.${productoSlug}` },
        reload
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [productoSlug]);

  const product = liveProduct || (productoSlug ? storeProducts.find(p => p.slug === productoSlug) : null) || null;
  const cantidad = cantidadParam || 1;

  // ── Pre-llenado desde URL (asesor virtual ya capturó respuestas) ──
  // Mapea valores del asesor (ambiente -> operacion en wizard)
  const preIndustria = searchParams.get('industria') || null;
  const preOperacion = searchParams.get('ambiente') || null;       // ambiente del asesor === operacion del wizard
  const preFrecuencia = searchParams.get('frecuencia') || null;
  const prePlazo = searchParams.get('plazo') || null;

  // ── Wizard state ──
  const [industria, setIndustria] = useState<string | null>(preIndustria);
  const [operacion, setOperacion] = useState<string | null>(preOperacion);
  const [frecuencia, setFrecuencia] = useState<string | null>(preFrecuencia);
  const [plazo, setPlazo] = useState<string | null>(prePlazo);
  const [tamanoFlota, setTamanoFlota] = useState<string | null>(null);
  const [presupuesto, setPresupuesto] = useState<string | null>(null);
  const [financiamiento, setFinanciamiento] = useState<string | null>(null);

  // Construye dinámicamente el orden de pasos saltando los ya respondidos
  const dynamicSteps = useMemo<StepId[]>(() => {
    return STEP_ORDER.filter(s => {
      if (s === 'industria' && preIndustria) return false;
      if (s === 'operacion' && preOperacion) return false;
      if (s === 'frecuencia' && preFrecuencia) return false;
      if (s === 'plazo' && prePlazo) return false;
      return true;
    });
  }, [preIndustria, preOperacion, preFrecuencia, prePlazo]);

  const [stepIndex, setStepIndex] = useState(0);

  // Contact
  const { pais: storePais } = usePais();
  const paisInicial = storePais === 'CR' ? 'Costa Rica' : 'Panamá';
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [pais, setPais] = useState(paisInicial);
  // El teléfono arranca con el código de marcación del país (#13).
  const [telefono, setTelefono] = useState(`${telInfo(paisInicial).dial} `);
  // Si el visitante eligió país en la tienda, prellenamos el formulario con él
  // (Panamá/Costa Rica), salvo que ya lo haya cambiado a mano.
  const paisTouched = useRef(false);
  useEffect(() => {
    if (paisTouched.current) return;
    const nombrePais = storePais === 'CR' ? 'Costa Rica' : 'Panamá';
    setPais(nombrePais);
    setTelefono(prev => aplicarDial(prev, nombrePais));
  }, [storePais]);
  // Al cambiar país: marca como tocado y reescribe el código de área del
  // teléfono conservando los dígitos ya escritos (#13).
  const handlePaisChange = (v: string) => {
    paisTouched.current = true;
    setPais(v);
    setTelefono(prev => aplicarDial(prev, v));
  };
  const [ciudad, setCiudad] = useState('');
  const [ruc, setRuc] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  // Snapshot del carrito antes de limpiarlo, para mostrar el resumen
  // multi-ítem en la pantalla de "¡Cotización enviada!".
  const [enviados, setEnviados] = useState<typeof cart.items>([]);

  const currentStep = dynamicSteps[stepIndex];

  // ── Precios ──
  // En modo carrito, sumamos los precios guardados al momento de agregar
  // (pueden ser 0 si el equipo es "a cotizar"). El asesor confirma los
  // valores finales en la cotización formal — esto es sólo un estimado.
  const precioBase = 0;
  const subtotal = useCart
    ? cart.items.reduce((a, i) => a + (i.precio || 0) * i.cantidad, 0)
    : 0;
  const impuesto = 0; // ITBMS lo aplica el asesor en la cotización formal
  const total = subtotal;

  // ── Step navigation ──
  const goNext = () => setStepIndex(i => Math.min(i + 1, dynamicSteps.length - 1));
  const goBack = () => setStepIndex(i => Math.max(i - 1, 0));
  // Auto-advance helper: selecting a single-choice option advances after a brief delay
  const autoAdvance = (setter: (v: string) => void, campo?: string) => (v: string) => {
    setter(v);
    if (campo) track('form_answer', { campo, valor: v, fuente: 'wizard_cotizar' });
    setTimeout(() => goNext(), 250);
  };

  // Can advance check for required steps
  const canAdvance = useMemo(() => {
    switch (currentStep) {
      case 'industria': return !!industria;
      case 'operacion': return !!operacion;
      case 'frecuencia': return !!frecuencia;
      case 'plazo': return !!plazo;
      case 'flota': return !!tamanoFlota;
      case 'presupuesto': return !!presupuesto;
      case 'financiamiento': return !!financiamiento;
      case 'contacto': return !!nombre && !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && telefonoValido(telefono, pais);
      default: return true;
    }
  }, [currentStep, industria, operacion, frecuencia, plazo, tamanoFlota, presupuesto, financiamiento, nombre, email, telefono, pais]);

  // ── Submit ──
  const handleSubmit = async () => {
    setSending(true);
    setError('');
    try {
      const device_id = getDeviceId();

      // Mark visitor as identified before submitting (asynchronously, fire-and-forget)
      track('identified', { source: 'wizard_cotizar' }, { email, telefono, nombre, empresa });

      // En modo carrito mandamos cada equipo como line item (mismo formato
      // que /cotizaciones/nueva del admin) — el PDF y el email iteran sobre
      // este array para mostrar todos los productos.
      const lineItems = useCart
        ? cart.items.map(i => ({
            tipo: i.tipo,
            modelo: i.modelo,
            marca: i.marca,
            categoria: i.categoria,
            cantidad: i.cantidad,
            precio_unitario: i.precio || 0,
            precio_total: (i.precio || 0) * i.cantidad,
            moneda: i.moneda,
            imagen: i.imagen,
          }))
        : [];

      // El campo `producto` se mantiene por compatibilidad con vistas
      // legacy del admin que aún esperan un único producto principal.
      const productoPayload = useCart
        ? (cart.items[0]
            ? {
                modelo: cart.items[0].modelo,
                marca: cart.items[0].marca || '',
                categoria: cart.items[0].categoria || '',
                precio: cart.items[0].precio || 0,
                imagen: cart.items[0].imagen || '',
              }
            : null)
        : (product ? {
            modelo: product.modelo,
            marca: product.marca,
            categoria: product.categoriaLabel,
            precio: precioBase,
            imagen: product.imagen,
          } : null);

      const cantidadPayload = useCart
        ? cart.items.reduce((a, i) => a + i.cantidad, 0)
        : cantidad;

      const res = await fetch('/api/cotizacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, empresa, email, telefono, pais, ciudad, mensaje,
          industria, tamanoFlota, presupuesto, financiamiento, ruc,
          // Respuestas del asesor virtual — las persistimos para histórico
          ambiente: operacion,
          frecuencia,
          plazo,
          modalidad: modalidadParam,
          periodo: modalidadParam === 'alquiler' ? periodoParam : null,
          producto: productoPayload,
          accesorios: lineItems,
          cantidad: cantidadPayload,
          subtotal,
          impuesto,
          total,
          device_id,
        }),
      });
      if (!res.ok) throw new Error('Error al enviar');

      // #16: el correo puede fallar sin tumbar el flujo; ajustamos el mensaje.
      const data = await res.json().catch(() => null) as { customerEmailOk?: boolean } | null;
      setEmailEnviado(data?.customerEmailOk !== false);

      track('quote_submitted', {
        producto_slug: product?.slug,
        items_count: useCart ? cart.items.length : 1,
        modalidad: modalidadParam,
      }, { email, telefono, nombre, empresa });

      // Limpiar el carrito tras enviar — la solicitud ya está en marcha.
      // Guardamos un snapshot DEEP-COPY antes para que la pantalla de éxito
      // siga pudiendo mostrar el resumen de equipos enviados (si pasamos
      // la referencia, el clear inmediato vaciaría también el snapshot).
      if (useCart) {
        setEnviados([...cart.items]);
        cart.clear();
      }

      setSent(true);
    } catch {
      setError('Error al enviar. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const whatsappNum = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '50760000000').replace(/\D/g, '');
  const equipoLabel = enviados.length > 0
    ? `${enviados.length} ${enviados.length === 1 ? 'equipo' : 'equipos'}`
    : (useCart
        ? `${cart.items.length} ${cart.items.length === 1 ? 'equipo' : 'equipos'}`
        : (product ? `${product.marca} ${product.modelo}` : 'un equipo'));
  const whatsappMsg = encodeURIComponent(
    `Hola PARMONCA, acabo de enviar una solicitud de cotización por ${equipoLabel}. Me gustaría más información.`
  );

  // ────────── Carrito vacío inesperado ──────────
  if (carritoVacioInesperado) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-5">
          <Package size={28} className="text-[var(--color-text-muted)]" />
        </div>
        <h1 className="font-display text-xl font-bold text-[var(--color-text-primary)] mb-1.5">Tu solicitud está vacía</h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] mb-6 leading-relaxed">
          Para pedir cotización formal necesitas agregar al menos un equipo o repuesto.
          Si vaciaste el carrito en otra pestaña, vuelve al catálogo y selecciona los equipos que te interesan.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/productos"
            className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-full bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white font-semibold text-[13px] active:scale-[0.97] transition-all"
          >
            Ver maquinaria
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/productos#repuestos"
            className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold text-[13px] hover:bg-[var(--color-surface-hover)] transition-all"
          >
            Ver repuestos
          </Link>
        </div>
      </div>
    );
  }

  // ────────── Success screen ──────────
  if (sent) {
    const itemsEnviados = enviados.length > 0 ? enviados : (useCart ? cart.items : []);
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <Check size={32} className="text-emerald-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">¡Solicitud de cotización enviada!</h1>
          <p className="text-[var(--color-text-secondary)] text-[14px] mt-2 max-w-md mx-auto">
            Recibimos tu solicitud por {equipoLabel}. Un asesor PARMONCA te contactará en menos de 2 horas hábiles con la cotización formal.
          </p>
          <p className="text-[var(--color-text-muted)] text-[12px] mt-2">
            {emailEnviado
              ? <>Te enviamos también un PDF con el detalle a <strong className="text-[var(--color-text-secondary)]">{email}</strong>.</>
              : <>Tu asesor te hará llegar la cotización formal en PDF a <strong className="text-[var(--color-text-secondary)]">{email}</strong> a la brevedad.</>}
          </p>
        </div>

        {itemsEnviados.length > 0 ? (
          <div className="glass rounded-2xl p-4 mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
              Equipos solicitados ({itemsEnviados.length})
            </p>
            <div className="space-y-2">
              {itemsEnviados.map(it => (
                <div key={it.key} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-surface-glass)]">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center overflow-hidden shrink-0">
                    {it.imagen ? (
                      <Image src={it.imagen} alt={it.modelo} width={48} height={48} className="object-contain w-full h-full" unoptimized />
                    ) : (
                      <Package size={20} className="text-[var(--color-text-muted)]/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {it.marca && (
                      <p className="text-[9px] text-[#E8821C] font-bold uppercase tracking-wider">{it.marca}</p>
                    )}
                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{it.modelo}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{it.tipo === 'repuesto' ? 'Repuesto' : 'Equipo'} · {it.cantidad} und.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : product && (
          <div className="glass rounded-xl p-4 mb-8 flex items-center gap-4">
            <Image src={product.imagenNoBg} alt={product.modelo} width={60} height={60} className="object-contain" />
            <div className="flex-1">
              <p className="text-[10px] text-[#E8821C] font-bold uppercase tracking-wider">{product.marca}</p>
              <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{product.modelo}</p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                {modalidadParam === 'alquiler' ? `Alquiler / ${periodoLabels[periodoParam]}` : 'Compra'} · {cantidad} und.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 text-[10px] font-semibold text-[#E8821C] uppercase tracking-wider whitespace-nowrap">
              Precio personalizado
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`https://wa.me/${whatsappNum}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-11 px-6 bg-[#25D366] text-white font-semibold rounded-full hover:bg-[#20BD5C] transition-all active:scale-[0.97]"
          >
            <MessageSquare size={15} />
            Seguir por WhatsApp
          </a>
          <Link
            href="/productos"
            className="flex items-center justify-center gap-2 h-11 px-6 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold rounded-full hover:bg-[var(--color-surface-hover)] transition-all"
          >
            Ver más equipos
          </Link>
        </div>
      </div>
    );
  }


  // ────────── Confirmation summary rows ──────────
  const labelOf = (list: OptionCard[], val: string | null) => list.find(o => o.value === val)?.title || '—';

  const summaryRows: { label: string; value: string }[] = [
    { label: 'Modalidad', value: modalidadParam === 'alquiler' ? `Alquiler / ${periodoLabels[periodoParam]}` : 'Compra directa' },
    { label: 'Industria', value: labelOf(INDUSTRIAS, industria) },
    { label: 'Operación', value: labelOf(OPERACIONES, operacion) },
    { label: 'Frecuencia', value: labelOf(FRECUENCIAS, frecuencia) },
    { label: 'Plazo', value: labelOf(PLAZOS, plazo) },
    { label: 'Flota actual', value: labelOf(FLOTAS, tamanoFlota) },
    { label: 'Presupuesto', value: labelOf(PRESUPUESTOS, presupuesto) },
    { label: 'Financiamiento', value: labelOf(FINANCIAMIENTOS, financiamiento) },
  ];

  // ────────── Wizard UI ──────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={useCart ? '/productos' : (product ? `/productos/${product.slug}` : '/productos')}
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors"
        >
          <ArrowLeft size={14} />
          {useCart ? 'Seguir agregando equipos' : (product ? 'Volver al producto' : 'Volver al catálogo')}
        </Link>
        {useCart ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 text-[11px] font-semibold text-[#E8821C] uppercase tracking-wider">
            <Package size={11} />
            {cart.items.length} {cart.items.length === 1 ? 'equipo' : 'equipos'}
          </span>
        ) : product && (
          <div className="flex items-center gap-2">
            <Image src={product.imagenNoBg} alt={product.modelo} width={32} height={32} className="object-contain" />
            <div className="text-right">
              <p className="text-[9px] text-[#E8821C] font-bold uppercase tracking-wider leading-none">{product.marca}</p>
              <p className="text-[12px] font-semibold text-[var(--color-text-primary)] leading-tight">{product.modelo}</p>
            </div>
          </div>
        )}
      </div>

      {/* Cart panel — visible siempre que haya items: deja claro qué se va a
          enviar al asesor y permite editar cantidades sin abandonar el wizard. */}
      {useCart && (
        <div className="mb-6 rounded-2xl border border-[#E8821C]/25 bg-[#E8821C]/[0.04] overflow-hidden">
          <div className="flex items-start gap-2.5 px-4 py-3 border-b border-[#E8821C]/15 bg-[#E8821C]/[0.06]">
            <Info size={15} className="text-[#E8821C] mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-[var(--color-text-primary)] leading-snug">
                Esto no es una compra — es una solicitud de cotización formal.
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-snug">
                Un asesor PARMONCA revisará los equipos seleccionados y te enviará la cotización formal con precios vigentes, condiciones y disponibilidad.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {cart.items.map(it => (
              <div key={it.key} className="flex items-center gap-3 p-3">
                <Link href={it.tipo === 'repuesto' ? `/repuestos/${it.ref}` : `/productos/${it.ref}`} className="shrink-0">
                  <div className="w-14 h-14 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden">
                    {it.imagen ? (
                      <Image src={it.imagen} alt={it.modelo} width={56} height={56} className="object-contain w-full h-full" unoptimized />
                    ) : (
                      <Package size={22} className="text-[var(--color-text-muted)]/40" />
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  {it.marca && (
                    <p className="text-[9px] text-[#E8821C] font-bold uppercase tracking-wider">{it.marca}</p>
                  )}
                  <Link
                    href={it.tipo === 'repuesto' ? `/repuestos/${it.ref}` : `/productos/${it.ref}`}
                    className="block text-[13px] font-semibold text-[var(--color-text-primary)] hover:text-[#E8821C] truncate transition-colors"
                  >
                    {it.modelo}
                  </Link>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    {it.tipo === 'repuesto' ? 'Repuesto' : 'Equipo'}{it.categoria ? ` · ${it.categoria}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => cart.setCantidad(it.key, it.cantidad - 1)}
                    className="w-7 h-7 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                    aria-label="Restar"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-mono text-[12px] font-bold text-[var(--color-text-primary)] min-w-[24px] text-center">{it.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => cart.setCantidad(it.key, it.cantidad + 1)}
                    className="w-7 h-7 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                    aria-label="Sumar"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => cart.removeItem(it.key)}
                    className="ml-1 w-7 h-7 rounded-md border border-rose-500/20 bg-rose-500/[0.06] text-rose-300 hover:bg-rose-500/15 flex items-center justify-center"
                    aria-label="Quitar"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {subtotal > 0 && (
            <div className="px-4 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface-glass)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)]">Estimado preliminar (sujeto a cotización formal)</span>
              <span className="font-mono text-[14px] font-bold text-[var(--color-text-primary)]">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      )}

      <div className="mb-8">
        <ProgressBar current={stepIndex} total={dynamicSteps.length} />
      </div>

      {/* Step content */}
      <div key={currentStep} className="animate-in fade-in duration-300">
        {currentStep === 'industria' && (
          <>
            <StepHeader
              title="¿En qué industria lo usarás?"
            />
            <OptionGrid options={INDUSTRIAS} value={industria} onSelect={autoAdvance(setIndustria, "industria")} columns={2} />
          </>
        )}

        {currentStep === 'operacion' && (
          <>
            <StepHeader
              title="¿Dónde operará?"
            />
            <OptionGrid options={OPERACIONES} value={operacion} onSelect={autoAdvance(setOperacion, "operacion")} columns={3} />
          </>
        )}

        {currentStep === 'frecuencia' && (
          <>
            <StepHeader
              title="¿Con qué frecuencia?"
            />
            <OptionGrid options={FRECUENCIAS} value={frecuencia} onSelect={autoAdvance(setFrecuencia, "frecuencia")} columns={3} />
          </>
        )}

        {currentStep === 'plazo' && (
          <>
            <StepHeader
              title="¿Cuándo lo necesitas?"
            />
            <OptionGrid options={PLAZOS} value={plazo} onSelect={autoAdvance(setPlazo, "plazo")} columns={2} />
          </>
        )}

        {currentStep === 'flota' && (
          <>
            <StepHeader
              title="¿Cuántos equipos operas hoy?"
            />
            <OptionGrid options={FLOTAS} value={tamanoFlota} onSelect={autoAdvance(setTamanoFlota, "tamano_flota")} columns={2} />
          </>
        )}

        {currentStep === 'presupuesto' && (
          <>
            <StepHeader
              title="Presupuesto estimado"
            />
            <OptionGrid options={PRESUPUESTOS} value={presupuesto} onSelect={autoAdvance(setPresupuesto, "presupuesto")} columns={2} />
          </>
        )}

        {currentStep === 'financiamiento' && (
          <>
            <StepHeader
              title="¿Cómo prefieres pagar?"
            />
            <OptionGrid options={FINANCIAMIENTOS} value={financiamiento} onSelect={autoAdvance(setFinanciamiento, "financiamiento")} columns={2} />
          </>
        )}

        {currentStep === 'contacto' && (
          <>
            <StepHeader
              title="Tus datos de contacto"
              subtitle="Solo lo necesario para enviarte la cotización."
            />

            <div className="space-y-4">
              {/* Nombre + Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput icon={User} label="Nombre completo*" value={nombre} onChange={setNombre} placeholder="Tu nombre" autoFocus />
                <FieldInput icon={Building2} label="Empresa" value={empresa} onChange={setEmpresa} placeholder="Nombre de la empresa" />
              </div>

              {/* País + Ciudad (#13: el país va antes del teléfono y define su código) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldSelect
                  icon={MapPin}
                  label="País*"
                  value={pais}
                  onChange={handlePaisChange}
                  options={PAISES_LISTA}
                />
                <FieldInput icon={MapPin} label="Ciudad" value={ciudad} onChange={setCiudad} placeholder="Ciudad o zona" />
              </div>

              {/* Email + Teléfono (#14: longitud validada por país) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput icon={Mail} type="email" label="Email*" value={email} onChange={setEmail} placeholder="tu@empresa.com" />
                <FieldInput
                  icon={Phone}
                  label="Teléfono*"
                  type="tel"
                  inputMode="tel"
                  value={telefono}
                  onChange={setTelefono}
                  placeholder={`${telInfo(pais).dial} ${'0'.repeat(telInfo(pais).digits)}`}
                  error={nationalDigits(telefono, pais).length > 0 && !telefonoValido(telefono, pais)
                    ? `Ingresa ${telInfo(pais).digits} dígitos para ${pais}`
                    : undefined}
                />
              </div>

              {/* RUC opcional */}
              <FieldInput icon={Hash} label="RUC / NIT (opcional)" value={ruc} onChange={setRuc} placeholder="Para factura fiscal" />

              {/* Mensaje */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
                  <FileText size={11} className="text-[#E8821C]" />
                  Notas adicionales
                </label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={3}
                  placeholder="Algo específico que quieras comentarnos..."
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 transition-all resize-none"
                />
              </div>
            </div>
          </>
        )}

        {currentStep === 'confirmar' && (
          <>
            <StepHeader
              title="Revisa y confirma"
              subtitle="Esta es una solicitud de cotización formal — no se ejecuta ninguna compra. Un asesor te confirmará precios y disponibilidad."
            />

            {/* Equipos solicitados (cart mode) o producto único (legacy) */}
            {useCart ? (
              <div className="glass rounded-2xl p-4 mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">
                  Equipos solicitados ({cart.items.length})
                </p>
                <div className="space-y-2">
                  {cart.items.map(it => (
                    <div key={it.key} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-surface-glass)]">
                      <div className="w-12 h-12 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center overflow-hidden shrink-0">
                        {it.imagen ? (
                          <Image src={it.imagen} alt={it.modelo} width={48} height={48} className="object-contain w-full h-full" unoptimized />
                        ) : (
                          <Package size={20} className="text-[var(--color-text-muted)]/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {it.marca && (
                          <p className="text-[9px] text-[#E8821C] font-bold uppercase tracking-wider">{it.marca}</p>
                        )}
                        <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{it.modelo}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">{it.tipo === 'repuesto' ? 'Repuesto' : 'Equipo'} · {it.cantidad} und.</p>
                      </div>
                      {(it.precio || 0) > 0 && (
                        <span className="font-mono text-[12px] font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                          ${((it.precio || 0) * it.cantidad).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {subtotal > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--color-text-muted)]">Estimado preliminar</span>
                    <span className="font-mono text-[14px] font-bold text-[var(--color-text-primary)]">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
            ) : product && (
              <div className="glass rounded-2xl p-4 mb-4 flex items-center gap-4">
                <Image src={product.imagenNoBg} alt={product.modelo} width={64} height={64} className="object-contain" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#E8821C] font-bold uppercase tracking-wider">{product.marca}</p>
                  <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{product.modelo}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{product.categoriaLabel} · Cantidad: {cantidad}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 text-[10px] font-semibold text-[#E8821C] uppercase tracking-wider whitespace-nowrap">
                  Precio a consultar
                </span>
              </div>
            )}

            {/* Resumen de respuestas */}
            <div className="glass rounded-2xl p-4 mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">
                Tu operación
              </p>
              <div className="space-y-2">
                {summaryRows.map(row => (
                  <div key={row.label} className="flex items-center justify-between text-[13px]">
                    <span className="text-[var(--color-text-secondary)]">{row.label}</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contacto */}
            <div className="glass rounded-2xl p-4 mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">
                Contacto
              </p>
              <div className="space-y-1.5 text-[13px]">
                <p className="font-semibold text-[var(--color-text-primary)]">{nombre}{empresa ? ` · ${empresa}` : ''}</p>
                <p className="text-[var(--color-text-secondary)]">{email}</p>
                <p className="text-[var(--color-text-secondary)]">{telefono}</p>
                <p className="text-[var(--color-text-muted)] text-[12px]">{[ciudad, pais].filter(Boolean).join(', ')}</p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl p-3 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px]">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={sending}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E8821C] to-[#C96A10] hover:from-[#FF9F43] hover:to-[#E8821C] text-white font-semibold transition-all active:scale-[0.98] disabled:opacity-60 glow-brand-sm"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={15} />
                  {useCart ? `Solicitar cotización (${cart.items.length} ${cart.items.length === 1 ? 'equipo' : 'equipos'})` : 'Enviar cotización'}
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-[var(--color-text-muted)] mt-3">
              No se ejecuta ninguna compra. Al enviar aceptas ser contactado por un asesor de PARMONCA con la cotización formal.
            </p>
          </>
        )}
      </div>

      {/* Footer nav */}
      {currentStep !== 'confirmar' && (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={goBack}
            disabled={stepIndex === 0}
            className="flex items-center gap-1.5 h-10 px-4 rounded-full border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={14} />
            Atrás
          </button>

          <button
            onClick={goNext}
            disabled={!canAdvance}
            className={cn(
              'h-10 px-6 rounded-full text-[13px] font-semibold transition-all active:scale-[0.98]',
              canAdvance
                ? 'bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white'
                : 'bg-[var(--color-surface-glass)] text-[var(--color-text-muted)] cursor-not-allowed'
            )}
          >
            Siguiente
          </button>
        </div>
      )}

    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Small form field primitives
// ────────────────────────────────────────────────────────────────────────────

function FieldInput({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  error,
  autoFocus,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  error?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
        <Icon size={11} className="text-[#E8821C]" />
        {label}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-invalid={!!error}
        className={cn(
          'w-full h-11 px-4 rounded-xl bg-[var(--color-surface-glass)] border text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none transition-all',
          error ? 'border-rose-500/60 focus:border-rose-500/60' : 'border-[var(--color-border)] focus:border-[#E8821C]/40'
        )}
      />
      {error && <p className="mt-1 text-[11px] text-rose-400">{error}</p>}
    </div>
  );
}

function FieldSelect({
  icon: Icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">
        <Icon size={11} className="text-[#E8821C]" />
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-4 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/40 transition-all appearance-none"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Exported page (with Suspense for useSearchParams)
// ────────────────────────────────────────────────────────────────────────────

export default function CotizarPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-[var(--color-text-muted)] text-sm">Cargando…</div>}>
      <CotizarContent />
    </Suspense>
  );
}
