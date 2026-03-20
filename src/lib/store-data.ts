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
  precioDesde: number;
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
}

export interface Accesorio {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: 'seguridad' | 'productividad' | 'proteccion' | 'tecnologia';
  imagen?: string;
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
    imagen: '/images/products/u20w3li.jpeg',
    precioDesde: 19800,
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
    imagen: '/images/products/tan35d.jpeg',
    precioDesde: 22000,
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
    imagen: '/images/products/uprr15li.jpeg',
    precioDesde: 8500,
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
