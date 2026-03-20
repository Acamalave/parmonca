'use client';

import { User, Building2, Bell, Shield } from 'lucide-react';
import { empresasCotizadoras } from '@/lib/demo-data';

export default function ConfiguracionPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="font-display text-2xl font-bold text-white tracking-tight">Configuracion</h1>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4"><User size={15} className="text-[#E8821C]" /><h2 className="text-[13px] font-semibold text-zinc-300">Perfil</h2></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ label: 'Nombre', value: 'Acacio Malave' }, { label: 'Email', value: 'acacio@parmonca.com' }].map(f => (
            <div key={f.label}>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 mb-1.5">{f.label}</label>
              <input type="text" defaultValue={f.value} className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-zinc-300 focus:outline-none focus:border-[#E8821C]/30" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600 mb-1.5">Rol</label>
            <input type="text" defaultValue="Super Admin" disabled className="w-full h-9 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[13px] text-zinc-600" />
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4"><Building2 size={15} className="text-[#E8821C]" /><h2 className="text-[13px] font-semibold text-zinc-300">Empresas Cotizadoras</h2></div>
        <div className="space-y-2">
          {empresasCotizadoras.map((emp) => (
            <div key={emp} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
              <span className="text-[13px] font-medium text-zinc-300">{emp}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">Activa</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4"><Bell size={15} className="text-[#E8821C]" /><h2 className="text-[13px] font-semibold text-zinc-300">Notificaciones</h2></div>
        <div className="space-y-3">
          {['Nuevas cotizaciones', 'Facturas vencidas', 'Pagos recibidos', 'Leads sin atender'].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <span className="text-[13px] text-zinc-400">{item}</span>
              <button className="w-9 h-5 bg-[#E8821C] rounded-full relative"><div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" /></button>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full h-10 bg-gradient-to-r from-[#E8821C] to-[#C96A10] hover:from-[#FF9F43] hover:to-[#E8821C] text-white font-semibold rounded-xl transition-all active:scale-[0.99] glow-brand-sm">
        Guardar Cambios
      </button>
    </div>
  );
}
