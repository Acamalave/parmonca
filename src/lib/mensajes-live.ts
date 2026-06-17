import { createClient } from '@/lib/supabase/client';

export type Canal = 'whatsapp' | 'instagram' | 'messenger' | 'web';
export type EstadoConv = 'abierta' | 'pendiente' | 'cerrada';

export type Conversacion = {
  id: string;
  canal: Canal;
  contacto_nombre: string | null;
  contacto_externo_id: string | null;
  contacto_telefono: string | null;
  contacto_email: string | null;
  cliente_id: string | null;
  asignado_a: string | null;
  estado: EstadoConv;
  no_leidos: number;
  ultimo_mensaje_at: string | null;
  ultimo_mensaje_preview: string | null;
  created_at: string;
};

export type Mensaje = {
  id: string;
  conversacion_id: string;
  direccion: 'entrante' | 'saliente';
  tipo: 'texto' | 'imagen' | 'archivo' | 'audio' | 'video' | 'sistema';
  texto: string | null;
  adjunto_url: string | null;
  autor_id: string | null;
  estado_envio: 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'fallido' | null;
  created_at: string;
};

const CONV_COLS =
  'id, canal, contacto_nombre, contacto_externo_id, contacto_telefono, contacto_email, cliente_id, asignado_a, estado, no_leidos, ultimo_mensaje_at, ultimo_mensaje_preview, created_at';

/** Conversaciones visibles para el usuario (RLS: admin todas, asesor las suyas). */
export async function fetchConversaciones(): Promise<Conversacion[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('parmonca_conversaciones')
    .select(CONV_COLS)
    .order('ultimo_mensaje_at', { ascending: false, nullsFirst: false });
  return (data || []) as Conversacion[];
}

export async function fetchMensajes(conversacionId: string): Promise<Mensaje[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('parmonca_mensajes')
    .select('id, conversacion_id, direccion, tipo, texto, adjunto_url, autor_id, estado_envio, created_at')
    .eq('conversacion_id', conversacionId)
    .order('created_at', { ascending: true });
  return (data || []) as Mensaje[];
}

/**
 * Registra una respuesta saliente. En Fase 0 sólo guarda el mensaje (historial);
 * en Fase 1 esta misma acción además llamará a la API del canal (WhatsApp, etc.).
 */
export async function enviarMensaje(conversacionId: string, texto: string, autorId: string): Promise<Mensaje | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('parmonca_mensajes')
    .insert({
      conversacion_id: conversacionId,
      direccion: 'saliente',
      tipo: 'texto',
      texto,
      autor_id: autorId,
      estado_envio: 'enviado',
    })
    .select('id, conversacion_id, direccion, tipo, texto, adjunto_url, autor_id, estado_envio, created_at')
    .single();
  if (error) { console.error('enviarMensaje:', error); return null; }
  return data as Mensaje;
}

/** Marca la conversación como leída (no_leidos = 0). */
export async function marcarLeida(conversacionId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('parmonca_conversaciones').update({ no_leidos: 0 }).eq('id', conversacionId);
}

/** Cambia el asesor asignado (sólo admin por RLS). */
export async function asignarConversacion(conversacionId: string, asignadoA: string | null): Promise<void> {
  const supabase = createClient();
  await supabase.from('parmonca_conversaciones').update({ asignado_a: asignadoA }).eq('id', conversacionId);
}

/** Cambia el estado de la conversación. */
export async function cambiarEstado(conversacionId: string, estado: EstadoConv): Promise<void> {
  const supabase = createClient();
  await supabase.from('parmonca_conversaciones').update({ estado }).eq('id', conversacionId);
}

export const CANAL_META: Record<Canal, { label: string; emoji: string; color: string }> = {
  whatsapp: { label: 'WhatsApp', emoji: '🟢', color: '#25D366' },
  instagram: { label: 'Instagram', emoji: '📸', color: '#E1306C' },
  messenger: { label: 'Messenger', emoji: '💬', color: '#0084FF' },
  web: { label: 'Chat web', emoji: '🌐', color: '#E8821C' },
};

/** Hora/fecha corta para la lista y el hilo. */
export function horaCorta(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const hoy = new Date();
  const mismoDia = d.toDateString() === hoy.toDateString();
  return mismoDia
    ? d.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit' });
}
