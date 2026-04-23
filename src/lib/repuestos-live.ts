import { createClient } from '@/lib/supabase/client';

export type CategoriaRepuesto = 'llantas' | 'asientos' | 'traspaletas_manuales' | 'tanques' | 'otros';

export type Repuesto = {
  id: string;
  sku: string | null;
  nombre: string;
  categoria: CategoriaRepuesto;
  subcategoria: string | null;
  marca: string | null;
  descripcion: string | null;
  imagen_url: string | null;
  precio_venta: number | null;
  stock: number;
  stock_minimo: number;
  unidad: string | null;
  compatible_con: string[] | null;
  destacado: boolean;
  ultima_sync_at: string | null;
};

export async function fetchRepuestos(categoria?: CategoriaRepuesto): Promise<Repuesto[]> {
  const supabase = createClient();
  // Sólo productos con stock disponible — agotados no se muestran en el landing.
  let q = supabase
    .from('parmonca_repuestos')
    .select('id, sku, nombre, categoria, subcategoria, marca, descripcion, imagen_url, precio_venta, stock, stock_minimo, unidad, compatible_con, destacado, ultima_sync_at')
    .gt('stock', 0)
    .order('destacado', { ascending: false })
    .order('stock', { ascending: false });
  if (categoria) q = q.eq('categoria', categoria);
  const { data } = await q;
  return (data || []) as Repuesto[];
}

/**
 * Fetch a single repuesto by its UUID. Returns null when not found or inactive.
 */
export async function fetchRepuesto(id: string): Promise<Repuesto | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('parmonca_repuestos')
    .select('id, sku, nombre, categoria, subcategoria, marca, descripcion, imagen_url, precio_venta, stock, stock_minimo, unidad, compatible_con, destacado, ultima_sync_at')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as Repuesto;
}

export function stockBadge(r: Repuesto): { label: string; color: 'emerald' | 'amber' | 'rose' | 'slate' } {
  if (r.stock <= r.stock_minimo) return { label: `Últimas ${r.stock}`, color: 'amber' };
  if (r.stock < 10) return { label: `${r.stock} disponibles`, color: 'emerald' };
  return { label: 'En stock', color: 'emerald' };
}

/**
 * Format price for display. Returns null when the product has no price, so the
 * UI can render the "Cotizar" CTA instead.
 */
export function formatPrecio(r: Repuesto): string | null {
  if (!r.precio_venta || r.precio_venta <= 0) return null;
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(r.precio_venta);
}

export const CATEGORIAS_REPUESTOS = [
  {
    id: 'llantas' as CategoriaRepuesto,
    label: 'Llantas',
    emoji: '🛞',
    hint: 'Sólidas y neumáticas para todo tipo de operación',
  },
  {
    id: 'asientos' as CategoriaRepuesto,
    label: 'Asientos',
    emoji: '💺',
    hint: 'Ergonómicos y con suspensión para tu operador',
  },
  {
    id: 'traspaletas_manuales' as CategoriaRepuesto,
    label: 'Traspaletas',
    emoji: '🔧',
    hint: 'Traspaletas manuales hidráulicas para pallets',
  },
  {
    id: 'tanques' as CategoriaRepuesto,
    label: 'Tanques GLP',
    emoji: '⛽',
    hint: 'Tanques intercambiables de 20 y 43 lb',
  },
];
