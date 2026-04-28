'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Users, Receipt, TrendingUp, AlertTriangle, CheckCircle2, ArrowUpRight, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useCRM } from '@/context/CRMContext';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/lib/supabase/use-profile';
import { isAdmin } from '@/lib/supabase/roles';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

type RankingRow = { id: string; nombre: string | null; email: string; monto_cerrado_mes: number | string; ganadas_mes: number; pipeline_abiertas: number; };

type CotChartRow = { total: number | string; estado: string; created_at: string; cerrado_at: string | null };

const MES_CORTO: Record<number, string> = {
  0: 'Ene', 1: 'Feb', 2: 'Mar', 3: 'Abr', 4: 'May', 5: 'Jun',
  6: 'Jul', 7: 'Ago', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dic',
};

/**
 * Construye los buckets de los últimos 6 meses (incluyendo el actual)
 * con conteos de cotizaciones creadas, ganadas y monto cerrado.
 */
function buildChartData(rows: CotChartRow[]) {
  const buckets: Array<{ mes: string; ts: number; creadas: number; ganadas: number; monto: number }> = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      mes: MES_CORTO[d.getMonth()],
      ts: d.getTime(),
      creadas: 0, ganadas: 0, monto: 0,
    });
  }
  for (const r of rows) {
    const created = new Date(r.created_at);
    const idxCreated = buckets.findIndex((b, i) => {
      const next = buckets[i + 1]?.ts ?? Number.POSITIVE_INFINITY;
      return created.getTime() >= b.ts && created.getTime() < next;
    });
    if (idxCreated >= 0) buckets[idxCreated].creadas += 1;

    if (r.estado === 'ganada' && r.cerrado_at) {
      const closed = new Date(r.cerrado_at);
      const idxClosed = buckets.findIndex((b, i) => {
        const next = buckets[i + 1]?.ts ?? Number.POSITIVE_INFINITY;
        return closed.getTime() >= b.ts && closed.getTime() < next;
      });
      if (idxClosed >= 0) {
        buckets[idxClosed].ganadas += 1;
        buckets[idxClosed].monto += Number(r.total) || 0;
      }
    }
  }
  return buckets.map(b => ({
    mes: b.mes,
    monto: b.monto,
    tasa: b.creadas > 0 ? Math.round((b.ganadas / b.creadas) * 100) : 0,
  }));
}

export default function DashboardPage() {
  const { facturas } = useCRM(); // facturas still demo — shown only to admin for now
  const supabase = useMemo(() => createClient(), []);
  const { profile } = useProfile();
  const userIsAdmin = isAdmin(profile?.rol);

  const [stats, setStats] = useState({
    totalCotizaciones: 0,
    ganadas: 0,
    montoEnPipeline: 0,
    totalClientes: 0,
    leads: 0,
  });
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [chartData, setChartData] = useState<{ mes: string; monto: number; tasa: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: cots }, { data: cls }] = await Promise.all([
        supabase.from('parmonca_cotizaciones').select('total, estado, etapa_pipeline, asignado_a, created_at, cerrado_at'),
        supabase.from('parmonca_clientes').select('tipo'),
      ]);

      const totalCotizaciones = cots?.length || 0;
      const ganadas = cots?.filter(c => c.estado === 'ganada').length || 0;
      const montoEnPipeline = (cots || [])
        .filter(c => !['ganada', 'perdida'].includes(c.etapa_pipeline))
        .reduce((a, c) => a + Number(c.total || 0), 0);
      const totalClientes = cls?.length || 0;
      const leads = cls?.filter(c => c.tipo === 'lead').length || 0;

      setStats({ totalCotizaciones, ganadas, montoEnPipeline, totalClientes, leads });
      setChartData(buildChartData((cots || []) as CotChartRow[]));

      if (userIsAdmin) {
        const { data: rk } = await supabase
          .from('parmonca_v_ranking_vendedores')
          .select('id, nombre, email, monto_cerrado_mes, ganadas_mes, pipeline_abiertas')
          .order('monto_cerrado_mes', { ascending: false })
          .limit(5);
        if (rk) setRanking(rk as RankingRow[]);
      }
    };
    load();

    const channel = supabase
      .channel('parmonca_dashboard_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_cotizaciones' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_clientes' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, userIsAdmin]);

  const { totalCotizaciones, ganadas, montoEnPipeline, totalClientes, leads } = stats;
  const tasaConversion = totalCotizaciones > 0 ? ((ganadas / totalCotizaciones) * 100).toFixed(0) : '0';
  const totalFacturado = facturas.reduce((acc, f) => acc + f.total, 0);
  const facturasVencidas = facturas.filter(f => f.estado === 'vencida').length;

  const maxMonto = Math.max(1, ...ranking.map(r => Number(r.monto_cerrado_mes) || 0));

  // KPIs — los admin ven la vista global; el asesor ve sólo lo que le corresponde
  // por RLS, y reemplazamos "Facturado" (aún demo) por "Ganadas" real.
  const kpis = userIsAdmin
    ? [
        { label: 'Pipeline Activo', value: formatCurrency(montoEnPipeline), change: `${ganadas} ganadas`, up: true, icon: TrendingUp, gradient: 'from-[#E8821C]/20 to-[#E8821C]/5', iconColor: 'text-[#E8821C]', glowColor: '#E8821C' },
        { label: 'Cotizaciones', value: totalCotizaciones.toString(), change: `${tasaConversion}% conv.`, up: true, icon: FileText, gradient: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400', glowColor: '#3B82F6' },
        { label: 'Facturado', value: formatCurrency(totalFacturado), change: `${facturasVencidas} vencidas`, up: false, icon: Receipt, gradient: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400', glowColor: '#22C55E' },
        { label: 'Clientes', value: totalClientes.toString(), change: `${leads} leads`, up: true, icon: Users, gradient: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-400', glowColor: '#8B5CF6' },
      ]
    : [
        { label: 'Mi Pipeline', value: formatCurrency(montoEnPipeline), change: `${ganadas} ganadas`, up: true, icon: TrendingUp, gradient: 'from-[#E8821C]/20 to-[#E8821C]/5', iconColor: 'text-[#E8821C]', glowColor: '#E8821C' },
        { label: 'Mis Cotizaciones', value: totalCotizaciones.toString(), change: `${tasaConversion}% conv.`, up: true, icon: FileText, gradient: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400', glowColor: '#3B82F6' },
        { label: 'Ganadas', value: ganadas.toString(), change: `de ${totalCotizaciones} totales`, up: true, icon: Trophy, gradient: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400', glowColor: '#22C55E' },
        { label: 'Mis Clientes', value: totalClientes.toString(), change: `${leads} leads`, up: true, icon: Users, gradient: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-400', glowColor: '#8B5CF6' },
      ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {userIsAdmin
              ? 'Command Center'
              : `Hola, ${profile?.nombre?.split(' ')[0] || profile?.email?.split('@')[0] || 'vendedor'}`}
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-0.5">
            {userIsAdmin ? 'Resumen de operaciones en tiempo real' : 'Tu panel personal de trabajo'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            En vivo
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="glass rounded-xl p-4 hover:bg-[var(--color-surface-glass)] transition-all">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{kpi.label}</p>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.gradient} flex items-center justify-center`}>
                  <Icon size={15} className={kpi.iconColor} style={{ filter: `drop-shadow(0 0 4px ${kpi.glowColor}40)` }} />
                </div>
              </div>
              <p className="text-xl font-num font-semibold text-[var(--color-text-primary)] tracking-tight leading-none">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-2">
                {kpi.up ? <ArrowUpRight size={11} className="text-emerald-400" /> : <AlertTriangle size={10} className="text-amber-400" />}
                <span className={`text-[10px] font-medium ${kpi.up ? 'text-emerald-400' : 'text-amber-400'}`}>{kpi.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts — sólo admin. Datos calculados en vivo desde parmonca_cotizaciones
          (últimos 6 meses, agrupados por created_at e cerrado_at). */}
      {userIsAdmin && (() => {
        const totalIngresos6m = chartData.reduce((a, m) => a + m.monto, 0);
        const tieneIngresos = totalIngresos6m > 0;
        return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-3 glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Ingresos Mensuales</h3>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Últimos 6 meses · cotizaciones ganadas</p>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-surface-glass)] px-2 py-0.5 rounded">USD</span>
            </div>
            {tieneIngresos ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Monto']} contentStyle={{ background: '#16161A', border: '1px solid #ffffff10', borderRadius: 10, fontSize: 12, color: '#e4e4e7' }} cursor={{ fill: '#ffffff06' }} />
                  <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E8821C" /><stop offset="100%" stopColor="#C96A10" /></linearGradient></defs>
                  <Bar dataKey="monto" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-[#E8821C]/10 border border-[#E8821C]/20 flex items-center justify-center">
                  <TrendingUp size={20} className="text-[#E8821C]/70" />
                </div>
                <p className="text-[12px] text-[var(--color-text-secondary)]">Aún no hay ventas cerradas</p>
                <p className="text-[10px] text-[var(--color-text-muted)] text-center max-w-[260px]">
                  El gráfico se llena automáticamente con cada cotización marcada como <span className="text-emerald-400 font-medium">ganada</span>.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Tasa de Conversión</h3>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Histórica acumulada</p>
              </div>
              <span className="text-lg font-num font-bold text-[#E8821C]">{tasaConversion}%</span>
            </div>
            {totalCotizaciones > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Conversión']} contentStyle={{ background: '#16161A', border: '1px solid #ffffff10', borderRadius: 10, fontSize: 12, color: '#e4e4e7' }} />
                  <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E8821C" stopOpacity={0.3} /><stop offset="100%" stopColor="#E8821C" stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="tasa" stroke="#E8821C" strokeWidth={2} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <FileText size={20} className="text-blue-400/70" />
                </div>
                <p className="text-[12px] text-[var(--color-text-secondary)]">Sin cotizaciones</p>
                <p className="text-[10px] text-[var(--color-text-muted)] text-center max-w-[220px]">
                  Cuando entren cotizaciones la tasa se calcula como ganadas / total.
                </p>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* Bottom */}
      <div className={userIsAdmin ? 'grid grid-cols-1 lg:grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'}>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">
              {userIsAdmin ? 'Ranking Vendedores (mes)' : 'Mi Desempeño'}
            </h3>
            {userIsAdmin && (
              <Link href="/equipo" className="text-[11px] text-[#E8821C] hover:underline font-medium">Ver equipo completo →</Link>
            )}
          </div>
          {userIsAdmin && ranking.length === 0 ? (
            <div className="text-[12px] text-[var(--color-text-muted)] py-6 text-center">
              Aún no hay vendedores. <Link href="/equipo" className="text-[#E8821C] hover:underline">Agregar el primero</Link>
            </div>
          ) : (
          <div className="space-y-3">
            {userIsAdmin && ranking.map((a, i) => (
              <Link key={a.id} href={`/cotizaciones?asignado=${a.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' :
                  i === 1 ? 'bg-gradient-to-br from-[#E8821C] to-[#C96A10] text-white' :
                  'bg-[var(--color-surface-glass)] text-[var(--color-text-secondary)]'
                }`}>{i === 0 ? <Trophy size={12} /> : `#${i + 1}`}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-[var(--color-text-secondary)] truncate">{a.nombre || a.email.split('@')[0]}</span>
                    <span className="text-[13px] font-num font-semibold text-[var(--color-text-primary)]">{formatCurrency(Number(a.monto_cerrado_mes))}</span>
                  </div>
                  <div className="h-1 bg-[var(--color-surface-glass)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#E8821C] to-[#FF9F43]" style={{ width: `${(Number(a.monto_cerrado_mes) / maxMonto) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{a.ganadas_mes} ganadas · {a.pipeline_abiertas} en pipeline</p>
                </div>
              </Link>
            ))}
            {!userIsAdmin && ([
              { label: 'Mis cotizaciones totales', value: totalCotizaciones },
              { label: 'Ganadas (histórico)', value: ganadas },
              { label: 'En pipeline', value: formatCurrency(montoEnPipeline) },
              { label: 'Tasa de conversión', value: `${tasaConversion}%` },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] last:border-0">
                <span className="text-[12px] text-[var(--color-text-muted)]">{m.label}</span>
                <span className="text-[14px] font-num font-bold text-[var(--color-text-primary)]">{m.value}</span>
              </div>
            )))}
          </div>
          )}
        </div>

        {userIsAdmin && (
        <div className="glass rounded-xl p-4">
          <h3 className="text-[13px] font-semibold text-[var(--color-text-secondary)] mb-4">Alertas activas</h3>
          {totalCotizaciones === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={28} className="text-emerald-400/60 mx-auto mb-2" />
              <p className="text-[13px] text-[var(--color-text-secondary)]">Sin alertas pendientes</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                Aquí aparecerán cotizaciones sin atender, leads inactivos y cobros vencidos cuando los haya.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[12px] text-[var(--color-text-muted)] text-center py-4">
                Las alertas en tiempo real se generarán automáticamente conforme entren cotizaciones, se asignen leads y se emitan facturas.
              </p>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
