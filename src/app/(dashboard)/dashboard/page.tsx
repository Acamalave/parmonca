'use client';

import { FileText, Users, Receipt, TrendingUp, AlertTriangle, Clock, CheckCircle2, ArrowUpRight, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useCRM } from '@/context/CRMContext';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const ventasMensuales = [
  { mes: 'Oct', monto: 35000 },
  { mes: 'Nov', monto: 42000 },
  { mes: 'Dic', monto: 28000 },
  { mes: 'Ene', monto: 49487 },
  { mes: 'Feb', monto: 81970 },
  { mes: 'Mar', monto: 130000 },
];

const conversionData = [
  { mes: 'Oct', tasa: 18 },
  { mes: 'Nov', tasa: 22 },
  { mes: 'Dic', tasa: 15 },
  { mes: 'Ene', tasa: 25 },
  { mes: 'Feb', tasa: 28 },
  { mes: 'Mar', tasa: 32 },
];

export default function DashboardPage() {
  const { cotizaciones, facturas, clientes, pipeline } = useCRM();

  const totalCotizaciones = cotizaciones.length;
  const cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'aceptada').length;
  const tasaConversion = totalCotizaciones > 0 ? ((cotizacionesAceptadas / totalCotizaciones) * 100).toFixed(0) : '0';
  const totalFacturado = facturas.reduce((acc, f) => acc + f.total, 0);
  const facturasVencidas = facturas.filter(f => f.estado === 'vencida').length;
  const totalClientes = clientes.length;
  const leads = clientes.filter(c => c.tipo === 'lead').length;
  const montoEnPipeline = pipeline.filter(p => !['ganada', 'perdida'].includes(p.etapa)).reduce((acc, p) => acc + p.monto, 0);

  const asesores = [
    { nombre: 'Carlos Mendez', monto: 175444 },
    { nombre: 'Maria Rodriguez', monto: 132463 },
    { nombre: 'Jose Herrera', monto: 83850 },
  ];

  const kpis = [
    { label: 'Pipeline Activo', value: formatCurrency(montoEnPipeline), change: '+$50K', up: true, icon: TrendingUp, gradient: 'from-[#E8821C]/20 to-[#E8821C]/5', iconColor: 'text-[#E8821C]', glowColor: '#E8821C' },
    { label: 'Cotizaciones', value: totalCotizaciones.toString(), change: `${tasaConversion}% conv.`, up: true, icon: FileText, gradient: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400', glowColor: '#3B82F6' },
    { label: 'Facturado', value: formatCurrency(totalFacturado), change: `${facturasVencidas} vencidas`, up: false, icon: Receipt, gradient: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400', glowColor: '#22C55E' },
    { label: 'Clientes', value: totalClientes.toString(), change: `${leads} leads`, up: true, icon: Users, gradient: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-400', glowColor: '#8B5CF6' },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Command Center</h1>
          <p className="text-zinc-600 text-sm mt-0.5">Resumen de operaciones en tiempo real</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-600">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          En vivo
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="glass rounded-xl p-4 hover:bg-white/[0.04] transition-all">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">{kpi.label}</p>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.gradient} flex items-center justify-center`}>
                  <Icon size={15} className={kpi.iconColor} style={{ filter: `drop-shadow(0 0 4px ${kpi.glowColor}40)` }} />
                </div>
              </div>
              <p className="text-xl font-num font-semibold text-white tracking-tight leading-none">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-2">
                {kpi.up ? <ArrowUpRight size={11} className="text-emerald-400" /> : <AlertTriangle size={10} className="text-amber-400" />}
                <span className={`text-[10px] font-medium ${kpi.up ? 'text-emerald-400' : 'text-amber-400'}`}>{kpi.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3 glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-zinc-300">Ingresos Mensuales</h3>
            <span className="text-[10px] text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded">USD</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ventasMensuales} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Monto']} contentStyle={{ background: '#16161A', border: '1px solid #ffffff10', borderRadius: 10, fontSize: 12, color: '#e4e4e7' }} cursor={{ fill: '#ffffff06' }} />
              <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E8821C" /><stop offset="100%" stopColor="#C96A10" /></linearGradient></defs>
              <Bar dataKey="monto" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-zinc-300">Tasa de Conversion</h3>
            <span className="text-lg font-num font-bold text-[#E8821C]">{tasaConversion}%</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#52525b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: '#16161A', border: '1px solid #ffffff10', borderRadius: 10, fontSize: 12, color: '#e4e4e7' }} />
              <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E8821C" stopOpacity={0.3} /><stop offset="100%" stopColor="#E8821C" stopOpacity={0} /></linearGradient></defs>
              <Area type="monotone" dataKey="tasa" stroke="#E8821C" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="glass rounded-xl p-4">
          <h3 className="text-[13px] font-semibold text-zinc-300 mb-4">Ranking Asesores</h3>
          <div className="space-y-3">
            {asesores.map((a, i) => (
              <div key={a.nombre} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  i === 0 ? 'bg-gradient-to-br from-[#E8821C] to-[#C96A10] text-white' :
                  i === 1 ? 'bg-white/[0.06] text-zinc-400' : 'bg-white/[0.03] text-zinc-500'
                }`}>{i === 0 ? <Zap size={13} /> : `#${i + 1}`}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-zinc-300">{a.nombre}</span>
                    <span className="text-[13px] font-num font-semibold text-white">{formatCurrency(a.monto)}</span>
                  </div>
                  <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#E8821C] to-[#FF9F43]" style={{ width: `${(a.monto / 200000) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="text-[13px] font-semibold text-zinc-300 mb-4">Alertas Activas</h3>
          <div className="space-y-2">
            <Link href="/facturas" className="flex items-center gap-3 p-3 rounded-lg bg-red-500/[0.06] border border-red-500/10 hover:bg-red-500/[0.1] transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"><AlertTriangle size={15} className="text-red-400" /></div>
              <div className="flex-1"><p className="text-[13px] font-medium text-red-300">2 facturas vencidas</p><p className="text-[11px] text-red-400/60">TransCarga Guatemala — <span className="font-num">$7,200</span></p></div>
              <ArrowUpRight size={14} className="text-red-400/40 group-hover:text-red-400 transition-colors" />
            </Link>
            <Link href="/clientes/8" className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/10 hover:bg-amber-500/[0.1] transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock size={15} className="text-amber-400" /></div>
              <div className="flex-1"><p className="text-[13px] font-medium text-amber-300">Lead sin atender</p><p className="text-[11px] text-amber-400/60">AgroExport Haiti — 9 dias</p></div>
              <ArrowUpRight size={14} className="text-amber-400/40 group-hover:text-amber-400 transition-colors" />
            </Link>
            <Link href="/cotizaciones/5" className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/[0.06] border border-blue-500/10 hover:bg-blue-500/[0.1] transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><FileText size={15} className="text-blue-400" /></div>
              <div className="flex-1"><p className="text-[13px] font-medium text-blue-300">En estudio</p><p className="text-[11px] text-blue-400/60">Industrias del Caribe — <span className="font-num">$80,250</span></p></div>
              <ArrowUpRight size={14} className="text-blue-400/40 group-hover:text-blue-400 transition-colors" />
            </Link>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 size={15} className="text-emerald-400" /></div>
              <div className="flex-1"><p className="text-[13px] font-medium text-emerald-300">Pago recibido</p><p className="text-[11px] text-emerald-400/60">Distribuidora Central — <span className="font-num">$24,743.75</span></p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
