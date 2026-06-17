import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { metaConfig, verificarFirmaMetaMsg } from '@/lib/meta-messaging';

/**
 * Webhook de Messenger Platform (Facebook Messenger + Instagram DM).
 *   GET  → handshake de verificación (hub.challenge).
 *   POST → mensajes entrantes: upsert conversación + insert mensaje.
 *
 * `object` distingue el canal: 'page' → messenger, 'instagram' → instagram.
 * Público; escribe con service role. Requiere SUPABASE_SERVICE_ROLE_KEY + MESSENGER_*.
 */
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const { verifyToken } = metaConfig();
  if (mode === 'subscribe' && verifyToken && token === verifyToken) {
    return new NextResponse(challenge || '', { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

type MetaEvent = {
  sender?: { id: string };
  message?: { mid?: string; text?: string; is_echo?: boolean };
  timestamp?: number;
};

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verificarFirmaMetaMsg(raw, req.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Invalid signature', { status: 401 });
  }
  let body: { object?: string; entry?: unknown[] };
  try { body = JSON.parse(raw); } catch { return new NextResponse('Bad JSON', { status: 400 }); }

  const canal = body.object === 'instagram' ? 'instagram' : 'messenger';

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Webhook Meta: falta SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json({ ok: true });
  }
  const admin = createAdminClient();

  try {
    for (const entry of body.entry || []) {
      const eventos = (entry as { messaging?: MetaEvent[] }).messaging || [];
      for (const ev of eventos) {
        const msg = ev.message;
        // Ignorar ecos (mensajes que enviamos nosotros) y eventos sin texto.
        if (!msg || msg.is_echo || !msg.text) continue;
        const externoId = ev.sender?.id;
        if (!externoId) continue;
        const creado = ev.timestamp ? new Date(ev.timestamp).toISOString() : new Date().toISOString();

        let convId: string | null = null;
        const { data: existente } = await admin
          .from('parmonca_conversaciones')
          .select('id')
          .eq('canal', canal)
          .eq('contacto_externo_id', externoId)
          .maybeSingle();

        if (existente) {
          convId = existente.id as string;
          await admin.from('parmonca_conversaciones').update({ estado: 'abierta' }).eq('id', convId);
        } else {
          const { data: nueva } = await admin
            .from('parmonca_conversaciones')
            .insert({ canal, contacto_externo_id: externoId, estado: 'abierta' })
            .select('id')
            .single();
          convId = nueva?.id as string ?? null;
        }

        if (convId) {
          await admin.from('parmonca_mensajes').insert({
            conversacion_id: convId,
            direccion: 'entrante',
            tipo: 'texto',
            texto: msg.text,
            externo_id: msg.mid,
            created_at: creado,
          });
        }
      }
    }
  } catch (err) {
    console.error('Webhook Meta error:', err);
  }

  return NextResponse.json({ ok: true });
}
