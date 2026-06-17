import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { whatsappConfig, verificarFirmaMeta } from '@/lib/whatsapp';

/**
 * Webhook de WhatsApp Cloud API.
 *   GET  → handshake de verificación de Meta (hub.challenge).
 *   POST → mensajes entrantes: upsert de conversación + insert de mensaje.
 *
 * Público (Meta lo llama sin auth). Las escrituras usan el service-role client
 * para saltar RLS. Requiere SUPABASE_SERVICE_ROLE_KEY + env WHATSAPP_*.
 */
export const runtime = 'nodejs';

const CANAL = 'whatsapp';

// ── Verificación (Meta hace GET al configurar el webhook) ──────────────────
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const { verifyToken } = whatsappConfig();

  if (mode === 'subscribe' && verifyToken && token === verifyToken) {
    return new NextResponse(challenge || '', { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

type WaMessage = {
  from: string;
  id: string;
  timestamp?: string;
  type: string;
  text?: { body: string };
};
type WaContact = { wa_id: string; profile?: { name?: string } };
type WaStatus = { id: string; status: string };

function tipoMensaje(t: string): 'texto' | 'imagen' | 'archivo' | 'audio' | 'video' | 'sistema' {
  switch (t) {
    case 'text': return 'texto';
    case 'image': return 'imagen';
    case 'audio': return 'audio';
    case 'video': return 'video';
    case 'document': return 'archivo';
    default: return 'sistema';
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  // Verificar firma (si hay app secret configurado).
  if (!verificarFirmaMeta(raw, req.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let body: unknown;
  try { body = JSON.parse(raw); } catch { return new NextResponse('Bad JSON', { status: 400 }); }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Webhook WhatsApp: falta SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json({ ok: true }); // 200 para que Meta no reintente en loop
  }
  const admin = createAdminClient();

  try {
    const entries = (body as { entry?: unknown[] }).entry || [];
    for (const entry of entries) {
      const changes = (entry as { changes?: unknown[] }).changes || [];
      for (const change of changes) {
        const value = (change as { value?: Record<string, unknown> }).value || {};
        const contacts = (value.contacts as WaContact[]) || [];
        const messages = (value.messages as WaMessage[]) || [];
        const statuses = (value.statuses as WaStatus[]) || [];

        // Recibos de entrega/lectura → actualizar estado del saliente.
        for (const st of statuses) {
          const map: Record<string, string> = { sent: 'enviado', delivered: 'entregado', read: 'leido', failed: 'fallido' };
          const estado = map[st.status];
          if (estado) {
            await admin.from('parmonca_mensajes').update({ estado_envio: estado }).eq('externo_id', st.id);
          }
        }

        for (const msg of messages) {
          const waId = msg.from;
          const contacto = contacts.find(c => c.wa_id === waId) || contacts[0];
          const nombre = contacto?.profile?.name || null;
          const texto = msg.type === 'text' ? (msg.text?.body || null) : null;
          const creado = msg.timestamp
            ? new Date(Number(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          // Upsert de conversación por (canal, contacto_externo_id).
          let convId: string | null = null;
          const { data: existente } = await admin
            .from('parmonca_conversaciones')
            .select('id')
            .eq('canal', CANAL)
            .eq('contacto_externo_id', waId)
            .maybeSingle();

          if (existente) {
            convId = existente.id as string;
            // Reabrir si estaba cerrada y refrescar nombre.
            await admin.from('parmonca_conversaciones')
              .update({ estado: 'abierta', ...(nombre ? { contacto_nombre: nombre } : {}) })
              .eq('id', convId);
          } else {
            const { data: nueva } = await admin
              .from('parmonca_conversaciones')
              .insert({
                canal: CANAL,
                contacto_externo_id: waId,
                contacto_nombre: nombre,
                contacto_telefono: `+${waId}`,
                estado: 'abierta',
              })
              .select('id')
              .single();
            convId = nueva?.id as string ?? null;
          }

          if (convId) {
            await admin.from('parmonca_mensajes').insert({
              conversacion_id: convId,
              direccion: 'entrante',
              tipo: tipoMensaje(msg.type),
              texto,
              externo_id: msg.id,
              created_at: creado,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Webhook WhatsApp error:', err);
    // 200 igual: Meta reintenta agresivamente ante errores 5xx.
  }

  return NextResponse.json({ ok: true });
}
