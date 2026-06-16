import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createAnonClient, createAdminClient } from '@/lib/supabase/server';
import { CotizacionPDF, type CotizacionData, type LineItem } from '@/lib/pdf/CotizacionPDF';
import { sendMail } from '@/lib/mailer';
import { formatCurrency, monedaDePais } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
    const { moneda, locale } = monedaDePais(body.pais);
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `*Nueva cotización ${numero}* (${modalidad})\n*Cliente:* ${body.nombre}${body.empresa ? ` — ${body.empresa}` : ''}\n*Email:* ${body.email}\n*Producto:* ${producto}\n*Total:* ${formatCurrency(body.total, moneda, locale)}`,
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
    moneda?: 'USD' | 'CRC';
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

    // Sanitización numérica defensiva: evitamos persistir totales
    // negativos, NaN o cantidades absurdas que distorsionen reportes.
    const safeNum = (v: unknown, min = 0) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= min ? n : min;
    };
    body.subtotal = safeNum(body.subtotal);
    body.impuesto = safeNum(body.impuesto);
    body.total = safeNum(body.total);
    body.cantidad = Math.max(1, Math.floor(safeNum(body.cantidad, 1)));

    // Sanitiza cada line item (precios y cantidades) para que la BD
    // y el PDF no se ensucien con valores raros.
    if (Array.isArray(body.accesorios)) {
      body.accesorios = body.accesorios.map(a => ({
        ...a,
        cantidad: a.cantidad !== undefined ? Math.max(1, Math.floor(safeNum(a.cantidad, 1))) : a.cantidad,
        precio: a.precio !== undefined ? safeNum(a.precio) : a.precio,
        precio_unitario: a.precio_unitario !== undefined ? safeNum(a.precio_unitario) : a.precio_unitario,
        precio_total: a.precio_total !== undefined ? safeNum(a.precio_total) : a.precio_total,
      }));
    }

    const modalidadLabel = body.modalidad === 'alquiler'
      ? `Alquiler${body.periodo ? ` (${body.periodo})` : ''}`
      : 'Compra';

    // Detectamos si es un array de line items (carrito multi-equipo) o
    // del legacy {nombre, precio}. Los line items tienen `modelo` o `tipo`.
    const esLineItems = body.accesorios.some(a => !!a.modelo || !!a.tipo);

    // Paleta alineada con el PDF (CotizacionPDF.tsx). Modo claro,
    // primario naranja PARMONCA. Los emails deben ser inline-only para
    // que Gmail/Outlook lo respeten.
    const COLORS = {
      primary: '#E8821C',
      primaryDark: '#C96A10',
      text: '#1F2937',
      textMuted: '#6B7280',
      border: '#E5E7EB',
      bg: '#FAFAFA',
      bgWhite: '#FFFFFF',
      bgSoft: '#F9FAFB',
    };

    // Moneda derivada del país de la cotización (PA→USD/ITBMS, CR→CRC/IVA).
    const { moneda, locale, impuesto: impuestoLabel } = monedaDePais(body.pais);
    const fmtMoney = (n: number) => formatCurrency(Number(n) || 0, moneda, locale);

    const accesoriosHTML = (!esLineItems && body.accesorios.length > 0)
      ? body.accesorios.map(a => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid ${COLORS.border};color:${COLORS.text};font-size:13px;">${a.nombre || ''}</td>
          <td style="padding:10px 14px;border-bottom:1px solid ${COLORS.border};color:${COLORS.text};font-size:13px;text-align:right;font-weight:600;">${fmtMoney(a.precio || 0)}</td>
        </tr>
      `).join('')
      : '';

    // Tabla multi-equipo cuando viene del carrito del landing.
    const lineItemsHTML = esLineItems ? `
      <tr>
        <td style="padding:0 32px 20px;">
          <p style="margin:0 0 10px;font-size:11px;color:${COLORS.primary};text-transform:uppercase;letter-spacing:1px;font-weight:700;border-bottom:1px solid ${COLORS.primary};padding-bottom:4px;">Equipos solicitados (${body.accesorios.length})</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr style="background:${COLORS.primary};">
                <th align="left" style="padding:8px 12px;color:#FFFFFF;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Equipo</th>
                <th align="center" style="padding:8px 12px;color:#FFFFFF;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;width:60px;">Cant</th>
                <th align="right" style="padding:8px 12px;color:#FFFFFF;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;width:110px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${body.accesorios.map(it => `
                <tr>
                  <td style="padding:12px;border-bottom:1px solid ${COLORS.border};color:${COLORS.text};font-size:13px;">
                    ${it.marca ? `<div style="font-size:9px;color:${COLORS.primary};font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">${it.marca}</div>` : ''}
                    <div style="font-weight:700;color:${COLORS.text};font-size:14px;">${it.modelo || ''}</div>
                    <div style="font-size:11px;color:${COLORS.textMuted};margin-top:2px;">${it.tipo === 'repuesto' ? 'Repuesto' : 'Equipo'}${it.categoria ? ` &middot; ${it.categoria}` : ''}</div>
                  </td>
                  <td align="center" style="padding:12px;border-bottom:1px solid ${COLORS.border};color:${COLORS.text};font-size:13px;font-weight:600;">${it.cantidad || 1}</td>
                  <td align="right" style="padding:12px;border-bottom:1px solid ${COLORS.border};color:${COLORS.text};font-size:13px;font-weight:700;">${(it.precio_total || 0) > 0 ? fmtMoney(it.precio_total || 0) : `<span style="color:${COLORS.textMuted};font-weight:400;font-size:11px;">A cotizar</span>`}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="margin:10px 0 0;font-size:11px;color:${COLORS.textMuted};line-height:1.5;">
            Esta es una <strong style="color:${COLORS.primary};">solicitud de cotización</strong>, no una compra. Un asesor confirmará precios vigentes, disponibilidad y condiciones.
          </p>
        </td>
      </tr>
    ` : '';

    const contextRows = [
      body.industria && { label: 'Industria', value: body.industria },
      body.tamanoFlota && { label: 'Flota actual', value: body.tamanoFlota },
      body.presupuesto && { label: 'Presupuesto', value: body.presupuesto },
      body.financiamiento && { label: 'Financiamiento', value: body.financiamiento === 'si' ? 'Sí, necesita' : 'No necesita' },
      body.ruc && { label: 'RUC / NIT', value: body.ruc },
      body.ciudad && { label: 'Ciudad', value: body.ciudad },
    ].filter(Boolean) as { label: string; value: string }[];

    const contextHTML = contextRows.length > 0 ? `
      <tr>
        <td style="padding:0 32px 20px;">
          <p style="margin:0 0 10px;font-size:11px;color:${COLORS.primary};text-transform:uppercase;letter-spacing:1px;font-weight:700;border-bottom:1px solid ${COLORS.primary};padding-bottom:4px;">Contexto de la operación</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${contextRows.map((r, i) => `
              <tr>
                <td style="padding:8px 0;${i < contextRows.length - 1 ? `border-bottom:1px solid ${COLORS.border};` : ''}color:${COLORS.textMuted};font-size:11px;width:140px;text-transform:uppercase;letter-spacing:0.5px;">${r.label}</td>
                <td style="padding:8px 0;${i < contextRows.length - 1 ? `border-bottom:1px solid ${COLORS.border};` : ''}color:${COLORS.text};font-size:13px;font-weight:600;">${r.value}</td>
              </tr>
            `).join('')}
          </table>
        </td>
      </tr>
    ` : '';

    // Número provisional para el correo; se reemplaza con el real tras el insert.
    let displayNumero = 'pendiente';

    // Diseño del email alineado con CotizacionPDF.tsx: modo claro, paleta
    // PARMONCA, logo real desde public/. Inline CSS porque Gmail/Outlook
    // descartan <style> y clases. Las fuentes son system-ui — los emails
    // no cargan web fonts de Google de forma consistente.
    const logoUrl = 'https://parmonca.com/images/logo-dark.png';
    const modalidadBg = body.modalidad === 'alquiler' ? '#3B82F6' : COLORS.primary;
    const fontStack = "'Helvetica Neue', Helvetica, Arial, sans-serif";

    const emailHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Cotización PARMONCA</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:${fontStack};color:${COLORS.text};-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${COLORS.bgWhite};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">

          <!-- Header con logo real + badge de modalidad -->
          <tr>
            <td style="padding:24px 32px 16px;border-bottom:2px solid ${COLORS.primary};">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle">
                    <img src="${logoUrl}" alt="PARMONCA" width="160" height="auto" style="display:block;max-height:44px;width:auto;border:0;outline:none;">
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;padding:6px 14px;background:${modalidadBg};color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:6px;">${modalidadLabel}</span>
                    <div style="margin-top:8px;font-size:10px;color:${COLORS.textMuted};letter-spacing:1px;text-transform:uppercase;">Cotización de maquinaria industrial</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 8px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:${COLORS.text};line-height:1.3;">Hola ${body.nombre},</h1>
              <p style="margin:10px 0 0;font-size:14px;color:${COLORS.textMuted};line-height:1.6;">
                Tu cotización <strong style="color:${COLORS.primary};font-family:Menlo,Consolas,monospace;">___NUMERO___</strong> está lista.
                Adjunto a este correo encontrarás el documento PDF con todos los detalles, características técnicas, condiciones comerciales y garantía.
              </p>
            </td>
          </tr>

          <!-- PDF attachment card -->
          <tr>
            <td style="padding:8px 32px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bgSoft};border:1px solid ${COLORS.primary};border-left-width:3px;border-radius:8px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-size:10px;color:${COLORS.primary};font-weight:700;letter-spacing:1px;text-transform:uppercase;">📎 Cotización adjunta</div>
                    <div style="margin-top:4px;font-size:13px;color:${COLORS.text};font-family:Menlo,Consolas,monospace;font-weight:600;">___NUMERO___-PARMONCA.pdf</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${body.producto && !esLineItems ? `
          <!-- Producto único (legacy) -->
          <tr>
            <td style="padding:0 32px 20px;">
              <p style="margin:0 0 10px;font-size:11px;color:${COLORS.primary};text-transform:uppercase;letter-spacing:1px;font-weight:700;border-bottom:1px solid ${COLORS.primary};padding-bottom:4px;">Equipo solicitado</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bgSoft};border:1px solid ${COLORS.border};border-radius:8px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <table width="100%">
                      <tr>
                        <td>
                          <div style="font-size:10px;color:${COLORS.primary};font-weight:700;letter-spacing:1px;text-transform:uppercase;">${body.producto.marca}</div>
                          <div style="font-size:20px;font-weight:700;color:${COLORS.text};margin-top:2px;">${body.producto.modelo}</div>
                          <div style="font-size:12px;color:${COLORS.textMuted};margin-top:2px;">${body.producto.categoria} &middot; ${modalidadLabel}</div>
                        </td>
                        <td align="right" valign="top">
                          <div style="font-size:10px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;">Cantidad</div>
                          <div style="font-size:18px;font-weight:700;color:${COLORS.text};margin-top:2px;">${body.cantidad} und.</div>
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
          <!-- Accesorios legacy -->
          <tr>
            <td style="padding:0 32px 20px;">
              <p style="margin:0 0 10px;font-size:11px;color:${COLORS.primary};text-transform:uppercase;letter-spacing:1px;font-weight:700;border-bottom:1px solid ${COLORS.primary};padding-bottom:4px;">Accesorios seleccionados (${body.accesorios.length})</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLORS.border};border-radius:8px;overflow:hidden;">
                ${accesoriosHTML}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Totales -->
          <tr>
            <td style="padding:0 32px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid ${COLORS.primary};">
                <tr>
                  <td style="padding:10px 0;color:${COLORS.textMuted};font-size:13px;border-bottom:1px solid ${COLORS.border};">Subtotal${body.modalidad === 'alquiler' && body.periodo ? ` (${body.periodo})` : ''}</td>
                  <td align="right" style="padding:10px 0;color:${COLORS.text};font-size:13px;font-weight:600;border-bottom:1px solid ${COLORS.border};">${fmtMoney(body.subtotal)}</td>
                </tr>
                ${body.modalidad === 'venta' ? `
                <tr>
                  <td style="padding:10px 0;color:${COLORS.textMuted};font-size:13px;border-bottom:1px solid ${COLORS.border};">Impuesto (${impuestoLabel})</td>
                  <td align="right" style="padding:10px 0;color:${COLORS.text};font-size:13px;font-weight:600;border-bottom:1px solid ${COLORS.border};">${fmtMoney(body.impuesto)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:14px 0 4px;color:${COLORS.text};font-size:14px;font-weight:700;">Total ${body.modalidad === 'alquiler' ? `por ${body.periodo}` : 'estimado'}</td>
                  <td align="right" style="padding:14px 0 4px;color:${COLORS.primary};font-size:22px;font-weight:700;">${fmtMoney(body.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${contextHTML}

          <!-- Datos de contacto -->
          <tr>
            <td style="padding:0 32px 20px;">
              <p style="margin:0 0 10px;font-size:11px;color:${COLORS.primary};text-transform:uppercase;letter-spacing:1px;font-weight:700;border-bottom:1px solid ${COLORS.primary};padding-bottom:4px;">Datos de contacto</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:8px 0;color:${COLORS.textMuted};font-size:11px;width:140px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid ${COLORS.border};">Nombre</td>
                  <td style="padding:8px 0;color:${COLORS.text};font-size:13px;font-weight:600;border-bottom:1px solid ${COLORS.border};">${body.nombre}</td>
                </tr>
                ${body.empresa ? `<tr><td style="padding:8px 0;color:${COLORS.textMuted};font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid ${COLORS.border};">Empresa</td><td style="padding:8px 0;color:${COLORS.text};font-size:13px;font-weight:600;border-bottom:1px solid ${COLORS.border};">${body.empresa}</td></tr>` : ''}
                <tr>
                  <td style="padding:8px 0;color:${COLORS.textMuted};font-size:11px;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid ${COLORS.border};">Email</td>
                  <td style="padding:8px 0;color:${COLORS.text};font-size:13px;font-weight:600;border-bottom:1px solid ${COLORS.border};">${body.email}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:${COLORS.textMuted};font-size:11px;text-transform:uppercase;letter-spacing:0.5px;${body.pais ? `border-bottom:1px solid ${COLORS.border};` : ''}">Teléfono</td>
                  <td style="padding:8px 0;color:${COLORS.text};font-size:13px;font-weight:600;${body.pais ? `border-bottom:1px solid ${COLORS.border};` : ''}">${body.telefono}</td>
                </tr>
                ${body.pais ? `<tr><td style="padding:8px 0;color:${COLORS.textMuted};font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">País</td><td style="padding:8px 0;color:${COLORS.text};font-size:13px;font-weight:600;">${body.pais}${body.ciudad ? ` &middot; ${body.ciudad}` : ''}</td></tr>` : ''}
              </table>
              ${body.mensaje ? `<div style="margin-top:14px;padding:12px 14px;background:${COLORS.bgSoft};border-left:3px solid ${COLORS.primary};border-radius:4px;"><div style="font-size:10px;color:${COLORS.textMuted};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:4px;">Mensaje del cliente</div><div style="font-size:13px;color:${COLORS.text};line-height:1.5;">${body.mensaje}</div></div>` : ''}
            </td>
          </tr>

          <!-- CTA / seguimiento -->
          <tr>
            <td style="padding:0 32px 28px;">
              <div style="padding:16px 18px;background:${COLORS.bgSoft};border:1px solid ${COLORS.border};border-radius:8px;">
                <p style="margin:0;font-size:13px;color:${COLORS.text};line-height:1.6;">
                  Un asesor comercial de PARMONCA te contactará en las próximas <strong style="color:${COLORS.primary};">2 horas hábiles</strong> para darte seguimiento personalizado, resolver tus dudas y preparar la propuesta formal.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px;background:${COLORS.bgSoft};border-top:1px solid ${COLORS.border};">
              <table width="100%">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:${COLORS.text};letter-spacing:0.5px;">PARMONCA</div>
                    <div style="font-size:10px;color:${COLORS.textMuted};margin-top:2px;">Partes y Montacargas</div>
                  </td>
                  <td align="right">
                    <div style="font-size:10px;color:${COLORS.textMuted};line-height:1.5;">Panamá &middot; Costa Rica &middot; Venezuela &middot; Guatemala</div>
                    <div style="font-size:10px;color:${COLORS.textMuted};line-height:1.5;">Honduras &middot; Nicaragua &middot; Haití</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Disclaimer fuera del card -->
        <p style="margin:16px auto 0;max-width:600px;font-size:11px;color:${COLORS.textMuted};text-align:center;line-height:1.5;">
          Este correo fue enviado automáticamente desde el sistema CRM de PARMONCA. Si no solicitaste esta cotización, puedes ignorarlo.
        </p>
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

    // 2) Generar PDF de la cotización (sólo si la cotización se guardó OK).
    //    Pasamos Buffer directo al mailer — Graph lo convierte a base64.
    let pdfAttachment: { filename: string; content: Buffer } | null = null;
    if (cotizacionId) {
      const pdf = await buildCotizacionPDF(cotizacionId);
      if (pdf) {
        pdfAttachment = {
          filename: `${pdf.numero}-PARMONCA.pdf`,
          content: pdf.buffer,
        };
      }
    }
    const attachments = pdfAttachment ? [pdfAttachment] : undefined;

    const productoLabel = body.producto ? ` ${body.producto.marca} ${body.producto.modelo}` : '';

    // Reemplaza el placeholder con el número real de la cotización
    const emailHTMLFinal = emailHTML.replaceAll('___NUMERO___', displayNumero);

    // 3) Enviar correos por Microsoft Graph API. Cada envío en su propio
    //    try/catch para que un fallo de Microsoft NO tumbe la respuesta al
    //    cliente — la cotización ya está persistida en BD y el admin la
    //    verá en /cotizaciones aunque el email no salga.
    let customerMessageId: string | null = null;
    try {
      const r = await sendMail({
        to: body.email,
        subject: `Cotización ${displayNumero}${productoLabel} — PARMONCA`,
        html: emailHTMLFinal,
        attachments,
      });
      customerMessageId = r.messageId;
    } catch (mailErr) {
      console.error('Graph send to customer failed:', mailErr);
    }

    // Copia interna para el equipo comercial. Configurable vía env var
    // MAIL_INTERNAL_COPY (CSV permitido). Si no está, no se manda copia.
    const internalRecipients = (process.env.MAIL_INTERNAL_COPY || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (internalRecipients.length > 0) {
      try {
        await sendMail({
          fromName: 'PARMONCA CRM',
          to: internalRecipients,
          subject: `[${modalidadLabel}] ${displayNumero} — ${body.nombre}${productoLabel} (${fmtMoney(body.total)})`,
          html: emailHTMLFinal,
          attachments,
        });
      } catch (mailErr) {
        console.error('Graph send internal copy failed:', mailErr);
      }
    }

    // 4) Notify Slack (if configured) — non-blocking
    if (cotizacionNumero) {
      notifySlack(body, cotizacionNumero).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      id: customerMessageId,
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
