/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// ──────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────

export type ProductoCotizado = {
  modelo?: string;
  marca?: string;
  categoria?: string;
  precio?: number;
  imagen?: string;
};

export type ItemSpecs = {
  capacidad_kg?: number | null;
  ancho_pasillo_mm?: number | null;
  longitud_sin_horquillas_mm?: number | null;
  ancho_total_mm?: number | null;
  altura_chasis_mm?: number | null;
  motor?: string | null;
  descripcion?: string | null;
};

export type LineItem = {
  tipo?: 'producto' | 'repuesto';
  modelo: string;
  marca: string | null;
  categoria: string | null;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  imagen?: string | null;
  specs?: ItemSpecs;
};

export type CotizacionData = {
  numero: string;                     // COT-2026-0001
  created_at: string;                 // ISO
  validaHasta: string;                // ISO
  cliente: {
    nombre: string;
    empresa?: string | null;
    telefono?: string | null;
    email?: string | null;
    pais?: string | null;
    ciudad?: string | null;
  };
  asesor?: { nombre?: string | null; email?: string | null } | null;
  modalidad: 'venta' | 'alquiler';
  periodo?: string | null;            // 1_ano | 2_anos | ...
  cantidad: number;                   // cantidad del primer item (legacy)
  subtotal: number;
  impuesto: number;
  total: number;
  producto: ProductoCotizado | null;  // primer item (legacy compat)
  // Specs del primer producto (legacy compat)
  specs?: ItemSpecs;
  // Lista completa de items cotizados (multi-producto)
  items?: LineItem[];
  mensaje?: string | null;
};

// ──────────────────────────────────────────────────────────────────────────
// Constantes y utilidades
// ──────────────────────────────────────────────────────────────────────────

const BRAND = {
  primary: '#E8821C',
  primaryDark: '#C96A10',
  text: '#1F2937',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  bg: '#FFFFFF',
  bgSoft: '#FAFAFA',
};

const PERIODO_LABEL: Record<string, string> = {
  '1_ano': '1 año',
  '2_anos': '2 años',
  '3_anos': '3 años',
  '5_anos': '5 años',
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(n) || 0);

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
};

// Logo desde public/ via URL pública (Vercel sirve /images/* directo)
const LOGO_URL = 'https://parmonca.com/images/logo-dark.png';
const ISOTIPO_URL = 'https://parmonca.com/images/isotipo.png';

// ──────────────────────────────────────────────────────────────────────────
// Estilos
// ──────────────────────────────────────────────────────────────────────────

// Usamos la fuente nativa Helvetica — viene incluida en @react-pdf/renderer
// y evita el latency/error de fetch a Google Fonts en runtime serverless.

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 36,
    backgroundColor: BRAND.bg,
    color: BRAND.text,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: BRAND.primary,
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo: { width: 100, height: 32, objectFit: 'contain' },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 14, fontWeight: 700, color: BRAND.primary, letterSpacing: 1.5 },
  headerCotNumber: { fontSize: 11, fontWeight: 700, color: BRAND.text, marginTop: 2 },
  headerPageNum: { fontSize: 8, color: BRAND.textMuted, marginTop: 2 },

  // Info bar (cliente / asesor / fechas)
  infoBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  infoCol: { width: '50%', marginBottom: 4 },
  infoLabel: { fontSize: 7, color: BRAND.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  infoValue: { fontSize: 9, color: BRAND.text, fontWeight: 600 },

  // Section titles
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: BRAND.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.primary,
  },

  // Equipo principal — tabla header
  equipoTableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.primary,
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  equipoTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    fontSize: 9,
  },
  colEquipo: { flex: 3 },
  colCant: { flex: 0.8, textAlign: 'center' },
  colPrecio: { flex: 1.2, textAlign: 'right' },
  colTotal: { flex: 1.2, textAlign: 'right', fontWeight: 700 },

  // Imagen del equipo
  equipoImageWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 6,
    gap: 12,
  },
  equipoImage: { width: 130, height: 130, objectFit: 'contain' },
  equipoMeta: { flex: 1, paddingTop: 4 },
  equipoMarca: { fontSize: 8, color: BRAND.primary, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' },
  equipoModelo: { fontSize: 14, fontWeight: 700, color: BRAND.text, marginTop: 2 },
  equipoCategoria: { fontSize: 9, color: BRAND.textMuted, marginTop: 1 },

  // Specs grid (2 cols)
  specsGrid: { marginTop: 4 },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.border,
    fontSize: 8.5,
  },
  specLabel: { flex: 1, color: BRAND.textMuted },
  specValue: { flex: 1, color: BRAND.text, fontWeight: 600 },

  // Bullets (Incluye)
  bulletList: { marginTop: 4 },
  bulletItem: {
    flexDirection: 'row',
    fontSize: 9,
    marginBottom: 3,
  },
  bullet: { width: 10, color: BRAND.primary, fontWeight: 700 },

  // Resumen financiero
  resumenWrap: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: BRAND.primary,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    fontSize: 10,
  },
  resumenTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
  },
  resumenTotalLabel: { fontSize: 11, fontWeight: 700, color: BRAND.text },
  resumenTotalValue: { fontSize: 13, fontWeight: 700, color: BRAND.primary },

  // Body text
  body: { fontSize: 9, color: BRAND.text, lineHeight: 1.5, marginBottom: 6, textAlign: 'justify' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    fontSize: 7,
    color: BRAND.textMuted,
  },
  footerLeft: { flex: 1 },
  footerCenter: { flex: 1, textAlign: 'center' },
  footerRight: { flex: 1, textAlign: 'right' },

  // Page number
  pageNum: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: BRAND.textMuted,
  },
});

// ──────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────────────────────

function Header({ data, page, total }: { data: CotizacionData; page: number; total: number }) {
  return (
    <View style={s.header} fixed>
      <View style={s.headerLeft}>
        <Image style={s.headerLogo} src={LOGO_URL} />
      </View>
      <View style={s.headerRight}>
        <Text style={s.headerTitle}>
          {data.modalidad === 'alquiler' ? 'COTIZACIÓN DE ALQUILER' : 'COTIZACIÓN DE VENTA'}
        </Text>
        <Text style={s.headerCotNumber}>{data.numero}</Text>
        <Text style={s.headerPageNum}>Página {page} de {total}</Text>
      </View>
    </View>
  );
}

function InfoBar({ data }: { data: CotizacionData }) {
  const cliente = data.cliente.empresa
    ? `${data.cliente.empresa.toUpperCase()}`
    : data.cliente.nombre.toUpperCase();
  const contactoTel = [data.cliente.nombre, data.cliente.telefono].filter(Boolean).join(' — ');
  const opLabel = data.modalidad === 'alquiler'
    ? `ALQUILER${data.periodo ? ` (${PERIODO_LABEL[data.periodo] || data.periodo})` : ''}`
    : 'VENTA';
  return (
    <View style={s.infoBar}>
      <View style={s.infoCol}>
        <Text style={s.infoLabel}>Cliente</Text>
        <Text style={s.infoValue}>{cliente}</Text>
      </View>
      <View style={s.infoCol}>
        <Text style={s.infoLabel}>Asesor</Text>
        <Text style={s.infoValue}>{data.asesor?.nombre || 'PARMONCA'}</Text>
      </View>
      <View style={s.infoCol}>
        <Text style={s.infoLabel}>Contacto</Text>
        <Text style={s.infoValue}>{contactoTel || data.cliente.email || '—'}</Text>
      </View>
      <View style={s.infoCol}>
        <Text style={s.infoLabel}>Operación</Text>
        <Text style={s.infoValue}>{opLabel}</Text>
      </View>
      <View style={s.infoCol}>
        <Text style={s.infoLabel}>Fecha</Text>
        <Text style={s.infoValue}>{formatDate(data.created_at)}</Text>
      </View>
      <View style={s.infoCol}>
        <Text style={s.infoLabel}>Válida hasta</Text>
        <Text style={s.infoValue}>{formatDate(data.validaHasta)}</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerLeft}>PARMONCA · Partes y Montacargas</Text>
      <Text style={s.footerCenter}>+507 6256-0957 · ventas@parmonca.com</Text>
      <Text style={s.footerRight}>parmonca.com</Text>
    </View>
  );
}

function PageNum() {
  return (
    <Text
      style={s.pageNum}
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      fixed
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Páginas
// ──────────────────────────────────────────────────────────────────────────

function PageEquipo({
  data, item, pageIdx, totalPages, isMaquinaria,
}: {
  data: CotizacionData;
  item: LineItem;
  pageIdx: number;
  totalPages: number;
  isMaquinaria: boolean;
}) {
  const specs = item.specs || {};

  const specsList: { label: string; value: string }[] = [
    { label: 'Condición', value: 'NUEVO' },
    { label: 'Tipo', value: item.categoria || '—' },
    { label: 'Capacidad de Carga (kg)', value: specs.capacidad_kg ? specs.capacidad_kg.toLocaleString() : '—' },
    { label: 'Longitud sin horquillas (mm)', value: specs.longitud_sin_horquillas_mm?.toString() || '—' },
    { label: 'Ancho Total (mm)', value: specs.ancho_total_mm?.toString() || '—' },
    { label: 'Altura de Chasis (mm)', value: specs.altura_chasis_mm?.toString() || '—' },
    { label: 'Ancho de pasillo pallet (mm)', value: specs.ancho_pasillo_mm?.toString() || '—' },
    { label: 'Motor / Batería', value: specs.motor || '—' },
  ];

  return (
    <Page size="LETTER" style={s.page}>
      <Header data={data} page={pageIdx} total={totalPages} />
      <InfoBar data={data} />

      {/* Tabla del equipo */}
      <View style={s.equipoTableHeader}>
        <Text style={s.colEquipo}>Equipo</Text>
        <Text style={s.colCant}>Cant.</Text>
        <Text style={s.colPrecio}>Precio</Text>
        <Text style={s.colTotal}>Total</Text>
      </View>
      <View style={s.equipoTableRow}>
        <Text style={s.colEquipo}>{`MARCA ${(item.marca || '').toUpperCase()} - MODELO ${item.modelo}`}</Text>
        <Text style={s.colCant}>{item.cantidad.toFixed(2)}</Text>
        <Text style={s.colPrecio}>{formatCurrency(item.precio_unitario)}</Text>
        <Text style={s.colTotal}>{formatCurrency(item.precio_total)}</Text>
      </View>

      {/* Imagen + meta */}
      <View style={s.equipoImageWrap}>
        {item.imagen ? <Image style={s.equipoImage} src={item.imagen} /> : <View style={s.equipoImage} />}
        <View style={s.equipoMeta}>
          <Text style={s.equipoMarca}>{item.marca || ''}</Text>
          <Text style={s.equipoModelo}>{item.modelo}</Text>
          <Text style={s.equipoCategoria}>{item.categoria || ''}</Text>
          {specs.descripcion && (
            <Text style={[s.body, { marginTop: 6 }]}>{specs.descripcion}</Text>
          )}
        </View>
      </View>

      {isMaquinaria && (
        <>
          <Text style={s.sectionTitle}>Características</Text>
          <View style={s.specsGrid}>
            {specsList.map((row, i) => (
              <View key={i} style={s.specRow}>
                <Text style={s.specLabel}>{row.label}</Text>
                <Text style={s.specValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={s.sectionTitle}>Condiciones del equipo</Text>
      <Text style={s.body}>
        {data.modalidad === 'alquiler'
          ? 'El alquiler incluye mantenimiento preventivo programado, soporte técnico y reemplazo en caso de falla mayor. Los términos específicos del contrato se firman al confirmar la operación.'
          : 'Pago: 50% anticipado / 50% antes del despacho desde nuestro centro logístico en Panamá. Precio en términos EXW (Ex-Works) Panamá.'}
      </Text>

      {data.mensaje && pageIdx === 1 && (
        <>
          <Text style={s.sectionTitle}>Notas del cliente</Text>
          <Text style={s.body}>{data.mensaje}</Text>
        </>
      )}

      <PageNum />
      <Footer />
    </Page>
  );
}

function PageResumen({
  data, items, pageIdx, totalPages,
}: {
  data: CotizacionData;
  items: LineItem[];
  pageIdx: number;
  totalPages: number;
}) {
  return (
    <Page size="LETTER" style={s.page}>
      <Header data={data} page={pageIdx} total={totalPages} />
      <InfoBar data={data} />

      <Text style={s.sectionTitle}>Resumen financiero</Text>

      <View style={s.equipoTableHeader}>
        <Text style={s.colEquipo}>Equipo / Producto</Text>
        <Text style={s.colCant}>Cant.</Text>
        <Text style={s.colPrecio}>Precio / Unidad</Text>
        <Text style={s.colTotal}>Total</Text>
      </View>
      {items.map((it, i) => (
        <View key={i} style={s.equipoTableRow}>
          <Text style={s.colEquipo}>
            {it.tipo === 'repuesto'
              ? `${it.modelo}${it.marca ? ` (${it.marca})` : ''}`
              : `MARCA ${(it.marca || '').toUpperCase()} - MODELO ${it.modelo}`}
          </Text>
          <Text style={s.colCant}>{it.cantidad.toFixed(2)}</Text>
          <Text style={s.colPrecio}>{formatCurrency(it.precio_unitario)}</Text>
          <Text style={s.colTotal}>{formatCurrency(it.precio_total)}</Text>
        </View>
      ))}

      <View style={s.resumenWrap}>
        <View style={s.resumenRow}>
          <Text>Subtotal</Text>
          <Text>{formatCurrency(data.subtotal)}</Text>
        </View>
        {data.modalidad === 'venta' && (
          <View style={s.resumenRow}>
            <Text>Impuesto (7% ITBMS)</Text>
            <Text>{formatCurrency(data.impuesto)}</Text>
          </View>
        )}
        <View style={s.resumenTotalRow}>
          <Text style={s.resumenTotalLabel}>
            Total {data.modalidad === 'alquiler' ? 'del plazo' : 'estimado'}
          </Text>
          <Text style={s.resumenTotalValue}>{formatCurrency(data.total)}</Text>
        </View>
      </View>

      <Text style={[s.body, { marginTop: 16, color: BRAND.textMuted, fontSize: 8 }]}>
        Esta cotización es preliminar. El asesor asignado se pondrá en contacto contigo dentro de las próximas 2 horas hábiles para confirmar disponibilidad, fecha de entrega, condiciones de pago e impuestos aplicables. Los precios están sujetos a verificación de stock y tipo de cambio vigente.
      </Text>

      <PageNum />
      <Footer />
    </Page>
  );
}

function PageCondiciones({ data, pageIdx, totalPages }: { data: CotizacionData; pageIdx: number; totalPages: number }) {
  return (
    <Page size="LETTER" style={s.page}>
      <Header data={data} page={pageIdx} total={totalPages} />

      <Text style={s.sectionTitle}>Condiciones comerciales</Text>

      <Text style={[s.body, { fontWeight: 700, marginBottom: 4 }]}>1. Disponibilidad inmediata</Text>
      <Text style={s.body}>
        Para equipos en stock, se requiere el pago del 100% del costo total antes de la entrega. La entrega se realiza en nuestras instalaciones en Panamá y el pago completo asegura la asignación inmediata del equipo al comprador.
      </Text>

      <Text style={[s.body, { fontWeight: 700, marginBottom: 4 }]}>2. Pedidos contra orden (importación)</Text>
      <Text style={s.body}>
        Para equipos cotizados bajo pedido (importación o personalización), se exige un pago inicial del 50% del costo total para iniciar el proceso de compra. Este depósito permite la confirmación con la fábrica.
      </Text>
      <Text style={s.body}>
        El 50% restante se paga antes del despacho desde nuestras instalaciones. Los tiempos de entrega varían entre 90 y 120 días calendario para producción y transporte. Todas las cotizaciones se realizan bajo terminología EXW Panamá.
      </Text>

      <Text style={[s.body, { fontWeight: 700, marginBottom: 4 }]}>3. Validez de la oferta</Text>
      <Text style={s.body}>
        Esta cotización es válida hasta {formatDate(data.validaHasta)}. Después de esa fecha los precios pueden ajustarse según el tipo de cambio y disponibilidad de inventario.
      </Text>

      <Text style={s.sectionTitle}>Garantía</Text>
      <Text style={s.body}>
        Al adquirir tu equipo a través de PARMONCA, recibes el respaldo de la garantía oficial del fabricante (UNILIFT, ANDINO, MEGALIFT u otra marca correspondiente) según corresponda al modelo:
      </Text>
      <View style={s.bulletList}>
        {[
          'Batería de litio: 3 a 5 años o 6,000–10,000 horas de uso (lo que ocurra primero), según marca.',
          'Cargador: 1 año desde la fecha de compra contra defectos de fabricación.',
          'Partes mecánicas, electromecánicas y eléctricas: 2,000 horas de uso o 1 año desde la fecha de compra.',
          'Servicio técnico autorizado y disponibilidad de repuestos garantizada en Panamá.',
        ].map((b, i) => (
          <View key={i} style={s.bulletItem}>
            <Text style={s.bullet}>•</Text>
            <Text style={{ flex: 1 }}>{b}</Text>
          </View>
        ))}
      </View>

      <Text style={[s.body, { marginTop: 8, fontSize: 8, color: BRAND.textMuted }]}>
        Exclusiones: la garantía no cubre daños por uso inadecuado, mantenimiento por personal no autorizado o modificaciones no aprobadas. Se recomienda no operar la batería por debajo del 25% de carga, ya que afecta la garantía.
      </Text>

      <View style={{ marginTop: 24, padding: 10, backgroundColor: BRAND.bgSoft, borderLeftWidth: 3, borderLeftColor: BRAND.primary }}>
        <Text style={{ fontSize: 9, fontWeight: 700, color: BRAND.text, marginBottom: 3 }}>
          Tu asesor: {data.asesor?.nombre || 'Equipo PARMONCA'}
        </Text>
        {data.asesor?.email && (
          <Text style={{ fontSize: 8.5, color: BRAND.textMuted }}>{data.asesor.email}</Text>
        )}
        <Text style={{ fontSize: 8.5, color: BRAND.textMuted, marginTop: 2 }}>
          WhatsApp: +507 6256-0957
        </Text>
      </View>

      <PageNum />
      <Footer />
    </Page>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Documento principal
// ──────────────────────────────────────────────────────────────────────────

export function CotizacionPDF({ data }: { data: CotizacionData }) {
  // Construye la lista de items: usa data.items si vienen del carrito multi-ítem,
  // si no hace fallback al producto/specs/cantidad legacy
  const items: LineItem[] =
    data.items && data.items.length > 0
      ? data.items
      : data.producto
        ? [{
            tipo: 'producto',
            modelo: data.producto.modelo || '—',
            marca: data.producto.marca || null,
            categoria: data.producto.categoria || null,
            cantidad: data.cantidad,
            precio_unitario: Number(data.producto.precio || 0),
            precio_total: Number(data.producto.precio || 0) * data.cantidad,
            imagen: data.producto.imagen,
            specs: data.specs,
          }]
        : [];

  // Sólo renderizamos página de equipo individual para items tipo 'producto'
  // (los repuestos van directo al resumen). Si no hay productos, saltamos las
  // páginas de equipo y vamos directo al resumen.
  const equipos = items.filter(i => i.tipo !== 'repuesto');
  const totalPages = equipos.length + 2; // N equipos + resumen + condiciones

  return (
    <Document
      title={`Cotización ${data.numero} — PARMONCA`}
      author="PARMONCA"
      subject={`Cotización ${data.numero}`}
      keywords="cotización montacargas parmonca"
    >
      {equipos.map((it, i) => (
        <PageEquipo
          key={`equipo-${i}`}
          data={data}
          item={it}
          pageIdx={i + 1}
          totalPages={totalPages}
          isMaquinaria={it.tipo !== 'repuesto'}
        />
      ))}
      <PageResumen
        data={data}
        items={items}
        pageIdx={equipos.length + 1}
        totalPages={totalPages}
      />
      <PageCondiciones
        data={data}
        pageIdx={equipos.length + 2}
        totalPages={totalPages}
      />
    </Document>
  );
}

// Marca isotipo no usada actualmente pero reservada
export const _ISOTIPO_REF = ISOTIPO_URL;
