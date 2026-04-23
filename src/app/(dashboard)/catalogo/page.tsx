'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Package, Zap, DollarSign, Image as ImageIcon, RefreshCw, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

type Producto = {
  id: number;
  slug: string;
  modelo: string;
  marca: string | null;
  categoria: string | null;
  motor: string | null;
  mastil_mm: number | null;
  capacidad_kg: number | null;
  imagen_url: string | null;
  imagen_local: string | null;
  precio_venta: number | null;
  precio_alquiler_1ano: number | null;
  activo: boolean;
  destacado: boolean;
  badge: string | null;
};

export default function CatalogoPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [marca, setMarca] = useState('todas');
  const [soloConImagen, setSoloConImagen] = useState(false);
  const [soloConPrecio, setSoloConPrecio] = useState(false);

  const fetchRows = async () => {
    setError(null);
    const { data, error } = await supabase
      .from('parmonca_productos')
      .select('id, slug, modelo, marca, categoria, motor, mastil_mm, capacidad_kg, imagen_url, imagen_local, precio_venta, precio_alquiler_1ano, activo, destacado, badge')
      .order('id', { ascending: false });
    if (error) setError(error.message);
    else setRows((data || []) as Producto[]);
  };

  useEffect(() => {
    fetchRows().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categorias = Array.from(new Set(rows.map(r => r.categoria).filter(Boolean))) as string[];
  const marcas = Array.from(new Set(rows.map(r => r.marca).filter(Boolean))).sort() as string[];

  const filtered = rows.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.modelo.toLowerCase().includes(q) ||
      (p.marca || '').toLowerCase().includes(q);
    const matchCat = categoria === 'todas' || p.categoria === categoria;
    const matchMar = marca === 'todas' || p.marca === marca;
    const matchImg = !soloConImagen || !!(p.imagen_url || p.imagen_local);
    const matchPrice = !soloConPrecio || !!p.precio_venta;
    return matchSearch && matchCat && matchMar && matchImg && matchPrice;
  });

  const stats = {
    total: rows.length,
    conImagen: rows.filter(r => r.imagen_url || r.imagen_local).length,
    conPrecio: rows.filter(r => r.precio_venta).length,
    activos: rows.filter(r => r.activo).length,
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRows();
    setRefreshing(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Catálogo</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {loading ? 'Cargando…' : `${filtered.length} de ${rows.length} modelos`}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-glass)] text-[var(--color-text-secondary)] text-[12px] hover:bg-[var(--color-surface-hover)] transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refrescar
        </button>
      </div>

      {error && (
        <div className="glass rounded-xl p-4 border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="glass rounded-lg px-3 py-2">
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Total</p>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">{stats.total}</p>
        </div>
        <div className="glass rounded-lg px-3 py-2">
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Activos</p>
          <p className="text-lg font-bold text-emerald-400">{stats.activos}</p>
        </div>
        <div className="glass rounded-lg px-3 py-2">
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Con imagen</p>
          <p className="text-lg font-bold text-[#E8821C]">{stats.conImagen}</p>
        </div>
        <div className="glass rounded-lg px-3 py-2">
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Con precio</p>
          <p className="text-lg font-bold text-blue-400">{stats.conPrecio}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar modelo o marca..."
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/30 transition-all"
          />
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] focus:outline-none focus:border-[#E8821C]/30"
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className="h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] focus:outline-none focus:border-[#E8821C]/30"
        >
          <option value="todas">Todas las marcas</option>
          {marcas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <label className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[12px] text-[var(--color-text-secondary)] cursor-pointer">
          <input type="checkbox" checked={soloConImagen} onChange={(e) => setSoloConImagen(e.target.checked)} className="accent-[#E8821C]" />
          Con imagen
        </label>
        <label className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[12px] text-[var(--color-text-secondary)] cursor-pointer">
          <input type="checkbox" checked={soloConPrecio} onChange={(e) => setSoloConPrecio(e.target.checked)} className="accent-[#E8821C]" />
          Con precio
        </label>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="glass rounded-xl p-10 text-center text-[var(--color-text-muted)] text-sm">Cargando productos…</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-[var(--color-text-muted)] text-sm">Ningún producto coincide con los filtros.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => {
            const img = p.imagen_local || p.imagen_url;
            return (
            <Link href={`/catalogo/${p.id}`} key={p.id} className="glass rounded-xl overflow-hidden hover:bg-[var(--color-surface-glass)] transition-all group">
              <div className="aspect-[4/3] bg-gradient-to-br from-[var(--color-surface-glass)] to-transparent flex items-center justify-center relative overflow-hidden">
                {img ? (
                  <Image src={img} alt={p.modelo} width={240} height={180} className="object-contain w-full h-full" unoptimized />
                ) : (
                  <Package size={48} className="text-[var(--color-text-muted)] group-hover:text-[#E8821C]/30 transition-colors" strokeWidth={1.5} />
                )}
                {p.marca && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-[#E8821C]/10 border border-[#E8821C]/20 backdrop-blur-sm">
                    <Zap size={9} className="text-[#E8821C]" />
                    <span className="text-[9px] font-bold text-[#E8821C] uppercase tracking-wider">{p.marca}</span>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 flex gap-1">
                  {p.precio_venta && (
                    <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center" title="Tiene precio">
                      <DollarSign size={10} className="text-emerald-400" />
                    </div>
                  )}
                  <div className="w-5 h-5 rounded bg-[#E8821C]/10 border border-[#E8821C]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="Editar">
                    <Pencil size={10} className="text-[#E8821C]" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 text-[9px] text-[var(--color-text-muted)] font-mono">#{p.id}</span>
              </div>
              <div className="p-3.5">
                <h3 className="font-bold text-[var(--color-text-primary)] text-[14px] font-display group-hover:text-[#E8821C] transition-colors">{p.modelo}</h3>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 uppercase tracking-wider">
                  {p.categoria || 'Sin categoría'}
                </p>

                <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="px-2 py-1 bg-[var(--color-surface-glass)] rounded">
                    <span className="text-[var(--color-text-muted)]">Motor</span>
                    <span className="text-[var(--color-text-secondary)] block font-medium">{p.motor || '—'}</span>
                  </div>
                  <div className="px-2 py-1 bg-[var(--color-surface-glass)] rounded">
                    <span className="text-[var(--color-text-muted)]">Cap. kg</span>
                    <span className="text-[var(--color-text-secondary)] block font-medium">{p.capacidad_kg ?? '—'}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] flex items-end justify-between">
                  {p.precio_venta ? (
                    <span className="text-lg font-num font-bold text-[var(--color-text-primary)]">{formatCurrency(Number(p.precio_venta))}</span>
                  ) : (
                    <span className="text-[11px] text-[var(--color-text-muted)] italic">Precio pendiente</span>
                  )}
                  <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider">{p.activo ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
