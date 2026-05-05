/**
 * Wrapper unificado para envío de correo transaccional desde el CRM.
 *
 * Motor: Microsoft 365 SMTP (smtp.office365.com:587, STARTTLS).
 * Autenticación: usuario corporativo + App Password (16 caracteres, generado
 * desde account.microsoft.com con MFA activo).
 *
 * Pasamos por Microsoft en vez de Resend porque:
 *   - El dominio parmonca.com ya está autenticado en Microsoft (DKIM
 *     selector1/selector2, SPF de Outlook), así que los correos salen con
 *     reputación corporativa real desde @parmonca.com sin tocar DNS extra.
 *   - No depende de propagación DNS en Network Solutions.
 *   - Mismo HTML / mismo PDF — sólo cambia la línea de envío.
 *
 * Si las env vars no están configuradas, sendMail() lanza un error claro;
 * el caller decide si bloquear o dejar pasar (la cotización debería
 * persistirse igual aunque el email falle).
 */

import nodemailer from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';

// ────────────────────────────────────────────────────────────────────────────
// Configuración (lee env vars una sola vez al primer envío)
// ────────────────────────────────────────────────────────────────────────────

const SMTP_HOST = 'smtp.office365.com';
const SMTP_PORT = 587;

function getCredentials() {
  const user = process.env.M365_SMTP_USER;
  const pass = process.env.M365_SMTP_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      'Microsoft 365 SMTP no configurado: faltan M365_SMTP_USER y/o ' +
      'M365_SMTP_APP_PASSWORD en variables de entorno. Ver docs/email.md.'
    );
  }
  return { user, pass };
}

// Reutilizamos el mismo transporter entre invocaciones para evitar abrir
// una conexión TLS nueva cada vez (relevante en serverless con muchas
// invocaciones consecutivas).
let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;
  const { user, pass } = getCredentials();
  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,        // STARTTLS, no TLS desde el inicio
    requireTLS: true,     // exigimos upgrade a TLS antes de auth
    auth: { user, pass },
    // Microsoft a veces es lento bajo carga — bumpeo timeouts para evitar
    // falsos negativos en serverless.
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  return cachedTransporter;
}

// ────────────────────────────────────────────────────────────────────────────
// API pública
// ────────────────────────────────────────────────────────────────────────────

export interface MailAttachment {
  filename: string;
  /** Buffer es lo natural en Node; si nos llega base64 string lo
   *  convertimos al pasar al transporter. */
  content: Buffer | string;
  /** Si content es string base64, indicarlo aquí. */
  encoding?: 'base64';
}

export interface SendMailOptions {
  /** "from" — Microsoft fuerza que coincida con M365_SMTP_USER (o que
   *  el usuario tenga permiso "send-as" sobre la dirección). Por seguridad
   *  ignoramos lo que pase el caller y usamos siempre M365_SMTP_USER, con
   *  display name configurable vía M365_FROM_NAME. */
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

/**
 * Envía un correo a través de Microsoft 365 SMTP. Lanza si las credenciales
 * no están o si SMTP rechaza el envío. El caller debe envolver en try/catch
 * y decidir si bloquear el flujo o sólo loggear.
 */
export async function sendMail(opts: SendMailOptions): Promise<SendMailResult> {
  const { user } = getCredentials();
  const transporter = getTransporter();

  const fromName = opts.fromName || process.env.M365_FROM_NAME || 'PARMONCA';
  // Forzamos siempre el FROM al usuario autenticado (Microsoft rechaza
  // cualquier otro a menos que se configure send-as a nivel Exchange).
  const from = `${fromName} <${user}>`;

  // Convertimos nuestros attachments al shape de nodemailer.
  const attachments: Attachment[] | undefined = opts.attachments?.map(a => ({
    filename: a.filename,
    content: a.content,
    encoding: a.encoding,
  }));

  const info = await transporter.sendMail({
    from,
    to: opts.to,
    cc: opts.cc,
    bcc: opts.bcc,
    replyTo: opts.replyTo,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    attachments,
  });

  return {
    messageId: info.messageId,
    accepted: (info.accepted || []).map(String),
    rejected: (info.rejected || []).map(String),
  };
}

/**
 * Verifica que las credenciales SMTP funcionan (handshake + login). Útil
 * para health-checks o un endpoint admin tipo /api/smtp/verify.
 */
export async function verifySmtp(): Promise<true> {
  const transporter = getTransporter();
  await transporter.verify();
  return true;
}
