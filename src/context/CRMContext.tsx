'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  clientes as initialClientes,
  cotizaciones as initialCotizaciones,
  facturas as initialFacturas,
  pagos as initialPagos,
  pipelineCards as initialPipeline,
  notificaciones as initialNotificaciones,
  productos,
} from '@/lib/demo-data';
import { Cliente, Cotizacion, Factura, Pago, PipelineCard, Notificacion, Producto } from '@/types';

interface CRMState {
  clientes: Cliente[];
  cotizaciones: Cotizacion[];
  facturas: Factura[];
  pagos: Pago[];
  pipeline: PipelineCard[];
  notificaciones: Notificacion[];
  productos: Producto[];
  sidebarCollapsed: boolean;
}

interface CRMActions {
  addCotizacion: (cot: Cotizacion) => void;
  updateCotizacionEstado: (id: string, estado: Cotizacion['estado']) => void;
  addCliente: (cliente: Cliente) => void;
  updatePipelineCard: (id: string, etapa: PipelineCard['etapa']) => void;
  markNotificationRead: (id: string) => void;
  addNotificacion: (notif: Notificacion) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const CRMContext = createContext<(CRMState & CRMActions) | null>(null);

export function CRMProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState(initialClientes);
  const [cotizaciones, setCotizaciones] = useState(initialCotizaciones);
  const [facturas, setFacturas] = useState(initialFacturas);
  const [pagos, setPagos] = useState(initialPagos);
  const [pipeline, setPipeline] = useState(initialPipeline);
  const [notificaciones, setNotificaciones] = useState(initialNotificaciones);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const addCotizacion = useCallback((cot: Cotizacion) => {
    setCotizaciones(prev => [cot, ...prev]);
    // Auto-add notification
    setNotificaciones(prev => [{
      id: Date.now().toString(),
      tipo: 'cotizacion',
      titulo: 'Nueva cotizacion creada',
      mensaje: `${cot.numero} para ${cot.clienteNombre} por $${cot.total.toLocaleString()}`,
      leida: false,
      fecha: new Date().toISOString().split('T')[0],
      link: `/cotizaciones/${cot.id}`,
    }, ...prev]);
  }, []);

  const updateCotizacionEstado = useCallback((id: string, estado: Cotizacion['estado']) => {
    setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estado } : c));
  }, []);

  const addCliente = useCallback((cliente: Cliente) => {
    setClientes(prev => [cliente, ...prev]);
  }, []);

  const updatePipelineCard = useCallback((id: string, etapa: PipelineCard['etapa']) => {
    setPipeline(prev => prev.map(c => c.id === id ? { ...c, etapa, diasEnEtapa: 0 } : c));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  }, []);

  const addNotificacion = useCallback((notif: Notificacion) => {
    setNotificaciones(prev => [notif, ...prev]);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <CRMContext.Provider value={{
      clientes, cotizaciones, facturas, pagos, pipeline, notificaciones,
      productos, sidebarCollapsed,
      addCotizacion, updateCotizacionEstado, addCliente,
      updatePipelineCard, markNotificationRead, addNotificacion,
      toggleSidebar, setSidebarCollapsed,
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
}
