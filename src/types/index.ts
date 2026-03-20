export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  pais: string;
  ciudad: string;
  direccion: string;
  tipo: 'lead' | 'customer';
  contactoPrincipal: string;
  cargoContacto: string;
  comercialAsignado: string;
  empresaAsignada: string;
  markup: number;
  estado: 'activo' | 'inactivo';
  creadoEn: string;
  notas: string;
}

export interface Producto {
  id: string;
  modelo: string;
  categoria: 'montacarga-electrico' | 'montacarga-combustion' | 'apilador-electrico' | 'traspaleta-electrica' | 'mastil-retractil';
  marca: 'MEGALIFT' | 'ANDINO' | 'UNILIFT';
  motor: string;
  mastil: string;
  capacidad: string;
  precioBase: number;
  imagen: string;
  descripcion: string;
}

export interface ItemCotizacion {
  productoId: string;
  modelo: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
}

export interface Cotizacion {
  id: string;
  numero: string;
  clienteId: string;
  clienteNombre: string;
  tipo: 'venta' | 'renta';
  estado: 'borrador' | 'enviada' | 'en-estudio' | 'aceptada' | 'rechazada';
  items: ItemCotizacion[];
  subtotal: number;
  impuesto: number;
  total: number;
  empresaCotizadora: string;
  markup: number;
  comercialAsignado: string;
  condicionesPago: string;
  validezDias: number;
  notas: string;
  creadoEn: string;
  enviadoEn?: string;
}

export interface Factura {
  id: string;
  numero: string;
  cotizacionId: string;
  clienteId: string;
  clienteNombre: string;
  items: ItemCotizacion[];
  subtotal: number;
  impuesto: number;
  total: number;
  estado: 'borrador' | 'pendiente' | 'pagada' | 'parcial' | 'vencida';
  fechaEmision: string;
  fechaVencimiento: string;
  montoPagado: number;
  comercialAsignado: string;
}

export interface Pago {
  id: string;
  facturaId: string;
  clienteNombre: string;
  monto: number;
  metodoPago: 'transferencia' | 'efectivo' | 'tarjeta' | 'cheque';
  referencia: string;
  fecha: string;
}

export interface PipelineCard {
  id: string;
  cotizacionId: string;
  clienteNombre: string;
  monto: number;
  comercial: string;
  etapa: 'prospecto' | 'contacto' | 'cotizado' | 'negociacion' | 'ganada' | 'perdida';
  diasEnEtapa: number;
  razonPerdida?: string;
}

export interface Notificacion {
  id: string;
  tipo: 'cotizacion' | 'factura' | 'lead' | 'meta' | 'pago';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  link?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'super-admin' | 'gerente' | 'asesor';
  avatar?: string;
}
