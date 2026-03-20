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

  if (sent) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-4">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <Check size={40} className="text-emerald-400" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white">Cotizacion Enviada</h1>
        <p className="text-zinc-500 mt-3 leading-relaxed">
          Hemos recibido tu solicitud. Un asesor especializado te contactara en las proximas 2 horas habiles para darte seguimiento.
        </p>
        <div className="glass rounded-xl p-5 mt-8 text-left">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-3">Resumen</p>
          {product && (
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.04]">
              <Image src={product.imagen} alt={product.modelo} width={60} height={60} className="object-contain" />
              <div>
                <p className="text-[13px] font-semibold text-white">{product.marca} {product.modelo}</p>
                <p className="text-[11px] text-zinc-500">Cant: {cantidad} · {selectedAccesorios.length} accesorios</p>
              </div>
              <p className="ml-auto font-num text-lg font-bold text-[#E8821C]">{formatCurrency(total)}</p>
            </div>
          )}
          <div className="mt-3 space-y-1">
            <p className="text-[12px] text-zinc-400"><span className="text-zinc-600">Contacto:</span> {nombre}</p>
            <p className="text-[12px] text-zinc-400"><span className="text-zinc-600">Email:</span> {email}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-center mt-8">
          <Link href="/productos" className="px-6 py-2.5 rounded-full border border-white/[0.06] text-[13px] font-medium text-zinc-400 hover:bg-white/[0.03]">
            Ver mas equipos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href={product ? `/productos/${product.slug}` : '/productos'} className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-[#E8821C] transition-colors mb-6">
        <ArrowLeft size={14} />Volver
      </Link>

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8821C]/10 border border-[#E8821C]/20 mb-4">
          <Zap size={12} className="text-[#E8821C]" />
          <span className="text-[11px] font-semibold text-[#E8821C] uppercase tracking-wider">Ultimo paso</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-white tracking-tight">Solicitar Cotizacion</h1>
        <p className="text-zinc-500 text-[14px] mt-2">Completa tus datos y recibiras una propuesta formal en tu correo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 glass rounded-2xl p-6">
          <h2 className="text-[13px] font-semibold text-zinc-300 mb-5 flex items-center gap-2">
            <User size={14} className="text-[#E8821C]" /> Tus Datos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nombre completo', value: nombre, set: setNombre, icon: User, placeholder: 'Tu nombre', full: false },
              { label: 'Empresa', value: empresa, set: setEmpresa, icon: Building2, placeholder: 'Nombre de tu empresa', full: false },
              { label: 'Email', value: email, set: setEmail, icon: Mail, placeholder: 'tu@empresa.com', full: false },
              { label: 'Telefono', value: telefono, set: setTelefono, icon: Phone, placeholder: '+507 6000-0000', full: false },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className={f.full ? 'sm:col-span-2' : ''}>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 mb-1.5">{f.label}</label>
                  <div className="relative">
                    <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input type="text" value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder}
                      className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-[#E8821C]/30 transition-all" />
                  </div>
                </div>
              );
            })}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 mb-1.5">Pais</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <select value={pais} onChange={(e) => setPais(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-300 focus:outline-none focus:border-[#E8821C]/30 appearance-none">
                  <option value="">Seleccionar</option>
                  {['Panama', 'Costa Rica', 'Venezuela', 'Guatemala', 'Honduras', 'Nicaragua', 'Haiti', 'Otro'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 mb-1.5">Mensaje (opcional)</label>
              <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3}
                placeholder="Necesidades especiales, preguntas, requerimientos..."
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-[#E8821C]/30 resize-none" />
            </div>
          </div>

          <button onClick={() => setSent(true)}
            disabled={!nombre || !email || !telefono}
            className="w-full mt-6 h-12 bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white font-semibold rounded-xl hover:shadow-[0_0_30px_#E8821C40] transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
            <Send size={16} />
            Enviar Solicitud de Cotizacion
            <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl p-5 sticky top-20">
            <h2 className="text-[13px] font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Package size={14} className="text-[#E8821C]" /> Tu Configuracion
            </h2>

            {product ? (
              <>
                <div className="flex items-center gap-3 pb-4 border-b border-white/[0.04]">
                  <div className="w-16 h-16 rounded-lg bg-white/[0.03] flex items-center justify-center">
                    <Image src={product.imagen} alt={product.modelo} width={56} height={56} className="object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-[#E8821C] font-bold uppercase tracking-wider">{product.marca}</p>
                    <p className="text-[14px] font-semibold text-white">{product.modelo}</p>
                    <p className="text-[11px] text-zinc-500">{product.categoriaLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-600">x{cantidad}</p>
                    <p className="font-num text-[14px] font-bold text-white">{formatCurrency(product.precioDesde * cantidad)}</p>
                  </div>
                </div>

                {selectedAccesorios.length > 0 && (
                  <div className="py-3 border-b border-white/[0.04]">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Shield size={10} /> Accesorios ({selectedAccesorios.length})
                    </p>
                    <div className="space-y-1.5">
                      {selectedAccesorios.map(acc => (
                        <div key={acc.id} className="flex items-center justify-between">
                          <span className="text-[12px] text-zinc-400">{acc.nombre}</span>
                          <span className="font-num text-[12px] text-zinc-300">{formatCurrency(acc.precio)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="font-num text-zinc-300">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-zinc-500">Impuesto (7%)</span>
                    <span className="font-num text-zinc-300">{formatCurrency(impuesto)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/[0.06]">
                    <span className="text-white font-semibold">Total Estimado</span>
                    <span className="font-num text-xl font-bold text-[#E8821C] text-glow">{formatCurrency(total)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Package size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-[13px] text-zinc-500">Selecciona un equipo del catalogo para comenzar</p>
                <Link href="/productos" className="inline-flex items-center gap-1.5 mt-3 text-[12px] text-[#E8821C] hover:underline">
                  Ver catalogo <ArrowLeft size={12} className="rotate-180" />
                </Link>
              </div>
            )}

            <div className="mt-4 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
              <p className="text-[10px] text-zinc-600 leading-relaxed">
                * Los precios son referenciales en USD. La cotizacion formal incluira condiciones de pago, tiempos de entrega y garantia.
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
