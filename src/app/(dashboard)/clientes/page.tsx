'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type ClienteRow = {
  id: string;
  email: string;
  nombre: string;
  empresa: string | null;
  telefono: string | null;
  pais: string | null;
  ciudad: string | null;
  industria: string | null;
  tipo: 'lead' | 'customer';
  estado: 'activo' | 'inactivo';
  created_at: string;
};

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function ClientesPage() {
  const [rows, setRows] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroPais, setFiltroPais] = useState<string>('todos');

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('parmonca_clientes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setRows((data || []) as ClienteRow[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel('parmonca_clientes_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_clientes' }, async () => {
        const { data } = await supabase.from('parmonca_clientes').select('*').order('created_at', { ascending: false });
        if (data) setRows(data as ClienteRow[]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = rows.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.nombre.toLowerCase().includes(q) ||
      (c.empresa || '').toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    const matchTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
    const matchPais = filtroPais === 'todos' || c.pais === filtroPais;
    return matchSearch && matchTipo && matchPais;
  });

  const paises = Array.from(new Set(rows.map(c => c.pais).filter(Boolean))) as string[];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Clientes</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{loading ? 'Cargando…' : `${filtered.length} de ${rows.length} registros`}</p>
        </div>
      </div>

      {error && (
        <div className="glass rounded-xl p-4 border border-rose-500/20 bg-rose-500/5 text-rose-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, empresa o email..."
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/30 transition-all" />
        </div>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
          className="h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] focus:outline-none focus:border-[#E8821C]/30">
          <option value="todos">Todos</option><option value="customer">Clientes</option><option value="lead">Leads</option>
        </select>
        <select value={filtroPais} onChange={(e) => setFiltroPais(e.target.value)}
          className="h-9 px-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-secondary)] focus:outline-none focus:border-[#E8821C]/30">
          <option value="todos">Todos los países</option>
          {paises.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="glass rounded-xl p-10 text-center text-[var(--color-text-muted)] text-sm">Cargando clientes…</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-10 text-center text-[var(--color-text-muted)] text-sm">
          {rows.length === 0 ? 'Aún no hay clientes. Aparecen automáticamente al recibir cotizaciones.' : 'Ningún cliente coincide con los filtros.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/clientes/${c.id}`}
              className="glass rounded-xl p-4 hover:bg-[var(--color-surface-glass)] transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E8821C]/20 to-[#E8821C]/5 flex items-center justify-center text-[#E8821C] font-bold text-[11px] flex-shrink-0">
                  {getInitials(c.empresa || c.nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--color-text-secondary)] truncate text-[13px] group-hover:text-[#E8821C] transition-colors">{c.empresa || c.nombre}</h3>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{c.nombre}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${c.tipo === 'customer' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                  {c.tipo === 'customer' ? 'Cliente' : 'Lead'}
                </span>
              </div>
              <div className="mt-3 space-y-1.5">
                {(c.ciudad || c.pais) && (
                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]"><MapPin size={11} /><span>{[c.ciudad, c.pais].filter(Boolean).join(', ')}</span></div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]"><Mail size={11} /><span className="truncate">{c.email}</span></div>
                {c.telefono && (
                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]"><Phone size={11} /><span>{c.telefono}</span></div>
                )}
                {c.industria && (
                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]"><Building2 size={11} /><span>{c.industria}</span></div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
