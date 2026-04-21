import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAnonClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send Slack notification when SLACK_WEBHOOK_URL is configured.
 * Silent failure — we never block the user flow on notifications.
 */
async function notifySlack(body: CotizacionRequest, numero: string) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    const modalidad = body.modalidad === 'alquiler' ? 'Alquiler' : 'Compra';
    const producto = body.producto ? `${body.producto.marca} ${body.producto.modelo}` : 'Sin producto';
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `*Nueva cotización ${numero}* (${modalidad})\n*Cliente:* ${body.nombre}${body.empresa ? ` — ${body.empresa}` : ''}\n*Email:* ${body.email}\n*Producto:* ${producto}\n*Total:* $${body.total.toLocaleString()}`,
      }),
    });
  } catch (err) {
    console.error('Slack notify error:', err);
  }
}

interface CotizacionRequest {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  pais: string;
  ciudad: string;
  mensaje: string;
  // New context fields
  industria: string;
  tamanoFlota: string;
  presupuesto: string;
  financiamiento: string;
  ruc: string;
  // Modality
  modalidad: 'venta' | 'alquiler';
  periodo: string | null;
  producto: {
    modelo: string;
    marca: string;
    categoria: string;
    precio: number;
    imagen: string;
  } | null;
  accesorios: {
    nombre: string;
    precio: number;
  }[];
  cantidad: number;
  subtotal: number;
  impuesto: number;
  total: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CotizacionRequest = await request.json();

    // Validate required fields
    if (!body.nombre || !body.email || !body.telefono) {
      return NextResponse.json(
        { error: 'Nombre, email y teléfono son obligatorios' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const modalidadLabel = body.modalidad === 'alquiler'
      ? `Alquiler${body.periodo ? ` (${body.periodo})` : ''}`
      : 'Compra';

    const accesoriosHTML = body.accesorios.length > 0
      ? body.accesorios.map(a => `
        <tr>
          <td style="padding:8px 16px;border-bottom:1px solid #1a1a1d;color:#a1a1aa;font-size:13px;">${a.nombre}</td>
          <td style="padding:8px 16px;border-bottom:1px solid #1a1a1d;color:#e4e4e7;font-size:13px;text-align:right;font-family:'JetBrains Mono',monospace;">$${a.precio.toLocaleString()}</td>
        </tr>
      `).join('')
      : '';

    const contextRows = [
      body.industria && { label: 'Industria', value: body.industria },
      body.tamanoFlota && { label: 'Flota Actual', value: body.tamanoFlota },
      body.presupuesto && { label: 'Presupuesto', value: body.presupuesto },
      body.financiamiento && { label: 'Financiamiento', value: body.financiamiento === 'si' ? 'Sí, necesita' : 'No necesita' },
      body.ruc && { label: 'RUC/NIT', value: body.ruc },
      body.ciudad && { label: 'Ciudad', value: body.ciudad },
    ].filter(Boolean) as { label: string; value: string }[];

    const contextHTML = contextRows.length > 0 ? `
      <tr>
        <td style="padding:0 32px 24px;background:#0e0e11;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0 0 12px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Contexto de la Operación</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#16161a;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
            ${contextRows.map(r => `
              <tr>
                <td style="padding:10px 16px;border-bottom:1px solid #1a1a1d;color:#71717a;font-size:12px;width:120px;">${r.label}</td>
                <td style="padding:10px 16px;border-bottom:1px solid #1a1a1d;color:#e4e4e7;font-size:13px;">${r.value}</td>
              </tr>
            `).join('')}
          </table>
        </td>
      </tr>
    ` : '';

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#08080A;font-family:'Outfit',system-ui,sans-serif;color:#f0f0f2;">
  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#08080A;">
    <tr>
      <td align="center" style="padding:40px 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:24px 32px;background:#0e0e11;border:1px solid rgba(255,255,255,0.06);border-radius:16px 16px 0 0;">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Syne',system-ui;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">PARMONCA</span>
                    <br>
                    <span style="font-size:11px;color:#71717a;letter-spacing:0.1em;text-transform:uppercase;">Cotizacion de Maquinaria Industrial</span>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:6px 16px;background:${body.modalidad === 'alquiler' ? '#3B82F6' : 'linear-gradient(135deg,#E8821C,#C96A10)'};color:#fff;font-size:12px;font-weight:600;border-radius:8px;">${modalidadLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px;background:#0e0e11;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:20px;font-weight:700;color:#fff;font-family:'Syne',system-ui;">Hola ${body.nombre},</p>
              <p style="margin:8px 0 0;font-size:14px;color:#71717a;line-height:1.6;">
                Gracias por tu interes en PARMONCA. Hemos recibido tu solicitud de ${body.modalidad === 'alquiler' ? 'alquiler' : 'cotizacion'} y nuestro equipo la esta revisando. A continuacion el detalle:
              </p>
            </td>
          </tr>

          ${body.producto ? `
          <!-- Product -->
          <tr>
            <td style="padding:0 32px 24px;background:#0e0e11;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#16161a;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%">
                      <tr>
                        <td>
                          <span style="font-size:10px;color:#E8821C;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">${body.producto.marca}</span>
                          <br>
                          <span style="font-family:'Syne',system-ui;font-size:24px;font-weight:700;color:#fff;">${body.producto.modelo}</span>
                          <br>
                          <span style="font-size:12px;color:#71717a;">${body.producto.categoria} · ${modalidadLabel}</span>
                        </td>
                        <td align="right" valign="top">
                          <span style="font-size:10px;color:#52525b;">Cantidad</span>
                          <br>
                          <span style="font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:#fff;">${body.cantidad} und.</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          ${body.accesorios.length > 0 ? `
          <!-- Accessories -->
          <tr>
            <td style="padding:0 32px 24px;background:#0e0e11;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0 0 12px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Accesorios Seleccionados (${body.accesorios.length})</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#16161a;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                ${accesoriosHTML}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Totals -->
          <tr>
            <td style="padding:0 32px 24px;background:#0e0e11;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#16161a;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#71717a;font-size:13px;">Subtotal${body.modalidad === 'alquiler' && body.periodo ? ` (${body.periodo})` : ''}</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#e4e4e7;font-size:13px;text-align:right;font-family:'JetBrains Mono',monospace;">$${body.subtotal.toLocaleString()}</td>
                </tr>
                ${body.modalidad === 'venta' ? `
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#71717a;font-size:13px;">Impuesto (7%)</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#e4e4e7;font-size:13px;text-align:right;font-family:'JetBrains Mono',monospace;">$${body.impuesto.toLocaleString()}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:16px;color:#fff;font-size:16px;font-weight:700;">Total ${body.modalidad === 'alquiler' ? `por ${body.periodo}` : 'Estimado'}</td>
                  <td style="padding:16px;color:#E8821C;font-size:22px;font-weight:700;text-align:right;font-family:'JetBrains Mono',monospace;">$${body.total.toLocaleString()}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${contextHTML}

          <!-- Contact Info -->
          <tr>
            <td style="padding:0 32px 24px;background:#0e0e11;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0 0 12px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Datos de Contacto</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#16161a;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#71717a;font-size:12px;width:100px;">Nombre</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#e4e4e7;font-size:13px;">${body.nombre}</td>
                </tr>
                ${body.empresa ? `<tr><td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#71717a;font-size:12px;">Empresa</td><td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#e4e4e7;font-size:13px;">${body.empresa}</td></tr>` : ''}
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#71717a;font-size:12px;">Email</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#e4e4e7;font-size:13px;">${body.email}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#71717a;font-size:12px;">Telefono</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#e4e4e7;font-size:13px;">${body.telefono}</td>
                </tr>
                ${body.pais ? `<tr><td style="padding:12px 16px;color:#71717a;font-size:12px;">Pais</td><td style="padding:12px 16px;color:#e4e4e7;font-size:13px;">${body.pais}${body.ciudad ? ` - ${body.ciudad}` : ''}</td></tr>` : ''}
              </table>
              ${body.mensaje ? `<p style="margin:12px 0 0;padding:12px 16px;background:#16161a;border:1px solid rgba(255,255,255,0.06);border-radius:12px;color:#a1a1aa;font-size:13px;line-height:1.5;"><span style="color:#71717a;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;display:block;margin-bottom:4px;">Mensaje</span>${body.mensaje}</p>` : ''}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 32px;background:#0e0e11;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:13px;color:#71717a;line-height:1.6;">
                Un asesor comercial de PARMONCA te contactara en las proximas <strong style="color:#E8821C;">2 horas habiles</strong> para darte seguimiento personalizado, resolver tus dudas y preparar una propuesta formal.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#0a0a0c;border:1px solid rgba(255,255,255,0.04);border-radius:0 0 16px 16px;">
              <table width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Syne',system-ui;font-size:14px;font-weight:700;color:#3f3f46;">PARMONCA</span>
                    <br>
                    <span style="font-size:10px;color:#3f3f46;">Partes y Montacargas</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;color:#3f3f46;">Panama | Costa Rica | Venezuela | Guatemala</span>
                    <br>
                    <span style="font-size:10px;color:#3f3f46;">Honduras | Nicaragua | Haiti</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // 1) Persist the quote in Supabase via RPC (SECURITY DEFINER bypasses the
    //    SELECT RLS block that affects return=representation on anon inserts).
    let cotizacionId: string | null = null;
    let cotizacionNumero: string | null = null;
    try {
      const supabase = createAnonClient();
      const { data: inserted, error: dbError } = await supabase.rpc('parmonca_insert_cotizacion', {
        p_nombre: body.nombre,
        p_empresa: body.empresa || null,
        p_email: body.email,
        p_telefono: body.telefono,
        p_pais: body.pais || null,
        p_ciudad: body.ciudad || null,
        p_mensaje: body.mensaje || null,
        p_industria: body.industria || null,
        p_tamano_flota: body.tamanoFlota || null,
        p_presupuesto: body.presupuesto || null,
        p_financiamiento: body.financiamiento || null,
        p_ruc: body.ruc || null,
        p_modalidad: body.modalidad,
        p_periodo: body.periodo,
        p_producto: body.producto,
        p_accesorios: body.accesorios,
        p_cantidad: body.cantidad,
        p_subtotal: body.subtotal,
        p_impuesto: body.impuesto,
        p_total: body.total,
        p_origen: 'landing',
      });

      if (dbError) {
        console.error('DB insert error', JSON.stringify({ code: dbError.code, message: dbError.message, details: dbError.details, hint: dbError.hint }));
      } else if (inserted && inserted.length > 0) {
        cotizacionId = inserted[0].id;
        cotizacionNumero = inserted[0].numero;
      }
    } catch (err) {
      console.error('Supabase error:', err);
      // Do not block the user — we still send emails
    }

    const displayNumero = cotizacionNumero || 'pendiente';

    // 2) Send email to the customer (using Resend test sender while custom domain is pending)
    const customerEmail = await resend.emails.send({
      from: 'PARMONCA <onboarding@resend.dev>',
      to: ['malave.acacio@gmail.com'], // TODO: change to [body.email] after adding custom domain in Resend
      subject: `Tu ${body.modalidad === 'alquiler' ? 'cotizacion de alquiler' : 'cotizacion'} PARMONCA${body.producto ? ` - ${body.producto.marca} ${body.producto.modelo}` : ''} esta lista`,
      html: emailHTML,
    });

    // 3) Notify admin
    await resend.emails.send({
      from: 'PARMONCA CRM <onboarding@resend.dev>',
      to: ['malave.acacio@gmail.com'],
      subject: `[${modalidadLabel}] ${displayNumero} — ${body.nombre}${body.producto ? ` / ${body.producto.marca} ${body.producto.modelo}` : ''} ($${body.total.toLocaleString()})`,
      html: emailHTML,
    });

    // 4) Notify Slack (if configured) — non-blocking
    if (cotizacionNumero) {
      notifySlack(body, cotizacionNumero).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      id: customerEmail.data?.id,
      cotizacionId,
      numero: cotizacionNumero,
    });
  } catch (error) {
    console.error('Cotizacion error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la cotización' },
      { status: 500 }
    );
  }
}
