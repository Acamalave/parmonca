export type Modalidad = 'venta' | 'alquiler';
export type PeriodoAlquiler = '1_ano' | '2_anos' | '3_anos' | '5_anos';

export interface PreciosAlquiler {
  '1_ano': number;
  '2_anos': number;
  '3_anos': number;
  '5_anos': number;
}

export interface StoreProduct {
  id: string;
  slug: string;
  modelo: string;
  marca: string;
  categoria: string;
  categoriaLabel: string;
  capacidad: string;
  motor: string;
  imagen: string;
  imagenNoBg: string;
  precioDesde: number;
  preciosAlquiler: PreciosAlquiler;
  badge?: string;
  specs: {
    capacidadCarga: string;
    anchoPasillo: string;
    longitudSinHorquillas: string;
    anchoTotal: string;
    alturaChasis: string;
    tipoMotor: string;
    bateria?: string;
    mastil?: string;
  };
  descripcion: string;
  caracteristicas: string[];
  costoOperativo: {
    combustibleMes: number;
    mantenimientoMes: number;
  };
  usoRecomendado: {
    ambiente: ('interior' | 'exterior' | 'mixto')[];
    industrias: string[];
    frecuencia: ('1_turno' | '2_turnos' | '3_turnos')[];
  };
}

/**
 * Categorías de equipo donde un accesorio es aplicable.
 * - "montacarga" cubre Montacarga Eléctrico y Montacarga Combustión
 * - "apilador" cubre Apilador Eléctrico
 * - "traspaleta" cubre Traspaleta Eléctrica
 * - "altura" cubre Mástil con Pantógrafo, Mástil Retráctil, Plataforma Elevadora
 */
export type CategoriaEquipo = 'montacarga' | 'apilador' | 'traspaleta' | 'altura';

export interface Accesorio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: 'seguridad' | 'productividad' | 'proteccion' | 'tecnologia';
  aplicable: CategoriaEquipo[];
  imagen?: string;
}

export const periodoLabels: Record<PeriodoAlquiler, string> = {
  '1_ano': '1 año',
  '2_anos': '2 años',
  '3_anos': '3 años',
  '5_anos': '5 años',
};

/** Periodos disponibles en el orden que se muestran en los pickers. */
export const periodosAlquiler: PeriodoAlquiler[] = ['1_ano', '2_anos', '3_anos', '5_anos'];

/**
 * Parsers seguros para los enums que llegan vía URL params.
 * Hacer `searchParams.get('modalidad') as Modalidad` es sólo un cast a
 * nivel de tipos: si alguien abre `?modalidad=hola`, ese string corrupto
 * se mete al state sin que TypeScript lo detecte. Estos helpers validan
 * en runtime y caen al default cuando el valor no está en el union.
 */
export function parseModalidad(v: string | null | undefined, fallback: Modalidad = 'venta'): Modalidad {
  return v === 'venta' || v === 'alquiler' ? v : fallback;
}

export function parsePeriodoAlquiler(v: string | null | undefined, fallback: PeriodoAlquiler = '1_ano'): PeriodoAlquiler {
  return periodosAlquiler.includes(v as PeriodoAlquiler) ? (v as PeriodoAlquiler) : fallback;
}

export const storeProducts: StoreProduct[] = [
  {
    id: '1',
    slug: 'u20w3li',
    modelo: 'U20W3Li',
    marca: 'UNILIFT',
    categoria: 'montacarga-electrico',
    categoriaLabel: 'Montacarga Eléctrico',
    capacidad: '2,000 kg',
    motor: 'Eléctrico Li-Ion',
    imagen: '/images/products/u20w3li-nobg.png',
    imagenNoBg: '/images/products/u20w3li-nobg.png',
    precioDesde: 19800,
    preciosAlquiler: { '1_ano': 9500, '2_anos': 17480, '3_anos': 24225, '5_anos': 35625 },
    badge: 'Eléctrico',
    specs: {
      capacidadCarga: '2,000 kg',
      anchoPasillo: '1,585 mm',
      longitudSinHorquillas: '3,020 mm',
      anchoTotal: '1,170 mm',
      alturaChasis: '2,078 mm',
      tipoMotor: 'Electrico AC Li-Ion',
      bateria: '48V Li-Ion / Carga rapida',
      mastil: 'Triple / Altura max. 4,500 mm',
    },
    descripcion: 'Montacarga eléctrico de última generación con batería de litio. Cero emisiones, carga rápida y máxima eficiencia para operaciones continuas en interiores.',
    caracteristicas: [
      'Batería de litio de carga rápida',
      'Motor AC de alta eficiencia',
      'Pantalla multifunción digital',
      'Dirección asistida eléctrica',
      'Cabina ergonómica con suspensión',
      'Pasillo estrecho - operación compacta',
    ],
    costoOperativo: { combustibleMes: 180, mantenimientoMes: 120 },
    usoRecomendado: {
      ambiente: ['interior', 'mixto'],
      industrias: ['almacen', 'manufactura', 'retail', 'farmaceutica'],
      frecuencia: ['2_turnos', '3_turnos'],
    },
  },
  {
    id: '2',
    slug: 'tan35d',
    modelo: 'TAN35D',
    marca: 'ANDINO',
    categoria: 'montacarga-combustion',
    categoriaLabel: 'Montacarga Combustión',
    capacidad: '3,500 kg',
    motor: 'Diesel',
    imagen: '/images/products/tan35d-nobg.png',
    imagenNoBg: '/images/products/tan35d-nobg.png',
    precioDesde: 22000,
    preciosAlquiler: { '1_ano': 10800, '2_anos': 19872, '3_anos': 27540, '5_anos': 40500 },
    badge: 'Mas Vendido',
    specs: {
      capacidadCarga: '3,500 kg',
      anchoPasillo: '2,510 mm',
      longitudSinHorquillas: '2,822 mm',
      anchoTotal: '1,200 mm',
      alturaChasis: '2,180 mm',
      tipoMotor: 'Diesel 3.3L Turbo',
      mastil: 'Triple / Altura max. 5,500 mm',
    },
    descripcion: 'Montacarga diésel de uso pesado para las operaciones más exigentes en exteriores. Potencia bruta con máxima fiabilidad para trabajo continuo.',
    caracteristicas: [
      'Motor diesel turbo de alto torque',
      'Transmisión automática powershift',
      'Sistema hidráulico de carga pesada',
      'Neumáticos sólidos para todo terreno',
      'Protección superior del operador',
      'Bajo consumo de combustible',
    ],
    costoOperativo: { combustibleMes: 850, mantenimientoMes: 350 },
    usoRecomendado: {
      ambiente: ['exterior', 'mixto'],
      industrias: ['construccion', 'logistica', 'agricola', 'manufactura'],
      frecuencia: ['2_turnos', '3_turnos'],
    },
  },
  {
    id: '3',
    slug: 'uprr15li',
    modelo: 'UPRR15Li',
    marca: 'UNILIFT',
    categoria: 'apilador-electrico',
    categoriaLabel: 'Apilador Eléctrico',
    capacidad: '1,500 kg',
    motor: 'Eléctrico',
    imagen: '/images/products/uprr15li-nobg.png',
    imagenNoBg: '/images/products/uprr15li-nobg.png',
    precioDesde: 8500,
    preciosAlquiler: { '1_ano': 4800, '2_anos': 8832, '3_anos': 12240, '5_anos': 18000 },
    badge: 'Compacto',
    specs: {
      capacidadCarga: '1,500 kg',
      anchoPasillo: '1,690 mm',
      longitudSinHorquillas: '2,230 mm',
      anchoTotal: '1,100 mm',
      alturaChasis: '70 mm',
      tipoMotor: 'Electrico Litio',
      bateria: '24V Li-Ion',
      mastil: 'Duplex / Altura max. 3,000 mm',
    },
    descripcion: 'Apilador eléctrico compacto con batería de litio de carga rápida. Perfecto para pasillos estrechos y almacenes de alta densidad.',
    caracteristicas: [
      'Batería de litio de carga rápida (2h)',
      'Ultra compacto para pasillos estrechos',
      'Operación peatonal o de conductor',
      'Elevación precisa con control proporcional',
      'Display digital multifunción',
      'Mantenimiento mínimo',
    ],
    costoOperativo: { combustibleMes: 80, mantenimientoMes: 60 },
    usoRecomendado: {
      ambiente: ['interior'],
      industrias: ['almacen', 'retail', 'farmaceutica'],
      frecuencia: ['1_turno', '2_turnos'],
    },
  },
];

export const accesorios: Accesorio[] = [
  // Seguridad
  { id: 'a1', nombre: 'Luces LED de Seguridad', descripcion: 'Sistema de luces LED perimetrales (zona azul/roja) para alertar peatones', precio: 450, categoria: 'seguridad',
    aplicable: ['montacarga', 'apilador', 'traspaleta', 'altura'] },
  { id: 'a2', nombre: 'Alarma de Reversa', descripcion: 'Alarma sonora y visual automática al retroceder', precio: 180, categoria: 'seguridad',
    aplicable: ['montacarga', 'apilador', 'traspaleta'] },
  { id: 'a3', nombre: 'Espejo Retrovisor Panorámico', descripcion: 'Espejo gran angular con visión de 180 grados', precio: 120, categoria: 'seguridad',
    aplicable: ['montacarga'] },
  { id: 'a4', nombre: 'Cinturón de Seguridad Retráctil', descripcion: 'Cinturón de 3 puntos con retractor automático', precio: 95, categoria: 'seguridad',
    aplicable: ['montacarga', 'altura'] },

  // Productividad
  { id: 'a5', nombre: 'Desplazador Lateral (Side Shift)', descripcion: 'Permite mover las horquillas lateralmente sin mover el equipo', precio: 1200, categoria: 'productividad',
    aplicable: ['montacarga'] },
  { id: 'a6', nombre: 'Horquillas Ajustables', descripcion: 'Horquillas con ajuste hidráulico de ancho para pallets varios', precio: 800, categoria: 'productividad',
    aplicable: ['montacarga'] },
  { id: 'a7', nombre: 'Pinza para Tambores', descripcion: 'Accesorio para manipulación segura de tambores y barriles', precio: 1500, categoria: 'productividad',
    aplicable: ['montacarga'] },
  { id: 'a8', nombre: 'Extensión de Horquillas', descripcion: 'Extensión metálica para cargas de mayor longitud', precio: 350, categoria: 'productividad',
    aplicable: ['montacarga', 'apilador'] },

  // Protección
  { id: 'a9', nombre: 'Cabina Cerrada con A/C', descripcion: 'Cabina cerrada con aire acondicionado y calefacción', precio: 3500, categoria: 'proteccion',
    aplicable: ['montacarga'] },
  { id: 'a10', nombre: 'Techo Protector de Lluvia', descripcion: 'Techo rígido con cortinas laterales transparentes', precio: 850, categoria: 'proteccion',
    aplicable: ['montacarga'] },
  { id: 'a11', nombre: 'Protector de Carga', descripcion: 'Rejilla protectora trasera para evitar caída de carga', precio: 280, categoria: 'proteccion',
    aplicable: ['montacarga', 'apilador'] },

  // Tecnología
  { id: 'a12', nombre: 'Cámara de Reversa HD', descripcion: 'Cámara trasera HD con monitor a color de 7 pulgadas', precio: 650, categoria: 'tecnologia',
    aplicable: ['montacarga'] },
  { id: 'a13', nombre: 'Telemetría GPS', descripcion: 'Sistema de rastreo GPS con reportes de uso y mantenimiento', precio: 900, categoria: 'tecnologia',
    aplicable: ['montacarga', 'apilador', 'traspaleta', 'altura'] },
  { id: 'a14', nombre: 'Control de Acceso RFID', descripcion: 'Sistema de arranque por tarjeta RFID para operadores autorizados', precio: 550, categoria: 'tecnologia',
    aplicable: ['montacarga', 'apilador', 'traspaleta', 'altura'] },
];

/**
 * Dada la categoría textual del producto, devuelve su bucket para
 * filtrar accesorios aplicables.
 */
export function categoriaBucket(categoriaLabel: string): CategoriaEquipo {
  const c = (categoriaLabel || '').toLowerCase();
  if (c.includes('apilador')) return 'apilador';
  if (c.includes('traspaleta')) return 'traspaleta';
  if (c.includes('mástil') || c.includes('mastil') || c.includes('plataforma')) return 'altura';
  return 'montacarga';
}

export function accesoriosParaCategoria(categoriaLabel: string): Accesorio[] {
  const bucket = categoriaBucket(categoriaLabel);
  return accesorios.filter(a => a.aplicable.includes(bucket));
}

export const categoriasAccesorios = [
  { id: 'seguridad', label: 'Seguridad', icon: 'shield' },
  { id: 'productividad', label: 'Productividad', icon: 'wrench' },
  { id: 'proteccion', label: 'Protección', icon: 'hard-hat' },
  { id: 'tecnologia', label: 'Tecnologia', icon: 'cpu' },
];

// Context options for smart form
export const industriaOptions = [
  { value: 'almacen', label: 'Almacén / Distribución' },
  { value: 'manufactura', label: 'Manufactura' },
  { value: 'construccion', label: 'Construcción' },
  { value: 'logistica', label: 'Logística / Transporte' },
  { value: 'retail', label: 'Retail / Comercio' },
  { value: 'agricola', label: 'Agrícola' },
  { value: 'farmaceutica', label: 'Farmacéutica' },
  { value: 'otro', label: 'Otro' },
];

export const ambienteOptions = [
  { value: 'interior', label: 'Interior (almacén, nave)' },
  { value: 'exterior', label: 'Exterior (patio, obra)' },
  { value: 'mixto', label: 'Mixto (ambos)' },
];

export const frecuenciaOptions = [
  { value: '1_turno', label: '1 turno (8h/día)' },
  { value: '2_turnos', label: '2 turnos (16h/día)' },
  { value: '3_turnos', label: '3 turnos (24h/día)' },
];

export const plazoOptions = [
  { value: 'inmediato', label: 'Lo necesito ya' },
  { value: '1-2-semanas', label: 'En 1-2 semanas' },
  { value: 'planificando', label: 'Estoy planificando' },
];

export function getRecommendation(
  industria: string,
  ambiente: string,
  frecuencia: string,
): { product: StoreProduct; modalidad: Modalidad; periodo?: PeriodoAlquiler; reason: string } | null {
  if (!industria && !ambiente && !frecuencia) return null;

  let bestProduct = storeProducts[0];
  let bestModalidad: Modalidad = 'venta';
  let bestPeriodo: PeriodoAlquiler | undefined;
  let reason = '';

  // Determine best product based on environment
  if (ambiente === 'exterior') {
    bestProduct = storeProducts.find(p => p.categoria === 'montacarga-combustion') || storeProducts[1];
    reason = 'Para operaciones en exterior, el motor diesel ofrece la potencia y resistencia necesaria.';
  } else if (ambiente === 'interior') {
    if (frecuencia === '1_turno') {
      bestProduct = storeProducts.find(p => p.categoria === 'apilador-electrico') || storeProducts[2];
      reason = 'Para un turno en interior, el apilador eléctrico es compacto y eficiente.';
    } else {
      bestProduct = storeProducts.find(p => p.categoria === 'montacarga-electrico') || storeProducts[0];
      reason = 'Para operaciones intensivas en interior, el montacarga eléctrico ofrece cero emisiones y máxima eficiencia.';
    }
  } else {
    // Mixed
    if (frecuencia === '3_turnos') {
      bestProduct = storeProducts[1]; // Diesel for heavy use
      reason = 'Para operación continua (3 turnos) en ambiente mixto, el diesel ofrece autonomía y potencia sin pausa.';
    } else {
      bestProduct = storeProducts[0]; // Electric for mixed moderate
      reason = 'Para uso mixto de 1 a 2 turnos, el eléctrico Li-Ion es versátil y de bajo costo operativo.';
    }
  }

  // Determine modality
  if (frecuencia === '1_turno') {
    bestModalidad = 'alquiler';
    bestPeriodo = '1_ano';
    reason += ' Con un turno diario, el alquiler optimiza tu inversión inicial.';
  } else if (frecuencia === '3_turnos') {
    bestModalidad = 'venta';
    reason += ' Con 3 turnos (24h/día), la compra es más rentable a largo plazo.';
  }

  // Industry-specific tweaks
  if (industria === 'construccion') {
    bestProduct = storeProducts[1];
    reason = 'Para construcción, el TAN35D diesel es el más resistente para terrenos irregulares y cargas pesadas.';
  } else if (industria === 'farmaceutica') {
    bestProduct = storeProducts[0];
    reason = 'Para farmacéutica, el eléctrico es ideal: cero emisiones, operación silenciosa y limpia.';
  }

  return { product: bestProduct, modalidad: bestModalidad, periodo: bestPeriodo, reason };
}
