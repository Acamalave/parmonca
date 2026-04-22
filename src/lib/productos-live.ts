// Bridges Supabase parmonca_productos with the storefront's StoreProduct shape.
// Prices and full specs come from DB; accesorios and TCO/operativo remain in store-data.ts.

import { createClient } from '@/lib/supabase/client';
import type { StoreProduct, Modalidad, PeriodoAlquiler } from '@/lib/store-data';

export type ProductoRow = {
  id: number;
  slug: string;
  modelo: string;
  marca: string | null;
  categoria: string | null;
  motor: string | null;
  mastil_mm: number | null;
  capacidad_kg: number | null;
  descripcion: string | null;
  ancho_pasillo_mm: number | null;
  longitud_sin_horquillas_mm: number | null;
  ancho_total_mm: number | null;
  altura_chasis_mm: number | null;
  imagen_url: string | null;
  imagen_local: string | null;
  precio_venta: number | string | null;
  precio_alquiler_diario: number | string | null;
  precio_alquiler_semanal: number | string | null;
  precio_alquiler_mensual: number | string | null;
  precio_alquiler_anual: number | string | null;
  activo: boolean;
  destacado: boolean;
  badge: string | null;
};

const categoryLabel = (c: string | null): StoreProduct['categoriaLabel'] => {
  switch (c) {
    case 'Montacarga Electrico': return 'Montacarga Eléctrico';
    case 'Montacarga Combustion': return 'Montacarga Combustión';
    case 'Apilador Electrico': return 'Apilador Eléctrico';
    case 'Traspaleta Electrica': return 'Traspaleta Eléctrica';
    case 'Mastil Retractil': return 'Mástil Retráctil';
    default: return (c || 'Equipo industrial') as StoreProduct['categoriaLabel'];
  }
};

const categorySlug = (c: string | null): StoreProduct['categoria'] => {
  switch (c) {
    case 'Montacarga Electrico': return 'montacarga-electrico';
    case 'Montacarga Combustion': return 'montacarga-combustion';
    case 'Apilador Electrico': return 'apilador-electrico';
    case 'Traspaleta Electrica': return 'traspaleta-electrica';
    case 'Mastil Retractil': return 'mastil-retractil';
    default: return 'montacarga-electrico';
  }
};

const num = (v: number | string | null): number => {
  if (v === null || v === undefined || v === '') return 0;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
};

export function rowToStoreProduct(row: ProductoRow): StoreProduct {
  const imagen = row.imagen_local || row.imagen_url || '/images/products/placeholder.png';
  return {
    id: String(row.id),
    slug: row.slug,
    modelo: row.modelo,
    marca: (row.marca || 'Otro') as StoreProduct['marca'],
    categoria: categorySlug(row.categoria),
    categoriaLabel: categoryLabel(row.categoria),
    capacidad: row.capacidad_kg ? `${row.capacidad_kg.toLocaleString()} kg` : '—',
    motor: row.motor || '—',
    imagen,
    imagenNoBg: imagen,
    precioDesde: num(row.precio_venta),
    preciosAlquiler: {
      diario: num(row.precio_alquiler_diario),
      semanal: num(row.precio_alquiler_semanal),
      mensual: num(row.precio_alquiler_mensual),
      anual: num(row.precio_alquiler_anual),
    },
    badge: row.badge || undefined,
    specs: {
      capacidadCarga: row.capacidad_kg ? `${row.capacidad_kg.toLocaleString()} kg` : '—',
      anchoPasillo: row.ancho_pasillo_mm ? `${row.ancho_pasillo_mm} mm` : '—',
      longitudSinHorquillas: row.longitud_sin_horquillas_mm ? `${row.longitud_sin_horquillas_mm} mm` : '—',
      anchoTotal: row.ancho_total_mm ? `${row.ancho_total_mm} mm` : '—',
      alturaChasis: row.altura_chasis_mm ? `${row.altura_chasis_mm} mm` : '—',
      tipoMotor: row.motor || '—',
    },
    descripcion: row.descripcion || '',
    caracteristicas: [],
    costoOperativo: {
      combustibleMes: 0,
      mantenimientoMes: 0,
    },
    usoRecomendado: { ambiente: [], industrias: [], frecuencia: [] },
  };
}

export async function fetchProducto(slug: string): Promise<StoreProduct | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('parmonca_productos')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single();
  if (error || !data) return null;
  return rowToStoreProduct(data as ProductoRow);
}

export async function fetchDestacados(): Promise<StoreProduct[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('parmonca_productos')
    .select('*')
    .eq('activo', true)
    .eq('destacado', true)
    .order('id', { ascending: false });
  return (data || []).map((r) => rowToStoreProduct(r as ProductoRow));
}

export async function fetchActivos(limit = 24): Promise<StoreProduct[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('parmonca_productos')
    .select('*')
    .eq('activo', true)
    .order('id', { ascending: false })
    .limit(limit);
  return (data || []).map((r) => rowToStoreProduct(r as ProductoRow));
}

export function formatPrecio(modalidad: Modalidad, periodo: PeriodoAlquiler, p: StoreProduct): number {
  if (modalidad === 'alquiler') return p.preciosAlquiler[periodo] || 0;
  return p.precioDesde;
}
