import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { whatsappConfigurado, enviarWhatsappTexto } from '@/lib/whatsapp';

/**
 * POST /api/mensajes/enviar  { conversacionId, texto }
 *
 * Registra la respuesta saliente (con RLS: el asesor solo puede en sus
 * conversaciones; admin en todas) y, si el canal es WhatsApp y está
 * configurado, la envía por la Cloud API. Devuelve el mensaje insertado.
 */
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { conversacionId, texto } = await req.json().catch(() => ({}));
  if (!conversacionId || !texto || typeof texto !== 'string' || !texto.trim()) {
    return NextResponse.json({ error: 'datos_invalidos' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'no_autenticado' }, { status: 401 });

  // RLS deja leer solo conversaciones visibles para el usuario.
  const { data: conv } = await supabase
    .from('parmonca_conversaciones')
    .select('id, canal, contacto_externo_id, contacto_telefono')
    .eq('id', conversacionId)
    .maybeSingle();
  if (!conv) return NextResponse.json({ error: 'conversacion_no_encontrada' }, { status: 404 });

  const esWhatsapp = conv.canal === 'whatsapp';
  const puedeEnviar = esWhatsapp && whatsappConfigurado();

  // Insert con RLS (autor_id = auth.uid(), conversación visible).
  const { data: msg, error: insErr } = await supabase
    .from('parmonca_mensajes')
    .insert({
      conversacion_id: conversacionId,
      direccion: 'saliente',
      tipo: 'texto',
      texto: texto.trim(),
      autor_id: user.id,
      estado_envio: puedeEnviar ? 'pendiente' : 'enviado',
    })
    .select('id, conversacion_id, direccion, tipo, texto, adjunto_url, autor_id, estado_envio, created_at')
    .single();
  if (insErr || !msg) {
    return NextResponse.json({ error: insErr?.message || 'insert_fallido' }, { status: 403 });
  }

  // Envío real por WhatsApp (si aplica). El historial ya quedó guardado.
  let envio: { ok: boolean; error?: string } = { ok: true };
  if (puedeEnviar) {
    const to = conv.contacto_externo_id || conv.contacto_telefono || '';
    const r = await enviarWhatsappTexto(to, texto.trim());
    envio = r;
    await supabase
      .from('parmonca_mensajes')
      .update({ estado_envio: r.ok ? 'enviado' : 'fallido', externo_id: r.id ?? null })
      .eq('id', msg.id);
  }

  return NextResponse.json({ mensaje: { ...msg, estado_envio: puedeEnviar ? (envio.ok ? 'enviado' : 'fallido') : 'enviado' }, envio });
}
