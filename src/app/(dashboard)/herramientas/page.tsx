'use client';

import { useCRM } from '@/context/CRMContext';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import Link from 'next/link';
import {
  FileText, Users, Target, Calendar, MessageSquare,
  TrendingUp, Clock, Sparkles, ArrowUpRight, Phone,
  Mail, CheckCircle2, AlertTriangle,
} from 'lucide-react';

export default function HerramientasPage() {
  const { cotizaciones, clientes, facturas, pipeline } = useCRM();

  const misCotizaciones = cotizaciones.filter(c => c.comercialAsignado === 'Carlos Mendez');
  const misClientes = clientes.filter(c => c.comercialAsignado === 'Carlos Mendez');
  const leadsSinAtender = misClientes.filter(c => c.tipo === 'lead');
  const cotizacionesPendientes = misCotizaciones.filter(c => ['borrador', 'enviada', 'en-estudio'].includes(c.estado));
  const facturasVencidas = facturas.filter(f => f.estado === 'vencida');

  const acciones = [
    { label: 'Nueva Cotizacion', desc: 'Crear propuesta rapida', icon: Sparkles, href: '/cotizaciones/nueva', color: 'from-[#E8821C] to-[#C96A10]' },
    { label: 'Nuevo Cliente', desc: 'Registrar lead o cliente', icon: Users, href: '/clientes', color: 'from-blue-500 to-blue-600' },
    { label: 'Ver Pipeline', desc: 'Estado de oportunidades', icon: TrendingUp, href: '/pipeline', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Catalogo', desc: 'Consultar maquinaria', icon: FileText, href: '/catalogo', color: 'from-violet-500 to-violet-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Herramientas</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Espacio de trabajo del colaborador</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {acciones.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.label} href={a.href}
              className="glass rounded-xl p-4 hover:bg-[var(--color-surface-glass)] transition-all group text-center">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="text-[13px] font-semibold text-[var(--color-text-secondary)]">{a.label}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{a.desc}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* My Pending Work */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Mis Pendientes</h3>
            <span className="text-[10px] font-num font-medium text-[#E8821C] bg-[#E8821C]/10 px-2 py-0.5 rounded border border-[#E8821C]/20">
              {cotizacionesPendientes.length + leadsSinAtender.length + facturasVencidas.length}
            </span>
          </div>
          <div className="space-y-2">
            {cotizacionesPendientes.slice(0, 3).map((cot) => (
              <Link key={cot.id} href={`/cotizaciones/${cot.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-glass)] transition-colors group">
                <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={13} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[var(--color-text-secondary)] truncate">{cot.clienteNombre}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{cot.numero} · <span className="font-num">{formatCurrency(cot.total)}</span></p>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${getStatusColor(cot.estado)}`}>{getStatusLabel(cot.estado)}</span>
              </Link>
            ))}
            {leadsSinAtender.slice(0, 2).map((lead) => (
              <Link key={lead.id} href={`/clientes/${lead.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-glass)] transition-colors">
                <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock size={13} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[var(--color-text-secondary)] truncate">{lead.nombre}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">Lead · {lead.pais}</p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Seguimiento</span>
              </Link>
            ))}
            {facturasVencidas.slice(0, 2).map((fac) => (
              <Link key={fac.id} href={`/facturas/${fac.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-glass)] transition-colors">
                <div className="w-7 h-7 rounded-md bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={13} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[var(--color-text-secondary)] truncate">{fac.clienteNombre}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{fac.numero} · <span className="font-num">{formatCurrency(fac.total)}</span></p>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Vencida</span>
              </Link>
            ))}
          </div>
        </div>

        {/* My Stats */}
        <div className="space-y-3">
          <div className="glass rounded-xl p-4">
            <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-3">Mi Rendimiento</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xl font-num font-bold text-[var(--color-text-primary)]">{misCotizaciones.length}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Cotizaciones</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-num font-bold text-emerald-400">{misCotizaciones.filter(c => c.estado === 'aceptada').length}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Ganadas</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-num font-bold text-[#E8821C]">
                  {formatCurrency(misCotizaciones.filter(c => c.estado === 'aceptada').reduce((a, c) => a + c.total, 0))}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Vendido</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-3">Actividad Reciente</h3>
            <div className="space-y-2.5">
              {[
                { icon: CheckCircle2, text: 'Cotizacion COT-2026-001 aceptada', time: 'Hace 2h', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { icon: Mail, text: 'Email enviado a Logistica del Pacifico', time: 'Hace 4h', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { icon: Phone, text: 'Llamada con Almacenes Unidos', time: 'Ayer', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { icon: FileText, text: 'Cotizacion COT-2026-007 creada', time: 'Hace 2d', color: 'text-[#E8821C]', bg: 'bg-[#E8821C]/10' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-md ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={12} className={item.color} />
                    </div>
                    <p className="text-[12px] text-[var(--color-text-secondary)] flex-1">{item.text}</p>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming calendar / Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-[#E8821C]" />
            <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Agenda de Hoy</h3>
          </div>
          <div className="space-y-2">
            {[
              { hora: '09:00', titulo: 'Seguimiento Almacenes Unidos', tipo: 'Llamada' },
              { hora: '11:30', titulo: 'Demo producto ML-E30', tipo: 'Reunion' },
              { hora: '14:00', titulo: 'Revisar cotizacion Puerto Industrial', tipo: 'Tarea' },
              { hora: '16:00', titulo: 'Cierre mensual pipeline', tipo: 'Reporte' },
            ].map((ev, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-surface-glass)] transition-colors">
                <span className="text-[12px] font-num font-medium text-[#E8821C] w-12">{ev.hora}</span>
                <div className="w-px h-6 bg-[var(--color-surface-hover)]" />
                <div className="flex-1">
                  <p className="text-[12px] text-[var(--color-text-secondary)]">{ev.titulo}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{ev.tipo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} className="text-[#E8821C]" />
            <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Metas del Mes</h3>
          </div>
          <div className="space-y-3">
            {[
              { meta: 'Cotizaciones enviadas', actual: 4, objetivo: 8 },
              { meta: 'Nuevos clientes', actual: 2, objetivo: 5 },
              { meta: 'Ventas cerradas', actual: 1, objetivo: 3 },
            ].map((m) => (
              <div key={m.meta}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-[var(--color-text-secondary)]">{m.meta}</span>
                  <span className="text-[12px] font-num font-medium text-[var(--color-text-secondary)]">{m.actual}/{m.objetivo}</span>
                </div>
                <div className="h-1.5 bg-[var(--color-surface-glass)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#E8821C] to-[#FF9F43] transition-all"
                    style={{ width: `${Math.min((m.actual / m.objetivo) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
