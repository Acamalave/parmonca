'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, Send, User, Building2, MapPin, Phone, Mail, Zap, Package, Shield } from 'lucide-react';
import { storeProducts, accesorios } from '@/lib/store-data';
import { formatCurrency, cn } from '@/lib/utils';

function CotizarContent() {
  const searchParams = useSearchParams();
  const productoSlug = searchParams.get('producto');
  const accIds = searchParams.get('accesorios')?.split(',').filter(Boolean) || [];
  const cantidadParam = parseInt(searchParams.get('cantidad') || '1');

  const product = productoSlug ? storeProducts.find(p => p.slug === productoSlug) : null;
  const selectedAccesorios = accesorios.filter(a => accIds.includes(a.id));
  const cantidad = cantidadParam || 1;

  const precioAccesorios = selectedAccesorios.reduce((s, a) => s + a.precio, 0);
  const precioUnitario = (product?.precioDesde || 0) + precioAccesorios;
  const subtotal = precioUnitario * cantidad;
  const impuesto = subtotal * 0.07;
  const total = subtotal + impuesto;

  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [pais, setPais] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/cotizacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, empresa, email, telefono, pais, mensaje,
          producto: product ? {
            modelo: product.modelo,
            marca: product.marca,
            categoria: product.categoriaLabel,
            precio: product.precioDesde,
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

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const callDay = dayNames[tomorrow.getDay()];
  const callDate = `${tomorrow.getDate()} de ${monthNames[tomorrow.getMonth()]}`;

  const opt2 = new Date(tomorrow);
  opt2.setDate(opt2.getDate() + 1);
  const opt2Day = dayNames[opt2.getDay()];
  const opt2Date = `${opt2.getDate()} de ${monthNames[opt2.getMonth()]}`;

  const [showContactModal, setShowContactModal] = useState(false);
  const [scheduledSlot, setScheduledSlot] = useState('');

  if (sent) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* Success header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <Check size={32} className="text-emerald-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">¡Cotización enviada!</h1>
          <p className="text-[var(--color-text-secondary)] text-[14px] mt-2">Tu solicitud fue recibida. Esto es lo que sigue:</p>
        </div>

        {/* Order summary card */}
        {product && (
          <div className="glass rounded-xl p-4 mb-8 flex items-center gap-4">
            <Image src={product.imagenNoBg} alt={product.modelo} width={60} height={60} className="object-contain" />
            <div className="flex-1">
              <p className="text-[10px] text-[#E8821C] font-bold uppercase tracking-wider">{product.marca}</p>
              <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{product.modelo}</p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">{cantidad} und. · {selectedAccesorios.length} accesorios</p>
            </div>
            <p className="font-num text-xl font-bold text-[#E8821C]">{formatCurrency(total)}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-0">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <Check size={16} className="text-white" />
              </div>
              <div className="w-0.5 h-full bg-emerald-500/30 my-1" />
            </div>
            <div className="pb-6">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">Cotización recibida</p>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">Tu configuración fue registrada en nuestro sistema</p>
              <p className="text-[11px] text-emerald-400 mt-1 font-medium">Completado — Ahora</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-[#E8821C]/20 border border-[#E8821C]/30 flex items-center justify-center flex-shrink-0">
                <Mail size={15} className="text-[#E8821C]" />
              </div>
              <div className="w-0.5 h-full bg-[var(--color-border)] my-1" />
            </div>
            <div className="pb-6">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">Propuesta en tu correo</p>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">Recibirás un email con el detalle completo de tu cotización y condiciones comerciales</p>
              <p className="text-[11px] text-[#E8821C] mt-1 font-medium">En camino — Próximos minutos</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
                <Phone size={15} className="text-[var(--color-text-secondary)]" />
              </div>
              <div className="w-0.5 h-full bg-[var(--color-border)] my-1" />
            </div>
            <div className="pb-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">Llamada con tu asesor</p>
                  <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
                    Un especialista te contactará para verificar que el equipo seleccionado se adapta a tu operación y guiarte con el siguiente paso.
                  </p>
                </div>
              </div>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
                <span className="text-[12px] font-num font-medium text-[var(--color-text-primary)]">{callDay} {callDate} · 2:00 PM</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
                <Package size={15} className="text-[var(--color-text-muted)]" />
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Confirmación y entrega</p>
              <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">Cierre de condiciones, financiamiento y coordinación de entrega</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => setShowContactModal(true)}
            className="flex items-center justify-center gap-2 h-11 px-6 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white font-semibold rounded-full hover:shadow-[0_0_25px_#E8821C40] transition-all active:scale-[0.97]">
            <Phone size={15} />
            Contactar ahora
          </button>
          <Link href="/productos"
            className="flex items-center justify-center gap-2 h-11 px-6 border border-[var(--color-border)] text-[var(--color-text-secondary)] font-medium rounded-full hover:bg-[var(--color-surface-hover)] transition-all">
            Ver más equipos
          </Link>
        </div>

        {/* Contact Modal */}
        {showContactModal && (
          <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50" onClick={() => setShowContactModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-[360px] rounded-[20px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] bg-[var(--color-surface)] border border-[var(--color-border)]">
                {!scheduledSlot ? (
                  <>
                    <div className="px-6 pt-7 pb-5 text-center">
                      <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-b from-[#E8821C] to-[#C96A10] flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(232,130,28,0.3)]">
                        <Phone size={22} className="text-white" />
                      </div>
                      <h3 className="text-[17px] font-semibold text-[var(--color-text-primary)] tracking-tight">Agenda tu llamada</h3>
                      <p className="text-[13px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                        Nuestros asesores no están disponibles en este momento
                      </p>
                    </div>

                    <div className="h-px bg-[var(--color-border)] mx-5" />

                    <div className="px-5 py-3">
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2 px-1">Elige un horario</p>

                      <button onClick={() => setScheduledSlot(`${callDay} ${callDate} a las 10:00 AM`)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-glass)] transition-all text-left group">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[14px]">🌅</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{callDay}</p>
                          <p className="text-[12px] text-[var(--color-text-secondary)]">{callDate}</p>
                        </div>
                        <span className="font-num text-[15px] font-semibold text-[#E8821C]">10 AM</span>
                      </button>

                      <button onClick={() => setScheduledSlot(`${callDay} ${callDate} a las 3:00 PM`)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-glass)] transition-all text-left group">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[14px]">☀️</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{callDay}</p>
                          <p className="text-[12px] text-[var(--color-text-secondary)]">{callDate}</p>
                        </div>
                        <span className="font-num text-[15px] font-semibold text-[#E8821C]">3 PM</span>
                      </button>

                      <button onClick={() => setScheduledSlot(`${opt2Day} ${opt2Date} a las 10:00 AM`)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-glass)] transition-all text-left group">
                        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[14px]">📅</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{opt2Day}</p>
                          <p className="text-[12px] text-[var(--color-text-secondary)]">{opt2Date}</p>
                        </div>
                        <span className="font-num text-[15px] font-semibold text-[#E8821C]">10 AM</span>
                      </button>
                    </div>

                    <div className="h-px bg-[var(--color-border)]" />
                    <button onClick={() => setShowContactModal(false)}
                      className="w-full py-4 text-[15px] font-medium text-[#E8821C] hover:bg-[var(--color-surface-hover)] active:bg-[var(--color-surface-glass)] transition-colors">
                      Cancelar
                    </button>
                  </>
                ) : (
                  <div className="text-center px-6 py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                      <Check size={30} className="text-emerald-400" />
                    </div>
                    <h3 className="text-[17px] font-semibold text-[var(--color-text-primary)]">Llamada agendada</h3>
                    <p className="text-[14px] text-[var(--color-text-secondary)] mt-2">
                      {scheduledSlot}
                    </p>
                    <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Recibirás un recordatorio</p>

                    <div className="h-px bg-[var(--color-border)] mt-6" />
                    <button onClick={() => setShowContactModal(false)}
                      className="w-full pt-4 text-[15px] font-medium text-[#E8821C] hover:opacity-80 transition-opacity">
                      Listo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href={product ? `/productos/${product.slug}` : '/productos'} className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-secondary)] hover:text-[#E8821C] transition-colors mb-6">
        <ArrowLeft size={14} />Volver
      </Link>

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 mb-4">
          <Zap size={12} className="text-[#E8821C]" />
          <span className="text-[11px] font-semibold text-[#E8821C] uppercase tracking-wider">Último paso</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Solicitar Cotización</h1>
        <p className="text-[var(--color-text-secondary)] text-[14px] mt-2">Completa tus datos y recibiras una propuesta formal en tu correo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 glass rounded-2xl p-6">
          <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-5 flex items-center gap-2">
            <User size={14} className="text-[#E8821C]" /> Tus Datos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nombre completo', value: nombre, set: setNombre, icon: User, placeholder: 'Tu nombre', full: false },
              { label: 'Empresa', value: empresa, set: setEmpresa, icon: Building2, placeholder: 'Nombre de tu empresa', full: false },
              { label: 'Email', value: email, set: setEmail, icon: Mail, placeholder: 'tu@empresa.com', full: false },
              { label: 'Teléfono', value: telefono, set: setTelefono, icon: Phone, placeholder: '+507 6000-0000', full: false },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className={f.full ? 'sm:col-span-2' : ''}>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">{f.label}</label>
                  <div className="relative">
                    <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input type="text" value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder}
                      className="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/30 transition-all" />
                  </div>
                </div>
              );
            })}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">Pais</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <select value={pais} onChange={(e) => setPais(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] focus:outline-none focus:border-[#E8821C]/30 appearance-none">
                  <option value="">Seleccionar</option>
                  {['Panama', 'Costa Rica', 'Venezuela', 'Guatemala', 'Honduras', 'Nicaragua', 'Haiti', 'Otro'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">Mensaje (opcional)</label>
              <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3}
                placeholder="Necesidades especiales, preguntas, requerimientos..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/30 resize-none" />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[13px] text-red-400">{error}</div>
          )}
          <button onClick={handleSubmit}
            disabled={!nombre || !email || !telefono || sending}
            className="w-full mt-6 h-12 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white font-semibold rounded-xl hover:shadow-[0_0_30px_#E8821C40] transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={16} />
                Enviar Solicitud de Cotización
                <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-5 sticky top-20">
            <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-4 flex items-center gap-2">
              <Package size={14} className="text-[#E8821C]" /> Tu Configuración
            </h2>

            {product ? (
              <>
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
                  <div className="w-16 h-16 rounded-lg bg-[var(--color-surface-glass)] flex items-center justify-center">
                    <Image src={product.imagen} alt={product.modelo} width={56} height={56} className="object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-[#E8821C] font-bold uppercase tracking-wider">{product.marca}</p>
                    <p className="text-[14px] font-semibold text-[var(--color-text-primary)]">{product.modelo}</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">{product.categoriaLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--color-text-muted)]">x{cantidad}</p>
                    <p className="font-num text-[14px] font-bold text-[var(--color-text-primary)]">{formatCurrency(product.precioDesde * cantidad)}</p>
                  </div>
                </div>

                {selectedAccesorios.length > 0 && (
                  <div className="py-3 border-b border-[var(--color-border)]">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Shield size={10} /> Accesorios ({selectedAccesorios.length})
                    </p>
                    <div className="space-y-1.5">
                      {selectedAccesorios.map(acc => (
                        <div key={acc.id} className="flex items-center justify-between">
                          <span className="text-[12px] text-[var(--color-text-secondary)]">{acc.nombre}</span>
                          <span className="font-num text-[12px] text-[var(--color-text-secondary)]">{formatCurrency(acc.precio)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                    <span className="font-num text-[var(--color-text-secondary)]">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[var(--color-text-secondary)]">Impuesto (7%)</span>
                    <span className="font-num text-[var(--color-text-secondary)]">{formatCurrency(impuesto)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
                    <span className="text-[var(--color-text-primary)] font-semibold">Total Estimado</span>
                    <span className="font-num text-xl font-bold text-[#E8821C] text-glow">{formatCurrency(total)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Package size={32} className="text-[var(--color-text-muted)] mx-auto mb-3" />
                <p className="text-[13px] text-[var(--color-text-secondary)]">Selecciona un equipo del catálogo para comenzar</p>
                <Link href="/productos" className="inline-flex items-center gap-1.5 mt-3 text-[12px] text-[#E8821C] hover:underline">
                  Ver catálogo <ArrowLeft size={12} className="rotate-180" />
                </Link>
              </div>
            )}

            <div className="mt-4 p-3 bg-[var(--color-surface-glass)] rounded-lg border border-[var(--color-border)]">
              <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                * Los precios son referenciales en USD. La cotización formal incluirá condiciones de pago, tiempos de entrega y garantía.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CotizarPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><div className="w-6 h-6 border-2 border-[#E8821C]/30 border-t-[#E8821C] rounded-full animate-spin" /></div>}>
      <CotizarContent />
    </Suspense>
  );
}
