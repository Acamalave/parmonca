import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { createAnonClient, createAdminClient } from '@/lib/supabase/server';
import { CotizacionPDF, type CotizacionData } from '@/lib/pdf/CotizacionPDF';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cotizacion/[id]/pdf
 *
 * Genera y devuelve el PDF de una cotización con branding PARMONCA.
 * Lee:
 *   - parmonca_cotizaciones.id
 *   - parmonca_profiles del asesor asignado
 *   - parmonca_productos por slug del producto JSON (para specs detalladas)
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  // Permite que el PDF lo lea cualquiera que tenga el ID (cliente recibe link).
  // Si más adelante quieres restringirlo a admin/asesor, cambia a createClient().
  // Como las cotizaciones tienen RLS estricta para SELECT, usamos service_role
  // para leer y validar al mostrar — esto evita exponer datos de otras
  // cotizaciones al adivinar UUIDs (UUIDs son no-enumerables).
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Fallback: usa anon (sólo funciona si la cotización está accesible por RLS)
    const anon = createAnonClient();
    return await build(anon, id);
  }
  const admin = createAdminClient();
  return await build(admin, id);
}

async function build(client: ReturnType<typeof createAnonClient>, id: string) {
  // 1) cotización
  const { data: cot, error } = await client
    .from('parmonca_cotizaciones')
    .select('id, numero, nombre, empresa, email, telefono, pais, ciudad, mensaje, modalidad, periodo, producto, cantidad, subtotal, impuesto, total, asignado_a, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !cot) {
    return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
  }

  // 2) asesor (si existe)
  let asesor: { nombre?: string | null; email?: string | null } | null = null;
  if (cot.asignado_a) {
    const { data: p } = await client
      .from('parmonca_profiles')
      .select('nombre, email')
      .eq('id', cot.asignado_a)
      .maybeSingle();
    if (p) asesor = { nombre: p.nombre, email: p.email };
  }

  // 3) Specs del producto (lookup por modelo si tiene slug en el JSON)
  let specs: CotizacionData['specs'] = {};
  const productoJson = cot.producto as { modelo?: string; marca?: string; categoria?: string; precio?: number; imagen?: string } | null;
  if (productoJson?.modelo) {
    const { data: prod } = await client
      .from('parmonca_productos')
      .select('capacidad_kg, ancho_pasillo_mm, longitud_sin_horquillas_mm, ancho_total_mm, altura_chasis_mm, motor, descripcion')
      .eq('modelo', productoJson.modelo)
      .maybeSingle();
    if (prod) specs = prod;
  }

  // 4) Validez 30 días por defecto
  const created = new Date(cot.created_at);
  const validaHasta = new Date(created.getTime() + 30 * 24 * 3600 * 1000);

  const data: CotizacionData = {
    numero: cot.numero,
    created_at: cot.created_at,
    validaHasta: validaHasta.toISOString(),
    cliente: {
      nombre: cot.nombre,
      empresa: cot.empresa,
      telefono: cot.telefono,
      email: cot.email,
      pais: cot.pais,
      ciudad: cot.ciudad,
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
    mensaje: cot.mensaje,
  };

  // 5) Render PDF
  const element = React.createElement(CotizacionPDF, { data }) as unknown as Parameters<typeof renderToBuffer>[0];
  const pdfBuffer = await renderToBuffer(element);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${cot.numero}-PARMONCA.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
