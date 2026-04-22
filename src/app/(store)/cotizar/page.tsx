'use client';

import { useState, Suspense, useMemo } from 'react';
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
  ShieldCheck, Wrench, Cpu, Hash, MapPin, Phone, Mail, User, FileText, MessageSquare, Box,
} from 'lucide-react';
import {
  storeProducts, accesorios as allAccesorios, periodoLabels,
  type Modalidad, type PeriodoAlquiler,
} from '@/lib/store-data';
import { formatCurrency, cn } from '@/lib/utils';

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
  | 'accesorios'
  | 'contacto'
  | 'confirmar';

const STEP_ORDER: StepId[] = [
  'industria', 'operacion', 'frecuencia', 'plazo',
  'flota', 'presupuesto', 'financiamiento',
  'accesorios', 'contacto', 'confirmar',
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
  { value: 'ocasional', title: 'Ocasional', icon: Clock3 },
  { value: 'turno-completo', title: 'Turno completo', icon: Sun },
  { value: '24-7', title: 'Continuo 24/7', icon: RotateCw },
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

const CATEGORIA_ACC_ICON: Record<string, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  seguridad: ShieldCheck,
  productividad: Wrench,
  proteccion: HardHat,
  tecnologia: Cpu,
};

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
  const accIdsFromUrl = searchParams.get('accesorios')?.split(',').filter(Boolean) || [];
  const cantidadParam = parseInt(searchParams.get('cantidad') || '1');
  const modalidadParam = (searchParams.get('modalidad') as Modalidad) || 'venta';
  const periodoParam = (searchParams.get('periodo') as PeriodoAlquiler) || 'mensual';

  const product = productoSlug ? storeProducts.find(p => p.slug === productoSlug) : null;
  const cantidad = cantidadParam || 1;

  // ── Wizard state ──
  const [stepIndex, setStepIndex] = useState(0);
  const [industria, setIndustria] = useState<string | null>(null);
  const [operacion, setOperacion] = useState<string | null>(null);
  const [frecuencia, setFrecuencia] = useState<string | null>(null);
  const [plazo, setPlazo] = useState<string | null>(null);
  const [tamanoFlota, setTamanoFlota] = useState<string | null>(null);
  const [presupuesto, setPresupuesto] = useState<string | null>(null);
  const [financiamiento, setFinanciamiento] = useState<string | null>(null);
  const [accesoriosIds, setAccesoriosIds] = useState<string[]>(accIdsFromUrl);
  const [accCategoria, setAccCategoria] = useState<string>('todas');

  // Contact
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pais, setPais] = useState('Panamá');
  const [ciudad, setCiudad] = useState('');
  const [ruc, setRuc] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const currentStep = STEP_ORDER[stepIndex];

  // ── Precios calculados ──
  const selectedAccesorios = allAccesorios.filter(a => accesoriosIds.includes(a.id));
  const precioAccesorios = selectedAccesorios.reduce((s, a) => s + a.precio, 0);
  const precioBase = modalidadParam === 'alquiler' && product
    ? product.preciosAlquiler[periodoParam]
    : (product?.precioDesde || 0);
  const precioUnitario = precioBase + (modalidadParam === 'venta' ? precioAccesorios : 0);
  const subtotal = precioUnitario * cantidad;
  const impuesto = modalidadParam === 'venta' ? subtotal * 0.07 : 0;
  const total = subtotal + impuesto;

  // ── Step navigation ──
  const goNext = () => setStepIndex(i => Math.min(i + 1, STEP_ORDER.length - 1));
  const goBack = () => setStepIndex(i => Math.max(i - 1, 0));
  // Auto-advance helper: selecting a single-choice option advances after a brief delay
  const autoAdvance = (setter: (v: string) => void) => (v: string) => {
    setter(v);
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
      case 'accesorios': return true; // optional
      case 'contacto': return !!nombre && !!email && !!telefono && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      default: return true;
    }
  }, [currentStep, industria, operacion, frecuencia, plazo, tamanoFlota, presupuesto, financiamiento, nombre, email, telefono]);

  // ── Submit ──
  const handleSubmit = async () => {
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/cotizacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, empresa, email, telefono, pais, ciudad, mensaje,
          industria, tamanoFlota, presupuesto, financiamiento, ruc,
          modalidad: modalidadParam,
          periodo: modalidadParam === 'alquiler' ? periodoParam : null,
          producto: product ? {
            modelo: product.modelo,
            marca: product.marca,
            categoria: product.categoriaLabel,
            precio: precioBase,
            imagen: product.imagen,
          } : null,
          accesorios: selectedAccesorios.map(a => ({ nombre: a.nombre, precio: a.precio })),
          cantidad, subtotal, impuesto, total,
        }),
      });
      if (!res.ok) throw new Error('Error al enviar');
      setSent(true);
    } catch {
      setError('Error al enviar. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const whatsappNum = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '50760000000').replace(/\D/g, '');
  const whatsappMsg = encodeURIComponent(
    `Hola PARMONCA, acabo de enviar una cotización por ${product ? `${product.marca} ${product.modelo}` : 'un equipo'} (${modalidadParam === 'alquiler' ? 'alquiler' : 'compra'}). Me gustaría más información.`
  );

  // ────────── Success screen ──────────
  if (sent) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <Check size={32} className="text-emerald-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">¡Cotización enviada!</h1>
          <p className="text-[var(--color-text-secondary)] text-[14px] mt-2">
            Recibimos tu solicitud. Un asesor te contactará en las próximas horas.
          </p>
        </div>

        {product && (
          <div className="glass rounded-xl p-4 mb-8 flex items-center gap-4">
            <Image src={product.imagenNoBg} alt={product.modelo} width={60} height={60} className="object-contain" />
            <div className="flex-1">
              <p className="text-[10px] text-[#E8821C] font-bold uppercase tracking-wider">{product.marca}</p>
              <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{product.modelo}</p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                {modalidadParam === 'alquiler' ? `Alquiler / ${periodoLabels[periodoParam]}` : 'Compra'} · {cantidad} und. · {selectedAccesorios.length} accesorios
              </p>
            </div>
            <p className="font-num text-xl font-bold text-[#E8821C]">{formatCurrency(total)}</p>
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

  // ────────── Accesorios filtering ──────────
  const accFiltered = accCategoria === 'todas'
    ? allAccesorios
    : allAccesorios.filter(a => a.categoria === accCategoria);

  const toggleAccesorio = (id: string) => {
    setAccesoriosIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

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
          href={product ? `/productos/${product.slug}` : '/productos'}
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors"
        >
          <ArrowLeft size={14} />
          {product ? 'Volver al producto' : 'Volver al catálogo'}
        </Link>
        {product && (
          <div className="flex items-center gap-2">
            <Image src={product.imagenNoBg} alt={product.modelo} width={32} height={32} className="object-contain" />
            <div className="text-right">
              <p className="text-[9px] text-[#E8821C] font-bold uppercase tracking-wider leading-none">{product.marca}</p>
              <p className="text-[12px] font-semibold text-[var(--color-text-primary)] leading-tight">{product.modelo}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        <ProgressBar current={stepIndex} total={STEP_ORDER.length} />
      </div>

      {/* Step content */}
      <div key={currentStep} className="animate-in fade-in duration-300">
        {currentStep === 'industria' && (
          <>
            <StepHeader
              title="¿En qué industria lo usarás?"
            />
            <OptionGrid options={INDUSTRIAS} value={industria} onSelect={autoAdvance(setIndustria)} columns={2} />
          </>
        )}

        {currentStep === 'operacion' && (
          <>
            <StepHeader
              title="¿Dónde operará?"
            />
            <OptionGrid options={OPERACIONES} value={operacion} onSelect={autoAdvance(setOperacion)} columns={3} />
          </>
        )}

        {currentStep === 'frecuencia' && (
          <>
            <StepHeader
              title="¿Con qué frecuencia?"
            />
            <OptionGrid options={FRECUENCIAS} value={frecuencia} onSelect={autoAdvance(setFrecuencia)} columns={3} />
          </>
        )}

        {currentStep === 'plazo' && (
          <>
            <StepHeader
              title="¿Cuándo lo necesitas?"
            />
            <OptionGrid options={PLAZOS} value={plazo} onSelect={autoAdvance(setPlazo)} columns={2} />
          </>
        )}

        {currentStep === 'flota' && (
          <>
            <StepHeader
              title="¿Cuántos equipos operas hoy?"
            />
            <OptionGrid options={FLOTAS} value={tamanoFlota} onSelect={autoAdvance(setTamanoFlota)} columns={2} />
          </>
        )}

        {currentStep === 'presupuesto' && (
          <>
            <StepHeader
              title="Presupuesto estimado"
            />
            <OptionGrid options={PRESUPUESTOS} value={presupuesto} onSelect={autoAdvance(setPresupuesto)} columns={2} />
          </>
        )}

        {currentStep === 'financiamiento' && (
          <>
            <StepHeader
              title="¿Cómo prefieres pagar?"
            />
            <OptionGrid options={FINANCIAMIENTOS} value={financiamiento} onSelect={autoAdvance(setFinanciamiento)} columns={2} />
          </>
        )}

        {currentStep === 'accesorios' && (
          <>
            <StepHeader
              title={product ? `Accesorios para ${product.modelo}` : 'Accesorios'}
              subtitle="Opcional. Selecciona los que necesites."
            />

            {/* Category filter chips */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              <button
                onClick={() => setAccCategoria('todas')}
                className={cn(
                  'h-7 px-3 rounded-full text-[12px] font-medium transition-colors',
                  accCategoria === 'todas'
                    ? 'bg-[#E8821C] text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )}
              >
                Todas
              </button>
              {(['seguridad', 'productividad', 'proteccion', 'tecnologia'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setAccCategoria(cat)}
                  className={cn(
                    'h-7 px-3 rounded-full text-[12px] font-medium capitalize transition-colors',
                    accCategoria === cat
                      ? 'bg-[#E8821C] text-white'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
              {accFiltered.map(acc => {
                const selected = accesoriosIds.includes(acc.id);
                const Icon = CATEGORIA_ACC_ICON[acc.categoria] || Package;
                return (
                  <button
                    key={acc.id}
                    onClick={() => toggleAccesorio(acc.id)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors',
                      selected
                        ? 'border-[#E8821C] bg-[#E8821C]/[0.06]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface-glass)] hover:border-[var(--color-text-muted)]'
                    )}
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.75}
                      className={cn(
                        'flex-shrink-0',
                        selected ? 'text-[#E8821C]' : 'text-[var(--color-text-secondary)]'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[13px] font-medium leading-tight',
                        selected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
                      )}>
                        {acc.nombre}
                      </p>
                    </div>
                    <span className="text-[12px] font-num font-medium text-[var(--color-text-muted)] whitespace-nowrap">
                      +{formatCurrency(acc.precio)}
                    </span>
                  </button>
                );
              })}
            </div>

            {accesoriosIds.length > 0 && (
              <p className="text-[12px] text-[var(--color-text-secondary)] mb-4">
                {accesoriosIds.length} {accesoriosIds.length === 1 ? 'accesorio' : 'accesorios'} · +{formatCurrency(precioAccesorios)}
              </p>
            )}
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

              {/* Email + Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput icon={Mail} type="email" label="Email*" value={email} onChange={setEmail} placeholder="tu@empresa.com" />
                <FieldInput icon={Phone} label="Teléfono*" value={telefono} onChange={setTelefono} placeholder="+507 6000 0000" />
              </div>

              {/* País + Ciudad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldSelect
                  icon={MapPin}
                  label="País*"
                  value={pais}
                  onChange={setPais}
                  options={['Panamá', 'Costa Rica', 'Venezuela', 'Guatemala', 'Honduras', 'Nicaragua', 'Haití']}
                />
                <FieldInput icon={MapPin} label="Ciudad" value={ciudad} onChange={setCiudad} placeholder="Ciudad o zona" />
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
            />

            {/* Producto */}
            {product && (
              <div className="glass rounded-2xl p-4 mb-4 flex items-center gap-4">
                <Image src={product.imagenNoBg} alt={product.modelo} width={64} height={64} className="object-contain" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#E8821C] font-bold uppercase tracking-wider">{product.marca}</p>
                  <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{product.modelo}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">{product.categoriaLabel} · Cantidad: {cantidad}</p>
                </div>
                <p className="font-num text-lg font-bold text-[#E8821C] whitespace-nowrap">
                  {formatCurrency(total)}
                </p>
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
                {selectedAccesorios.length > 0 && (
                  <div className="flex items-start justify-between text-[13px] pt-2 border-t border-[var(--color-border)]">
                    <span className="text-[var(--color-text-secondary)]">Accesorios</span>
                    <span className="font-medium text-[var(--color-text-primary)] text-right max-w-[60%]">
                      {selectedAccesorios.map(a => a.nombre).join(', ')}
                    </span>
                  </div>
                )}
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
                  Enviar cotización
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-[var(--color-text-muted)] mt-3">
              Al enviar aceptas ser contactado por un asesor de PARMONCA.
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

          {currentStep === 'accesorios' ? (
            <div className="flex gap-2">
              <button
                onClick={goNext}
                className="h-10 px-4 rounded-full text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Omitir
              </button>
              <button
                onClick={goNext}
                className="h-10 px-6 rounded-full bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white text-[13px] font-semibold transition-all active:scale-[0.98]"
              >
                Siguiente
              </button>
            </div>
          ) : (
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
          )}
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
  autoFocus,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full h-11 px-4 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40 transition-all"
      />
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
