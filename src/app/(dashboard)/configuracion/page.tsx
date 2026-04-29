'use client';

import Link from 'next/link';
import { User, Building2, Bell, Database, ArrowRight, Construction } from 'lucide-react';
import { empresasCotizadoras } from '@/lib/demo-data';

/**
 * Página placeholder: la mayoría de bloques (perfil editable, toggles de
 * notificaciones, lista de empresas cotizadoras) son demo y no se
 * persisten todavía. Lo único realmente funcional es el link a la
 * configuración de Odoo. Los inputs están `disabled` y el CTA "Guardar"
 * se eliminó para no engañar al usuario hasta tener backend de settings.
 */
export default function ConfiguracionPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Configuración</h1>
        <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
          Las integraciones (Odoo) ya funcionan. El resto de bloques está en construcción.
        </p>
      </div>

      {/* Banner de "en construcción" para evitar que el usuario crea que
          puede editar el perfil o los toggles de notificaciones desde aquí. */}
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 flex items-start gap-2.5">
        <Construction size={16} className="text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">Configuración en construcción</p>
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
            El perfil y los toggles de notificaciones todavía no se guardan en BD — son sólo previsualización.
            Para cambiar tu PIN o regenerar tu link de acceso, ve a <Link href="/equipo" className="text-[#E8821C] hover:underline">Mi Equipo</Link>.
          </p>
        </div>
      </div>

      {/* Integración Odoo — esta sí funciona */}
      <Link
        href="/configuracion/odoo"
        className="glass rounded-xl p-5 flex items-center justify-between hover:border-[#E8821C]/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#E8821C]/10 border border-[#E8821C]/20 flex items-center justify-center">
            <Database size={15} className="text-[#E8821C]" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">Integración Odoo</h2>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Sincronización de repuestos desde ml.parts</p>
          </div>
        </div>
        <ArrowRight size={14} className="text-[var(--color-text-muted)]" />
      </Link>

      {/* Perfil — preview, sin persistencia todavía */}
      <div className="glass rounded-xl p-5 opacity-70">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User size={15} className="text-[#E8821C]" />
            <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Perfil</h2>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400">Próximamente</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ label: 'Nombre', value: 'Acacio Malave' }, { label: 'Email', value: 'acacio@parmonca.com' }].map(f => (
            <div key={f.label}>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">{f.label}</label>
              <input type="text" defaultValue={f.value} disabled className="w-full h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-muted)] cursor-not-allowed" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-1.5">Rol</label>
            <input type="text" defaultValue="Super Admin" disabled className="w-full h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-muted)] cursor-not-allowed" />
          </div>
        </div>
      </div>

      {/* Empresas — placeholder, viene de demo-data */}
      <div className="glass rounded-xl p-5 opacity-70">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-[#E8821C]" />
            <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Empresas Cotizadoras</h2>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400">Próximamente</span>
        </div>
        <div className="space-y-2">
          {empresasCotizadoras.map((emp) => (
            <div key={emp} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">{emp}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">Activa</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notificaciones — toggles visuales, sin persistencia */}
      <div className="glass rounded-xl p-5 opacity-70">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-[#E8821C]" />
            <h2 className="text-[13px] font-semibold text-[var(--color-text-secondary)]">Notificaciones</h2>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400">Próximamente</span>
        </div>
        <div className="space-y-3">
          {['Nuevas cotizaciones', 'Facturas vencidas', 'Pagos recibidos', 'Leads sin atender'].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--color-text-muted)]">{item}</span>
              <button disabled className="w-9 h-5 bg-[var(--color-surface-glass)] border border-[var(--color-border)] rounded-full relative cursor-not-allowed">
                <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-[var(--color-text-muted)] rounded-full" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
