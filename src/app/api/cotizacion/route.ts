import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import { createAnonClient, createAdminClient } from '@/lib/supabase/server';
import { CotizacionPDF, type CotizacionData, type LineItem } from '@/lib/pdf/CotizacionPDF';

export const runtime = 'nodejs';
export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Build the PDF buffer for an already-inserted cotización. Looks up the
 * asesor profile and product specs, then renders with @react-pdf/renderer.
 */
async function buildCotizacionPDF(cotizacionId: string): Promise<{ buffer: Buffer; numero: string } | null> {
  try {
    const client = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : createAnonClient();
    const { data: cot } = await client
      .from('parmonca_cotizaciones')
      .select('id, numero, nombre, empresa, email, telefono, pais, ciudad, mensaje, modalidad, periodo, producto, accesorios, cantidad, subtotal, impuesto, total, asignado_a, created_at')
      .eq('id', cotizacionId)
      .maybeSingle();
    if (!cot) return null;

    let asesor: { nombre?: string | null; email?: string | null } | null = null;
    if (cot.asignado_a) {
      const { data: p } = await client
        .from('parmonca_profiles')
        .select('nombre, email')
        .eq('id', cot.asignado_a)
        .maybeSingle();
      if (p) asesor = { nombre: p.nombre, email: p.email };
    }

    // Construir line items (multi-ítem desde accesorios o legacy single-producto)
    const productoJson = cot.producto as { modelo?: string; marca?: string; categoria?: string; precio?: number; imagen?: string } | null;
    const accesoriosRaw = (cot.accesorios as Array<Record<string, unknown>>) || [];
    const lineItemsRaw = accesoriosRaw.filter(a => a.modelo || a.tipo);

    let items: LineItem[] = [];
    if (lineItemsRaw.length > 0) {
      items = lineItemsRaw.map(a => ({
        tipo: (a.tipo as 'producto' | 'repuesto') || 'producto',
        modelo: String(a.modelo || ''),
        marca: (a.marca as string) || null,
        categoria: (a.categoria as string) || null,
        cantidad: Number(a.cantidad) || 1,
        precio_unitario: Number(a.precio_unitario) || 0,
        precio_total: Number(a.precio_total) || 0,
        imagen: (a.imagen as string) || null,
      }));
    } else if (productoJson?.modelo) {
      items = [{
        tipo: 'producto',
        modelo: productoJson.modelo,
        marca: productoJson.marca || null,
        categoria: productoJson.categoria || null,
        cantidad: cot.cantidad ?? 1,
        precio_unitario: Number(productoJson.precio) || 0,
        precio_total: (Number(productoJson.precio) || 0) * (cot.cantidad ?? 1),
        imagen: productoJson.imagen || null,
      }];
    }

    // Hidrata cada item de tipo 'producto' con sus specs
    if (items.length > 0) {
      const modelos = items.filter(i => i.tipo !== 'repuesto').map(i => i.modelo).filter(Boolean);
      if (modelos.length > 0) {
        const { data: prods } = await client
          .from('parmonca_productos')
          .select('modelo, capacidad_kg, ancho_pasillo_mm, longitud_sin_horquillas_mm, ancho_total_mm, altura_chasis_mm, motor, descripcion')
          .in('modelo', modelos);
        const byModelo = new Map((prods || []).map(p => [p.modelo, p]));
        items = items.map(it => {
          if (it.tipo === 'repuesto') return it;
          const sp = byModelo.get(it.modelo);
          return sp ? { ...it, specs: sp } : it;
        });
      }
    }

    const specs: CotizacionData['specs'] = items[0]?.specs || {};

    const created = new Date(cot.created_at);
    const validaHasta = new Date(created.getTime() + 30 * 24 * 3600 * 1000);
    const data: CotizacionData = {
      numero: cot.numero,
      created_at: cot.created_at,
      validaHasta: validaHasta.toISOString(),
      cliente: {
        nombre: cot.nombre, empresa: cot.empresa, telefono: cot.telefono,
        email: cot.email, pais: cot.pais, ciudad: cot.ciudad,
      },
      asesor,
      modalidad: cot.modalidad,
      periodo: cot.periodo,
      cantidad: cot.cantidad ?? 1,
      subtotal: Number(cot.subtotal) || 0,
      impuesto: Number(cot.impuesto) || 0,
      total: Number(cot.total) || 0,
      producto: productoJson,
      specs,
      items,
      mensaje: cot.mensaje,
    };
    // CotizacionPDF returns <Document>; cast tells the typed renderToBuffer signature.
    const element = React.createElement(CotizacionPDF, { data }) as unknown as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(element);
    return { buffer, numero: cot.numero };
  } catch (err) {
    console.error('PDF build failed:', err);
    return null;
  }
}

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
  // Respuestas del asesor virtual (desde el wizard)
  ambiente?: string | null;
  frecuencia?: string | null;
  plazo?: string | null;
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
  // Acepta dos formas (compat hacia atrás):
  //   1) Legacy "accesorios" del wizard antiguo: {nombre, precio}
  //   2) Line items multi-producto del nuevo flow de carrito:
  //      {tipo, modelo, marca, categoria, cantidad, precio_unitario,
  //       precio_total, imagen}
  // El handler de PDF (buildCotizacionPDF) ya detecta automáticamente
  // cuál es cuál usando `a.modelo || a.tipo`.
  accesorios: Array<{
    nombre?: string;
    precio?: number;
    tipo?: 'producto' | 'repuesto';
    modelo?: string;
    marca?: string | null;
    categoria?: string | null;
    cantidad?: number;
    precio_unitario?: number;
    precio_total?: number;
    imagen?: string | null;
  }>;
  cantidad: number;
  subtotal: number;
  impuesto: number;
  total: number;
  // Progressive profiling: link this quote to the anonymous visitor session
  device_id?: string | null;
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

    // Detectamos si es un array de line items (carrito multi-equipo) o
    // del legacy {nombre, precio}. Los line items tienen `modelo` o `tipo`.
    const esLineItems = body.accesorios.some(a => !!a.modelo || !!a.tipo);

    const accesoriosHTML = (!esLineItems && body.accesorios.length > 0)
      ? body.accesorios.map(a => `
        <tr>
          <td style="padding:8px 16px;border-bottom:1px solid #1a1a1d;color:#a1a1aa;font-size:13px;">${a.nombre || ''}</td>
          <td style="padding:8px 16px;border-bottom:1px solid #1a1a1d;color:#e4e4e7;font-size:13px;text-align:right;font-family:'JetBrains Mono',monospace;">$${(a.precio || 0).toLocaleString()}</td>
        </tr>
      `).join('')
      : '';

    // Tabla multi-equipo cuando viene del carrito del landing.
    const lineItemsHTML = esLineItems ? `
      <tr>
        <td style="padding:0 32px 24px;background:#0e0e11;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0 0 12px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Equipos solicitados (${body.accesorios.length})</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#16161a;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
            ${body.accesorios.map(it => `
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#e4e4e7;font-size:13px;">
                  ${it.marca ? `<span style="display:block;font-size:9px;color:#E8821C;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">${it.marca}</span>` : ''}
                  <span style="font-weight:600;color:#fff;">${it.modelo || ''}</span>
                  <span style="display:block;font-size:11px;color:#71717a;margin-top:2px;">${it.tipo === 'repuesto' ? 'Repuesto' : 'Equipo'}${it.categoria ? ` &middot; ${it.categoria}` : ''}</span>
                </td>
                <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#a1a1aa;font-size:12px;text-align:center;width:60px;font-family:'JetBrains Mono',monospace;">${it.cantidad || 1}</td>
                <td style="padding:12px 16px;border-bottom:1px solid #1a1a1d;color:#e4e4e7;font-size:13px;text-align:right;font-family:'JetBrains Mono',monospace;width:110px;">${(it.precio_total || 0) > 0 ? `$${(it.precio_total || 0).toLocaleString()}` : '<span style="color:#71717a;font-family:Outfit,sans-serif;font-size:11px;">A cotizar</span>'}</td>
              </tr>
            `).join('')}
          </table>
          <p style="margin:10px 0 0;font-size:11px;color:#71717a;line-height:1.5;">
            Esta es una <strong style="color:#E8821C;">solicitud de cotización</strong>, no una compra. Un asesor confirmará precios vigentes, disponibilidad y condiciones.
          </p>
        </td>
      </tr>
    ` : '';

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

    // Número provisional para el correo; se reemplaza con el real tras el insert.
    let displayNumero = 'pendiente';

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
                Tu cotización <strong style="color:#E8821C;font-family:'JetBrains Mono',monospace;">___NUMERO___</strong> está lista.
                Adjunto a este correo encontrarás el documento PDF con todos los detalles, características técnicas, condiciones comerciales y garantía.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-top:16px;background:#16161a;border:1px solid rgba(232,130,28,0.25);border-radius:10px;">
                <tr>
                  <td style="padding:12px 14px;">
                    <p style="margin:0;font-size:11px;color:#E8821C;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">📎 Cotización adjunta</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#e4e4e7;font-family:'JetBrains Mono',monospace;">___NUMERO___-PARMONCA.pdf</p>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:13px;color:#a1a1aa;line-height:1.55;">
                A continuación un resumen rápido y abajo los datos del seguimiento:
              </p>
            </td>
          </tr>

          ${body.producto && !esLineItems ? `
          <!-- Product (legacy single-equipo) -->
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

          ${lineItemsHTML}

          ${(!esLineItems && body.accesorios.length > 0) ? `
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
        p_device_id: body.device_id || null,
        p_ambiente: body.ambiente || null,
        p_frecuencia: body.frecuencia || null,
        p_plazo: body.plazo || null,
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

    displayNumero = cotizacionNumero || 'pendiente';

    // 2) Generar PDF de la cotización (sólo si la cotización se guardó OK)
    let pdfAttachment: { filename: string; content: string } | null = null;
    if (cotizacionId) {
      const pdf = await buildCotizacionPDF(cotizacionId);
      if (pdf) {
        pdfAttachment = {
          filename: `${pdf.numero}-PARMONCA.pdf`,
          content: pdf.buffer.toString('base64'),
        };
      }
    }
    const attachments = pdfAttachment ? [pdfAttachment] : undefined;

    const productoLabel = body.producto ? ` ${body.producto.marca} ${body.producto.modelo}` : '';

    // Reemplaza el placeholder con el número real de la cotización
    const emailHTMLFinal = emailHTML.replaceAll('___NUMERO___', displayNumero);

    // 3) Send email to the customer (using Resend test sender while custom domain is pending)
    const customerEmail = await resend.emails.send({
      from: 'PARMONCA <onboarding@resend.dev>',
      to: ['malave.acacio@gmail.com'], // TODO: change to [body.email] after adding custom domain in Resend
      subject: `Cotización ${displayNumero}${productoLabel} — PARMONCA`,
      html: emailHTMLFinal,
      attachments,
    });

    // 4) Notify admin
    await resend.emails.send({
      from: 'PARMONCA CRM <onboarding@resend.dev>',
      to: ['malave.acacio@gmail.com'],
      subject: `[${modalidadLabel}] ${displayNumero} — ${body.nombre}${productoLabel} ($${body.total.toLocaleString()})`,
      html: emailHTMLFinal,
      attachments,
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
