'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, MessageSquare, ArrowLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/lib/supabase/use-profile';
import { isAdmin } from '@/lib/supabase/roles';
import {
  fetchConversaciones, fetchMensajes, enviarMensaje, marcarLeida,
  asignarConversacion, cambiarEstado,
  CANAL_META, horaCorta,
  type Conversacion, type Mensaje, type EstadoConv,
} from '@/lib/mensajes-live';

type ProfileLite = { id: string; nombre: string | null; email: string };

export default function MensajesPage() {
  const { profile } = useProfile();
  const userIsAdmin = isAdmin(profile?.rol);

  const [convs, setConvs] = useState<Conversacion[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [equipo, setEquipo] = useState<ProfileLite[]>([]);
  const [cargando, setCargando] = useState(true);

  const selIdRef = useRef<string | null>(null);
  useEffect(() => { selIdRef.current = selId; }, [selId]);
  const hiloRef = useRef<HTMLDivElement>(null);

  const recargarConvs = useCallback(async () => {
    setConvs(await fetchConversaciones());
  }, []);

  // Carga inicial + realtime
  useEffect(() => {
    const supabase = createClient();
    fetchConversaciones().then(setConvs).finally(() => setCargando(false));

    const channel = supabase
      .channel('bandeja_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parmonca_conversaciones' }, () => {
        fetchConversaciones().then(setConvs);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'parmonca_mensajes' }, (payload) => {
        const m = payload.new as Mensaje;
        fetchConversaciones().then(setConvs);
        if (m.conversacion_id === selIdRef.current) {
          fetchMensajes(m.conversacion_id).then(setMensajes);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Equipo (para asignar) — sólo admin
  useEffect(() => {
    if (!userIsAdmin) return;
    const supabase = createClient();
    supabase.from('parmonca_profiles')
      .select('id, nombre, email')
      .in('rol', ['asesor', 'gerente', 'super-admin'])
      .eq('activo', true)
      .then(({ data }) => setEquipo((data || []) as ProfileLite[]));
  }, [userIsAdmin]);

  // Al seleccionar conversación: cargar hilo + marcar leída
  const abrir = async (id: string) => {
    setSelId(id);
    setMensajes(await fetchMensajes(id));
    await marcarLeida(id);
    setConvs(prev => prev.map(c => c.id === id ? { ...c, no_leidos: 0 } : c));
  };

  // Auto-scroll al final del hilo
  useEffect(() => {
    if (hiloRef.current) hiloRef.current.scrollTop = hiloRef.current.scrollHeight;
  }, [mensajes]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t || !selId || !profile?.id) return;
    setEnviando(true);
    setTexto('');
    const m = await enviarMensaje(selId, t, profile.id);
    if (m) setMensajes(prev => [...prev, m]);
    await recargarConvs();
    setEnviando(false);
  };

  const sel = convs.find(c => c.id === selId) || null;
  const filtradas = convs.filter(c =>
    !buscar || (c.contacto_nombre || '').toLowerCase().includes(buscar.toLowerCase())
    || (c.contacto_telefono || '').includes(buscar));

  return (
    <div className="h-[calc(100vh-7rem)] flex rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* ── Lista de conversaciones ── */}
      <aside className={cn(
        'w-full sm:w-80 flex-shrink-0 border-r border-[var(--color-border)] flex flex-col',
        selId && 'hidden sm:flex'
      )}>
        <div className="p-3 border-b border-[var(--color-border)]">
          <h1 className="font-display text-lg font-bold text-[var(--color-text-primary)] mb-2">Mensajes</h1>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={buscar} onChange={e => setBuscar(e.target.value)}
              placeholder="Buscar contacto…"
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {cargando ? (
            <p className="p-4 text-[13px] text-[var(--color-text-muted)]">Cargando…</p>
          ) : filtradas.length === 0 ? (
            <p className="p-4 text-[13px] text-[var(--color-text-muted)]">No hay conversaciones.</p>
          ) : filtradas.map(c => {
            const meta = CANAL_META[c.canal];
            return (
              <button key={c.id} onClick={() => abrir(c.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors flex gap-2.5',
                  selId === c.id && 'bg-[#E8821C]/[0.06]'
                )}>
                <div className="w-9 h-9 rounded-full bg-[var(--color-surface-glass)] border border-[var(--color-border)] flex items-center justify-center text-[13px] flex-shrink-0" title={meta.label}>
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">{c.contacto_nombre || c.contacto_telefono || 'Contacto'}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0">{horaCorta(c.ultimo_mensaje_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-[11px] text-[var(--color-text-muted)] truncate">{c.ultimo_mensaje_preview || '—'}</span>
                    {c.no_leidos > 0 && (
                      <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E8821C] text-white text-[10px] font-bold flex items-center justify-center">{c.no_leidos}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Hilo ── */}
      <section className={cn('flex-1 flex flex-col min-w-0', !selId && 'hidden sm:flex')}>
        {!sel ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare size={36} className="text-[var(--color-text-muted)]/40 mb-3" />
            <p className="text-[14px] text-[var(--color-text-secondary)]">Elige una conversación</p>
            <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Los mensajes de WhatsApp, Instagram y Messenger aparecerán aquí.</p>
          </div>
        ) : (
          <>
            {/* Header del hilo */}
            <header className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center gap-3">
              <button onClick={() => setSelId(null)} className="sm:hidden p-1.5 text-[var(--color-text-muted)]"><ArrowLeft size={18} /></button>
              <div className="w-9 h-9 rounded-full bg-[var(--color-surface-glass)] border border-[var(--color-border)] flex items-center justify-center text-[13px]">{CANAL_META[sel.canal].emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[var(--color-text-primary)] truncate">{sel.contacto_nombre || sel.contacto_telefono || 'Contacto'}</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{CANAL_META[sel.canal].label}{sel.contacto_telefono ? ` · ${sel.contacto_telefono}` : ''}</p>
              </div>
              {/* Estado */}
              <select
                value={sel.estado}
                onChange={async e => { const v = e.target.value as EstadoConv; await cambiarEstado(sel.id, v); recargarConvs(); }}
                className="h-8 px-2 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[12px] text-[var(--color-text-secondary)] focus:outline-none"
              >
                <option value="abierta">Abierta</option>
                <option value="pendiente">Pendiente</option>
                <option value="cerrada">Cerrada</option>
              </select>
              {/* Asignación (admin) */}
              {userIsAdmin && (
                <select
                  value={sel.asignado_a || ''}
                  onChange={async e => { await asignarConversacion(sel.id, e.target.value || null); recargarConvs(); }}
                  className="h-8 px-2 rounded-lg bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[12px] text-[var(--color-text-secondary)] focus:outline-none max-w-[140px]"
                  title="Asignar a"
                >
                  <option value="">Sin asignar</option>
                  {equipo.map(e => <option key={e.id} value={e.id}>{e.nombre || e.email.split('@')[0]}</option>)}
                </select>
              )}
            </header>

            {/* Mensajes */}
            <div ref={hiloRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-[var(--color-surface-elevated)]">
              {mensajes.map(m => (
                <div key={m.id} className={cn('flex', m.direccion === 'saliente' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug',
                    m.direccion === 'saliente'
                      ? 'bg-gradient-to-br from-[#E8821C] to-[#C96A10] text-white rounded-br-sm'
                      : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-bl-sm'
                  )}>
                    {m.texto}
                    <div className={cn('text-[9px] mt-1', m.direccion === 'saliente' ? 'text-white/70 text-right' : 'text-[var(--color-text-muted)]')}>
                      {horaCorta(m.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Responder */}
            <div className="p-3 border-t border-[var(--color-border)] flex items-end gap-2">
              <textarea
                value={texto}
                onChange={e => setTexto(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                rows={1}
                placeholder="Escribe una respuesta…"
                className="flex-1 max-h-32 resize-none px-3 py-2 rounded-xl bg-[var(--color-surface-glass)] border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[#E8821C]/40"
              />
              <button
                onClick={enviar}
                disabled={enviando || !texto.trim()}
                className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-r from-[#E8821C] to-[#C96A10] text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="px-4 pb-2 text-[10px] text-[var(--color-text-muted)]">
              Fase 0: las respuestas se guardan en el historial. El envío real por WhatsApp/Instagram se conecta en la Fase 1.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
