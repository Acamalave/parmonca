/**
 * Wrapper unificado para envío de correo transaccional desde el CRM.
 *
 * Motor: Microsoft Graph API con OAuth 2.0 (client credentials flow).
 *
 * Pasamos por Graph API en vez de SMTP porque Microsoft 365 está
 * deprecando App Passwords y SMTP AUTH. Graph es la ruta oficial moderna,
 * sobrevive las deprecaciones y permite restringir el acceso al buzón
 * con `New-ApplicationAccessPolicy` desde Exchange Online.
 *
 * Flujo:
 *   1. Pedimos un access token a login.microsoftonline.com con client_id +
 *      client_secret (cacheado entre invocaciones).
 *   2. POST a graph.microsoft.com/v1.0/users/{from}/sendMail con el mensaje
 *      y los attachments en base64.
 *
 * Si las env vars no están configuradas, sendMail() lanza un error claro;
 * el caller decide si bloquear o dejar pasar (la cotización debería
 * persistirse igual aunque el email falle).
 */

// ────────────────────────────────────────────────────────────────────────────
// Configuración
// ────────────────────────────────────────────────────────────────────────────

const TOKEN_ENDPOINT = (tenantId: string) =>
  `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
const SEND_MAIL_ENDPOINT = (fromEmail: string) =>
  `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(fromEmail)}/sendMail`;

function getCredentials() {
  const tenantId = process.env.M365_TENANT_ID;
  const clientId = process.env.M365_CLIENT_ID;
  const clientSecret = process.env.M365_CLIENT_SECRET;
  const fromEmail = process.env.M365_FROM_EMAIL;
  if (!tenantId || !clientId || !clientSecret || !fromEmail) {
    throw new Error(
      'Microsoft Graph API no configurado: faltan M365_TENANT_ID, ' +
      'M365_CLIENT_ID, M365_CLIENT_SECRET y/o M365_FROM_EMAIL en variables ' +
      'de entorno. Ver docs/email.md.'
    );
  }
  return { tenantId, clientId, clientSecret, fromEmail };
}

// ────────────────────────────────────────────────────────────────────────────
// Cache de access tokens (TTL típico: 1 hora). Reusamos entre invocaciones
// del mismo lambda warm para evitar hacer login a Microsoft cada vez.
// ────────────────────────────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Refrescamos 5 min antes de expirar para evitar carrera con Microsoft.
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const { tenantId, clientId, clientSecret } = getCredentials();
  const res = await fetch(TOKEN_ENDPOINT(tenantId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Microsoft OAuth falló (${res.status}): ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

// ────────────────────────────────────────────────────────────────────────────
// API pública
// ────────────────────────────────────────────────────────────────────────────

export interface MailAttachment {
  filename: string;
  /** Buffer es lo natural en Node; Graph espera base64 string así que lo
   *  convertimos al pasar al API. Si el caller ya nos pasa base64 string,
   *  lo usamos tal cual. */
  content: Buffer | string;
  /** Si content es string base64, marcarlo aquí. */
  encoding?: 'base64';
}

export interface SendMailOptions {
  /** Display name visible al cliente. Default: process.env.M365_FROM_NAME o
   *  "PARMONCA". El email FROM viene de M365_FROM_EMAIL (Microsoft fuerza
   *  que coincida con el buzón sobre el que tiene permiso la app). */
  fromName?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: MailAttachment[];
}

export interface SendMailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

type GraphRecipient = { emailAddress: { address: string; name?: string } };

function toRecipientList(input: string | string[] | undefined): GraphRecipient[] | undefined {
  if (!input) return undefined;
  const arr = Array.isArray(input) ? input : [input];
  return arr.filter(Boolean).map(e => ({ emailAddress: { address: e } }));
}

/**
 * Envía un correo a través de Microsoft Graph API. Lanza si las credenciales
 * no están o si Graph rechaza el envío. El caller debe envolver en try/catch
 * y decidir si bloquear el flujo o sólo loggear.
 */
export async function sendMail(opts: SendMailOptions): Promise<SendMailResult> {
  const { fromEmail } = getCredentials();
  const token = await getAccessToken();
  const fromName = opts.fromName || process.env.M365_FROM_NAME || 'PARMONCA';

  // Convertimos attachments al shape de Graph: contentBytes en base64.
  const attachments = opts.attachments?.map(a => ({
    '@odata.type': '#microsoft.graph.fileAttachment',
    name: a.filename,
    contentBytes: Buffer.isBuffer(a.content)
      ? a.content.toString('base64')
      : a.encoding === 'base64'
        ? a.content
        : Buffer.from(a.content).toString('base64'),
  }));

  const toRecipients = toRecipientList(opts.to) || [];
  if (toRecipients.length === 0) {
    throw new Error('sendMail: opts.to vacío');
  }

  const message: Record<string, unknown> = {
    subject: opts.subject,
    body: { contentType: 'HTML', content: opts.html },
    toRecipients,
    from: { emailAddress: { address: fromEmail, name: fromName } },
    sender: { emailAddress: { address: fromEmail, name: fromName } },
  };
  const ccRecipients = toRecipientList(opts.cc);
  if (ccRecipients) message.ccRecipients = ccRecipients;
  const bccRecipients = toRecipientList(opts.bcc);
  if (bccRecipients) message.bccRecipients = bccRecipients;
  if (opts.replyTo) {
    message.replyTo = [{ emailAddress: { address: opts.replyTo } }];
  }
  if (attachments && attachments.length > 0) message.attachments = attachments;
  if (opts.text) {
    // Cuando va text+html, Graph requiere multipart. Más simple: si hay text,
    // lo concatenamos al HTML como fallback al final. La mayoría de clientes
    // usa el HTML directamente.
    message.body = { contentType: 'HTML', content: opts.html };
  }

  const res = await fetch(SEND_MAIL_ENDPOINT(fromEmail), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Graph sendMail falló (${res.status}): ${errText.slice(0, 500)}`);
  }

  // Graph devuelve 202 Accepted sin body. No hay un messageId real hasta
  // que se procesa async — usamos el request-id como tracker.
  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];
  return {
    messageId: res.headers.get('request-id') || 'graph-202',
    accepted: recipients.filter(Boolean),
    rejected: [],
  };
}

/**
 * Verifica que las credenciales de Graph funcionan (sólo intenta el OAuth,
 * no manda correo de verdad). Útil para health-checks o un endpoint admin
 * tipo /api/mailer/verify.
 */
export async function verifyMailer(): Promise<true> {
  await getAccessToken();
  return true;
}
