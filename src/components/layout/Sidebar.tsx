'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCRM } from '@/context/CRMContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Kanban,
  Receipt,
  Package,
  Settings,
  X,
  ChevronsLeft,
  ChevronsRight,
  Wrench,
  LogOut,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', href: '/clientes', icon: Users },
  { label: 'Cotizaciones', href: '/cotizaciones', icon: FileText },
  { label: 'Pipeline', href: '/pipeline', icon: Kanban },
  { label: 'Facturas', href: '/facturas', icon: Receipt },
  { label: 'Catalogo', href: '/catalogo', icon: Package },
  { label: 'Herramientas', href: '/herramientas', icon: Wrench },
  { label: 'Configuracion', href: '/configuracion', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useCRM();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full flex flex-col transition-all duration-300 lg:static lg:z-auto',
          'bg-[#0E0E11]/95 backdrop-blur-xl border-r border-white/[0.06]',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-[240px]',
          'w-[240px]'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'h-14 flex items-center border-b border-white/[0.04] transition-all',
          sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}>
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <Image
              src="/images/isotipo-white.png"
              alt="PARMONCA"
              width={30}
              height={30}
              className="flex-shrink-0"
            />
            {!sidebarCollapsed && (
              <Image
                src="/images/logo-white.png"
                alt="PARMONCA"
                width={130}
                height={38}
                className="h-5 w-auto object-contain"
              />
            )}
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-zinc-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 py-3 space-y-0.5 overflow-y-auto', sidebarCollapsed ? 'px-1.5' : 'px-2.5')}>
          {!sidebarCollapsed && (
            <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-700 px-2.5 mb-2">
              Menu
            </p>
          )}
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center rounded-lg text-[13px] font-medium transition-all duration-200 group',
                  sidebarCollapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-2',
                  isActive
                    ? 'bg-[#E8821C]/10 text-[#E8821C]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                )}
              >
                <Icon
                  size={sidebarCollapsed ? 19 : 17}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={cn(isActive && 'drop-shadow-[0_0_6px_#E8821C80]')}
                />
                {!sidebarCollapsed && (
                  <>
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E8821C] pulse-dot" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className={cn(
          'hidden lg:flex border-t border-white/[0.04]',
          sidebarCollapsed ? 'justify-center p-2' : 'px-3 py-2'
        )}>
          <button
            onClick={toggleSidebar}
            className={cn(
              'flex items-center gap-2 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03] transition-colors text-[12px]',
              sidebarCollapsed ? 'p-2' : 'px-2.5 py-1.5 w-full'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronsRight size={16} />
            ) : (
              <>
                <ChevronsLeft size={14} />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>

        {/* User */}
        <div className={cn(
          'border-t border-white/[0.04]',
          sidebarCollapsed ? 'p-1.5' : 'p-2.5'
        )}>
          <div className={cn(
            'flex items-center rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer',
            sidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2 py-2'
          )}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E8821C] to-[#C96A10] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              AM
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-zinc-300 truncate">Acacio Malave</p>
                <p className="text-[10px] text-zinc-600 truncate">Super Admin</p>
              </div>
            )}
          </div>
          <Link
            href="/login"
            title={sidebarCollapsed ? 'Cerrar Sesion' : undefined}
            className={cn(
              'flex items-center rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors mt-1',
              sidebarCollapsed ? 'justify-center p-2' : 'gap-2 px-2 py-1.5'
            )}
          >
            <LogOut size={14} />
            {!sidebarCollapsed && <span className="text-[11px]">Cerrar Sesion</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
