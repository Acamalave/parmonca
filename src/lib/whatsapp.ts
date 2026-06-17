/**
 * Cliente mínimo de WhatsApp Cloud API (Meta) para uso server-side.
 *
 * Env vars (Vercel producción) — se activan cuando exista la WABA:
 *   WHATSAPP_TOKEN            Token permanente de la app de Meta (System User)
 *   WHATSAPP_PHONE_NUMBER_ID  ID del número de WhatsApp Business
 *   WHATSAPP_VERIFY_TOKEN     Token arbitrario para el handshake del webhook
 *   WHATSAPP_APP_SECRET       App secret (para verificar la firma X-Hub-Signature-256)
 *
 * Mientras no estén definidas, `whatsappConfigurado()` devuelve false y el envío
 * real se omite (la bandeja sigue guardando el mensaje en el historial).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

const GRAPH = 'https://graph.facebook.com/v21.0';

export function whatsappConfig() {
  return {
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    appSecret: process.env.WHATSAPP_APP_SECRET || '',
  };
}

export function whatsappConfigurado(): boolean {
  const c = whatsappConfig();
  return !!(c.token && c.phoneNumberId);
}

/**
 * Envía un mensaje de texto libre. Solo funciona dentro de la ventana de 24h
 * desde el último mensaje del cliente; fuera de ella Meta exige una plantilla
 * aprobada (eso es una mejora posterior).
 */
export async function enviarWhatsappTexto(
  to: string,
  texto: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const c = whatsappConfig();
  if (!c.token || !c.phoneNumberId) {
    return { ok: false, error: 'whatsapp_no_configurado' };
  }
  const dest = to.replace(/[^\d]/g, ''); // E.164 sin '+'
  try {
    const res = await fetch(`${GRAPH}/${c.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: dest,
        type: 'text',
        text: { body: texto },
      }),
    });
    const j = await res.json().catch(() => ({})) as {
      messages?: { id: string }[];
      error?: { message?: string };
    };
    if (!res.ok) {
      return { ok: false, error: j.error?.message || `HTTP ${res.status}` };
    }
    return { ok: true, id: j.messages?.[0]?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Verifica la firma X-Hub-Signature-256 del webhook (HMAC-SHA256 del cuerpo
 * crudo con el app secret). Si no hay app secret configurado, no bloquea
 * (permite pruebas iniciales), pero se recomienda configurarlo.
 */
export function verificarFirmaMeta(rawBody: string, signature: string | null): boolean {
  const c = whatsappConfig();
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
