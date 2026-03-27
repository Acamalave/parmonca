export type Modalidad = 'venta' | 'alquiler';
export type PeriodoAlquiler = 'diario' | 'semanal' | 'mensual' | 'anual';

export interface PreciosAlquiler {
  diario: number;
  semanal: number;
  mensual: number;
  anual: number;
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
    frecuencia: ('ocasional' | 'turno-completo' | '24-7')[];
  };
}

export interface Accesorio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: 'seguridad' | 'productividad' | 'proteccion' | 'tecnologia';
  imagen?: string;
}

export const periodoLabels: Record<PeriodoAlquiler, string> = {
  diario: 'Día',
  semanal: 'Semana',
  mensual: 'Mes',
  anual: 'Año',
};

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
    preciosAlquiler: { diario: 250, semanal: 850, mensual: 2200, anual: 9500 },
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
      frecuencia: ['turno-completo', '24-7'],
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
    preciosAlquiler: { diario: 280, semanal: 950, mensual: 2500, anual: 10800 },
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
      frecuencia: ['turno-completo', '24-7'],
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
    preciosAlquiler: { diario: 120, semanal: 420, mensual: 1100, anual: 4800 },
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
      frecuencia: ['ocasional', 'turno-completo'],
    },
  },
];

export const accesorios: Accesorio[] = [
  { id: 'a1', nombre: 'Luces LED de Seguridad', descripcion: 'Sistema de luces LED perimetrales (zona azul/roja) para alertar peatones', precio: 450, categoria: 'seguridad' },
  { id: 'a2', nombre: 'Alarma de Reversa', descripcion: 'Alarma sonora y visual automática al retroceder', precio: 180, categoria: 'seguridad' },
  { id: 'a3', nombre: 'Espejo Retrovisor Panorámico', descripcion: 'Espejo gran angular con vision de 180 grados', precio: 120, categoria: 'seguridad' },
  { id: 'a4', nombre: 'Cinturón de Seguridad Retráctil', descripcion: 'Cinturón de 3 puntos con retractor automático', precio: 95, categoria: 'seguridad' },
  { id: 'a5', nombre: 'Desplazador Lateral (Side Shift)', descripcion: 'Permite mover las horquillas lateralmente sin mover el equipo', precio: 1200, categoria: 'productividad' },
  { id: 'a6', nombre: 'Horquillas Ajustables', descripcion: 'Horquillas con ajuste hidráulico de ancho para pallets varios', precio: 800, categoria: 'productividad' },
  { id: 'a7', nombre: 'Pinza para Tambores', descripcion: 'Accesorio para manipulación segura de tambores y barriles', precio: 1500, categoria: 'productividad' },
  { id: 'a8', nombre: 'Extensión de Horquillas', descripcion: 'Extensión metálica para cargas de mayor longitud', precio: 350, categoria: 'productividad' },
  { id: 'a9', nombre: 'Cabina Cerrada con A/C', descripcion: 'Cabina cerrada con aire acondicionado y calefacción', precio: 3500, categoria: 'proteccion' },
  { id: 'a10', nombre: 'Techo Protector de Lluvia', descripcion: 'Techo rigido con cortinas laterales transparentes', precio: 850, categoria: 'proteccion' },
  { id: 'a11', nombre: 'Protector de Carga', descripcion: 'Rejilla protectora trasera para evitar caida de carga', precio: 280, categoria: 'proteccion' },
  { id: 'a12', nombre: 'Cámara de Reversa HD', descripcion: 'Cámara trasera HD con monitor a color de 7 pulgadas', precio: 650, categoria: 'tecnologia' },
  { id: 'a13', nombre: 'Telemetría GPS', descripcion: 'Sistema de rastreo GPS con reportes de uso y mantenimiento', precio: 900, categoria: 'tecnologia' },
  { id: 'a14', nombre: 'Control de Acceso RFID', descripcion: 'Sistema de arranque por tarjeta RFID para operadores autorizados', precio: 550, categoria: 'tecnologia' },
];

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
  { value: 'ocasional', label: 'Ocasional (pocas horas/semana)' },
  { value: 'turno-completo', label: 'Turno completo (8h/día)' },
  { value: '24-7', label: 'Operación continua (24/7)' },
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
    if (frecuencia === 'ocasional') {
      bestProduct = storeProducts.find(p => p.categoria === 'apilador-electrico') || storeProducts[2];
      reason = 'Para uso interior ocasional, el apilador eléctrico es compacto y eficiente.';
    } else {
      bestProduct = storeProducts.find(p => p.categoria === 'montacarga-electrico') || storeProducts[0];
      reason = 'Para operaciones intensivas en interior, el montacarga eléctrico ofrece cero emisiones y máxima eficiencia.';
    }
  } else {
    // Mixed
    if (frecuencia === '24-7') {
      bestProduct = storeProducts[1]; // Diesel for heavy use
      reason = 'Para operación continua mixta, el diesel ofrece autonomía y potencia sin pausa.';
    } else {
      bestProduct = storeProducts[0]; // Electric for mixed moderate
      reason = 'Para uso mixto moderado, el eléctrico Li-Ion es versátil y de bajo costo operativo.';
    }
  }

  // Determine modality
  if (frecuencia === 'ocasional') {
    bestModalidad = 'alquiler';
    bestPeriodo = 'mensual';
    reason += ' Con uso ocasional, el alquiler optimiza tu inversión.';
  } else if (frecuencia === '24-7') {
    bestModalidad = 'venta';
    reason += ' Con operación 24/7, la compra es más rentable a largo plazo.';
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
