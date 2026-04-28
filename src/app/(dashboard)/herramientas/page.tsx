'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Users, Target, Calendar, Sparkles, Package,
  TrendingUp, Clock, AlertTriangle, FileClock, Database, Activity, ArrowUpRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/lib/supabase/use-profile';
import { isAdmin } from '@/lib/supabase/roles';
import { formatCurrency } from '@/lib/utils';

type CotizacionRow = {
  id: string;
  numero: string;
  nombre: string;
  empresa: string | null;
  estado: 'nueva' | 'contactado' | 'cotizado' | 'negociacion' | 'ganada' | 'perdida';
  total: number | string;
  asignado_a: string | null;
  created_at: string;
};

type ClienteRow = {
  id: string;
  nombre: string;
  empresa: string | null;
  pais: string | null;
  tipo: 'lead' | 'customer';
  comercial_asignado: string | null;
};

type AuditRow = {
  id: number;
  tabla: string;
  accion: string;
  fila_id: string | null;
  cambiado_por: string | null;
  cambiado_at: string;
};

const ESTADO_COLORS: Record<string, string> = {
  nueva: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contactado: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  cotizado: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  negociacion: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ganada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  perdida: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function HerramientasPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile } = useProfile();
  const userIsAdmin = isAdmin(profile?.rol);

  const [cotizaciones, setCotizaciones] = useState<CotizacionRow[]>([]);
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [eventos, setEventos] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const reload = async () => {
        // RLS escogerá lo que el rol puede ver (admin: todo, asesor: lo suyo)
        const [{ data: cots }, { data: cls }, { data: aud }] = await Promise.all([
          supabase.from('parmonca_cotizaciones')
            .select('id, numero, nombre, empresa, estado, total, asignado_a, created_at')
            .order('created_at', { ascending: false })
            .limit(100),
          supabase.from('parmonca_clientes')
            .select('id, nombre, empresa, pais, tipo, comercial_asignado')
            .order('created_at', { ascending: false }),
          userIsAdmin
            ? supabase.from('parmonca_audit_log')
                .select('id, tabla, accion, fila_id, cambiado_por, cambiado_at')
                .order('cambiado_at', { ascending: false })
                .limit(8)
            : Promise.resolve({ data: [] as AuditRow[] }),
        ]);
        setCotizaciones((cots || []) as CotizacionRow[]);
        setClientes((cls || []) as ClienteRow[]);
        setEventos((aud || []) as AuditRow[]);
        setLoading(false);
      };
      reload();

      // Realtime: cualquier cambio refresca los pendientes
      const channel = supabase
        .channel('herramientas_feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_cotizaciones' }, reload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_clientes' }, reload)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    })();
  }, [supabase, profile?.id, userIsAdmin]);

  // Mis pendientes — cotizaciones en proceso, leads sin contactar
  const cotizacionesPendientes = cotizaciones.filter(c =>
    ['nueva', 'contactado', 'cotizado', 'negociacion'].includes(c.estado)
  );
  const leadsSinAtender = clientes.filter(c => c.tipo === 'lead');
  const ganadas = cotizaciones.filter(c => c.estado === 'ganada');
  const totalVendido = ganadas.reduce((a, c) => a + Number(c.total || 0), 0);

  // Inicio del mes para métricas mensuales
  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const cotsMes = cotizaciones.filter(c => new Date(c.created_at) >= inicioMes);
  const ganadasMes = cotsMes.filter(c => c.estado === 'ganada');
  const metaMensualUSD = Number(profile?.meta_mensual_usd || 0);
  const ventasMes = ganadasMes.reduce((a, c) => a + Number(c.total || 0), 0);
  const cotsMesObjetivo = Math.max(8, Math.ceil(metaMensualUSD / 5000));
  const ganadasMesObjetivo = Math.max(3, Math.ceil(metaMensualUSD / 15000));

  const acciones = [
    { label: 'Nueva cotización', desc: 'Crear propuesta',  icon: Sparkles,  href: '/cotizaciones/nueva',  color: 'from-[#E8821C] to-[#C96A10]' },
    { label: 'Nuevo cliente',    desc: 'Registrar lead',   icon: Users,     href: '/clientes/nuevo',      color: 'from-blue-500 to-blue-600' },
    { label: 'Pipeline',         desc: 'Oportunidades',    icon: TrendingUp,href: '/pipeline',            color: 'from-emerald-500 to-emerald-600' },
    { label: 'Catálogo',         desc: 'Maquinaria',       icon: Package,   href: '/catalogo',            color: 'from-violet-500 to-violet-600' },
  ];

  // Acciones extra para admin
  const accionesAdmin = userIsAdmin
    ? [
        { label: 'Auditoría',     desc: 'Bitácora de cambios',  icon: FileClock, href: '/herramientas/auditoria', color: 'from-cyan-500 to-cyan-600' },
        { label: 'Integración Odoo', desc: 'Sync de inventario', icon: Database, href: '/configuracion/odoo',     color: 'from-amber-500 to-amber-600' },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Herramientas</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          {loading ? 'Cargando…' : `Espacio de trabajo de ${profile?.nombre || profile?.email?.split('@')[0] || 'usuario'}`}
        </p>
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

      {accionesAdmin.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {accionesAdmin.map((a) => {
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Mis Pendientes — datos reales */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Mis pendientes</h3>
            <span className="text-[10px] font-num font-medium text-[#E8821C] bg-[#E8821C]/10 px-2 py-0.5 rounded border border-[#E8821C]/20">
              {cotizacionesPendientes.length + leadsSinAtender.length}
            </span>
          </div>
          {loading ? (
            <p className="text-[12px] text-[var(--color-text-muted)] text-center py-6">Cargando…</p>
          ) : cotizacionesPendientes.length === 0 && leadsSinAtender.length === 0 ? (
            <div className="text-center py-8">
              <Activity size={26} className="text-[var(--color-text-muted)]/40 mx-auto mb-2" />
              <p className="text-[13px] text-[var(--color-text-secondary)]">Todo al día</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Cuando entren cotizaciones o leads, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {cotizacionesPendientes.slice(0, 4).map(cot => (
                <Link key={cot.id} href={`/cotizaciones/${cot.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-glass)] transition-colors group">
                  <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={13} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[var(--color-text-secondary)] truncate">
                      {cot.empresa || cot.nombre}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {cot.numero} · <span className="font-num">{formatCurrency(Number(cot.total))}</span>
                    </p>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase border ${ESTADO_COLORS[cot.estado]}`}>
                    {cot.estado}
                  </span>
                </Link>
              ))}
              {leadsSinAtender.slice(0, 3).map(lead => (
                <Link key={lead.id} href={`/clientes/${lead.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--color-surface-glass)] transition-colors">
                  <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock size={13} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[var(--color-text-secondary)] truncate">
                      {lead.empresa || lead.nombre}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">Lead{lead.pais ? ` · ${lead.pais}` : ''}</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Seguir
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Mi Rendimiento — datos reales */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-3">Mi rendimiento</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xl font-num font-bold text-[var(--color-text-primary)]">{cotizaciones.length}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Cotizaciones</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-num font-bold text-emerald-400">{ganadas.length}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Ganadas</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-num font-bold text-[#E8821C]">
                  {formatCurrency(totalVendido)}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Vendido</p>
              </div>
            </div>
          </div>

          {/* Actividad reciente — del audit_log si admin, sino de cotizaciones recientes */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-3">Actividad reciente</h3>
            {loading ? (
              <p className="text-[12px] text-[var(--color-text-muted)] py-2">Cargando…</p>
            ) : userIsAdmin && eventos.length > 0 ? (
              <div className="space-y-2.5">
                {eventos.slice(0, 5).map(ev => (
                  <Link key={ev.id} href="/herramientas/auditoria"
                    className="flex items-center gap-2.5 hover:bg-[var(--color-surface-glass)] -mx-2 px-2 py-1 rounded-md transition-colors">
                    <div className="w-6 h-6 rounded-md bg-[var(--color-surface-glass)] flex items-center justify-center flex-shrink-0">
                      <Activity size={11} className="text-[var(--color-text-muted)]" />
                    </div>
                    <p className="text-[12px] text-[var(--color-text-secondary)] flex-1 truncate">
                      <span className="font-medium capitalize">{ev.accion.toLowerCase()}</span>
                      {' en '}
                      <span className="font-mono text-[10px]">{ev.tabla.replace('parmonca_', '')}</span>
                    </p>
                    <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">
                      {new Date(ev.cambiado_at).toLocaleString('es-PA', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </Link>
                ))}
                <Link href="/herramientas/auditoria" className="text-[11px] text-[#E8821C] hover:underline mt-2 inline-block">
                  Ver bitácora completa →
                </Link>
              </div>
            ) : cotizaciones.length > 0 ? (
              <div className="space-y-2.5">
                {cotizaciones.slice(0, 4).map(cot => (
                  <Link key={cot.id} href={`/cotizaciones/${cot.id}`}
                    className="flex items-center gap-2.5 hover:bg-[var(--color-surface-glass)] -mx-2 px-2 py-1 rounded-md transition-colors">
                    <div className="w-6 h-6 rounded-md bg-[#E8821C]/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={11} className="text-[#E8821C]" />
                    </div>
                    <p className="text-[12px] text-[var(--color-text-secondary)] flex-1 truncate">
                      {cot.numero} · {cot.empresa || cot.nombre}
                    </p>
                    <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">
                      {new Date(cot.created_at).toLocaleDateString('es-PA', { day: '2-digit', month: 'short' })}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Activity size={22} className="text-[var(--color-text-muted)]/40 mx-auto mb-1.5" />
                <p className="text-[12px] text-[var(--color-text-muted)]">Sin actividad aún</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agenda + Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-[#E8821C]" />
            <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Agenda</h3>
          </div>
          <div className="text-center py-8">
            <Calendar size={26} className="text-[var(--color-text-muted)]/40 mx-auto mb-2" />
            <p className="text-[13px] text-[var(--color-text-secondary)]">Agenda en construcción</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Próximamente podrás programar llamadas, reuniones y seguimientos por cliente.
            </p>
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} className="text-[#E8821C]" />
            <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Metas del mes</h3>
          </div>
          {loading ? (
            <p className="text-[12px] text-[var(--color-text-muted)] py-4">Cargando…</p>
          ) : (
            <div className="space-y-3">
              {[
                { meta: 'Cotizaciones del mes',  actual: cotsMes.length,        objetivo: cotsMesObjetivo },
                { meta: 'Cerradas (ganadas)',     actual: ganadasMes.length,     objetivo: ganadasMesObjetivo },
                metaMensualUSD > 0
                  ? { meta: 'Ventas del mes (USD)', actual: ventasMes, objetivo: metaMensualUSD, currency: true }
                  : null,
              ].filter(Boolean).map((m, i) => {
                const item = m!;
                const pct = item.objetivo > 0 ? Math.min((item.actual / item.objetivo) * 100, 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-[var(--color-text-secondary)]">{item.meta}</span>
                      <span className="text-[12px] font-num font-medium text-[var(--color-text-secondary)]">
                        {item.currency ? `${formatCurrency(item.actual)} / ${formatCurrency(item.objetivo)}` : `${item.actual}/${item.objetivo}`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-surface-glass)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#E8821C] to-[#FF9F43] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {metaMensualUSD === 0 && (
                <p className="text-[10px] text-[var(--color-text-muted)] mt-2 italic">
                  {userIsAdmin
                    ? 'Las metas en USD se generan cuando se asigna meta_mensual_usd al perfil del asesor.'
                    : 'Tu meta en USD aún no está configurada por el administrador.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sin alertas vencidas todavía — placeholder limpio */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-[#E8821C]" />
          <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Avisos</h3>
        </div>
        <div className="text-center py-6">
          <ArrowUpRight size={20} className="text-[var(--color-text-muted)]/40 mx-auto mb-1.5" />
          <p className="text-[12px] text-[var(--color-text-muted)]">
            Los avisos automáticos aparecerán aquí cuando haya facturas vencidas, cotizaciones a punto de expirar o leads inactivos.
          </p>
        </div>
      </div>
    </div>
  );
}
