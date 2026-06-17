/**
 * Cliente de Messenger Platform (Facebook Messenger + Instagram DM) — Meta.
 *
 * Messenger e Instagram comparten la misma Send API a través del token de la
 * Página de Facebook conectada (la cuenta de IG Business cuelga de esa Página).
 *
 * Env vars (Vercel) — se activan al conectar la Página/IG:
 *   MESSENGER_PAGE_TOKEN   Page Access Token (envía Messenger e IG)
 *   META_VERIFY_TOKEN      Token arbitrario para el handshake del webhook
 *   META_APP_SECRET        App secret (firma del webhook). Si falta, usa WHATSAPP_APP_SECRET.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const GRAPH = 'https://graph.facebook.com/v21.0';

export function metaConfig() {
  return {
    pageToken: process.env.MESSENGER_PAGE_TOKEN || '',
    verifyToken: process.env.META_VERIFY_TOKEN || '',
    appSecret: process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET || '',
  };
}

export function metaConfigurado(): boolean {
  return !!metaConfig().pageToken;
}

/**
 * Envía un mensaje de texto a un usuario de Messenger (PSID) o Instagram (IGSID)
 * vía la Send API de la Página. Sujeto a la ventana de 24h de Meta para texto
 * libre (fuera de ella se requieren etiquetas/plantillas).
 */
export async function enviarMensajeMeta(
  recipientId: string,
  texto: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const c = metaConfig();
  if (!c.pageToken) return { ok: false, error: 'meta_no_configurado' };
  try {
    const res = await fetch(`${GRAPH}/me/messages?access_token=${encodeURIComponent(c.pageToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { text: texto },
      }),
    });
    const j = await res.json().catch(() => ({})) as {
      message_id?: string;
      error?: { message?: string };
    };
    if (!res.ok) return { ok: false, error: j.error?.message || `HTTP ${res.status}` };
    return { ok: true, id: j.message_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Verifica X-Hub-Signature-256 del webhook de Meta con el app secret. */
export function verificarFirmaMetaMsg(rawBody: string, signature: string | null): boolean {
  const c = metaConfig();
  if (!c.appSecret) return true; // sin secret: no se valida (configurar en prod)
  if (!signature) return false;
  const esperado = 'sha256=' + createHmac('sha256', c.appSecret).update(rawBody).digest('hex');
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(esperado);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
