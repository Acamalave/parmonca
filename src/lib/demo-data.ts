import { Cliente, Producto, Cotizacion, Factura, Pago, PipelineCard, Notificacion } from '@/types';

export const usuarios = [
  { id: '1', nombre: 'Acacio Malave', email: 'acacio@parmonca.com', rol: 'super-admin' as const },
  { id: '2', nombre: 'Carlos Mendez', email: 'carlos@parmonca.com', rol: 'asesor' as const },
  { id: '3', nombre: 'Maria Rodriguez', email: 'maria@parmonca.com', rol: 'asesor' as const },
  { id: '4', nombre: 'Jose Herrera', email: 'jose@parmonca.com', rol: 'gerente' as const },
];

// Operación real — ya no usamos clientes hardcoded.
// La info de clientes ahora viene de parmonca_clientes (Supabase).
export const clientes: Cliente[] = [];

export const productos: Producto[] = [
  { id: '1', modelo: 'ML-E20', categoria: 'montacarga-electrico', marca: 'MEGALIFT', motor: 'Electrico 48V', mastil: 'Triple 4.5m', capacidad: '2,000 kg', precioBase: 18500, imagen: '/images/isotipo-p.png', descripcion: 'Montacarga electrico ideal para interiores y almacenes' },
  { id: '2', modelo: 'ML-E30', categoria: 'montacarga-electrico', marca: 'MEGALIFT', motor: 'Electrico 80V', mastil: 'Triple 5.0m', capacidad: '3,000 kg', precioBase: 24000, imagen: '/images/isotipo-p.png', descripcion: 'Montacarga electrico de alta capacidad' },
  { id: '3', modelo: 'ML-C25', categoria: 'montacarga-combustion', marca: 'MEGALIFT', motor: 'Diesel 2.4L', mastil: 'Duplex 4.0m', capacidad: '2,500 kg', precioBase: 15800, imagen: '/images/isotipo-p.png', descripcion: 'Montacarga diesel para trabajo pesado en exteriores' },
  { id: '4', modelo: 'ML-C35', categoria: 'montacarga-combustion', marca: 'MEGALIFT', motor: 'Diesel 3.3L', mastil: 'Triple 5.5m', capacidad: '3,500 kg', precioBase: 22000, imagen: '/images/isotipo-p.png', descripcion: 'Montacarga diesel de alto rendimiento' },
  { id: '5', modelo: 'AND-E15S', categoria: 'apilador-electrico', marca: 'ANDINO', motor: 'Electrico 24V', mastil: 'Simplex 3.0m', capacidad: '1,500 kg', precioBase: 8500, imagen: '/images/isotipo-p.png', descripcion: 'Apilador electrico compacto para pasillos estrechos' },
  { id: '6', modelo: 'AND-E20S', categoria: 'apilador-electrico', marca: 'ANDINO', motor: 'Electrico 24V', mastil: 'Duplex 3.5m', capacidad: '2,000 kg', precioBase: 11200, imagen: '/images/isotipo-p.png', descripcion: 'Apilador electrico de doble mastil' },
  { id: '7', modelo: 'UNI-TP20', categoria: 'traspaleta-electrica', marca: 'UNILIFT', motor: 'Electrico 24V', mastil: 'N/A', capacidad: '2,000 kg', precioBase: 4200, imagen: '/images/isotipo-p.png', descripcion: 'Traspaleta electrica para movimiento horizontal' },
  { id: '8', modelo: 'UNI-TP25', categoria: 'traspaleta-electrica', marca: 'UNILIFT', motor: 'Electrico 24V', mastil: 'N/A', capacidad: '2,500 kg', precioBase: 5100, imagen: '/images/isotipo-p.png', descripcion: 'Traspaleta electrica de alta capacidad' },
  { id: '9', modelo: 'ML-R16', categoria: 'mastil-retractil', marca: 'MEGALIFT', motor: 'Electrico 48V', mastil: 'Triple 7.0m', capacidad: '1,600 kg', precioBase: 28000, imagen: '/images/isotipo-p.png', descripcion: 'Mastil retractil para almacenes de altura' },
  { id: '10', modelo: 'AND-C30', categoria: 'montacarga-combustion', marca: 'ANDINO', motor: 'GLP 2.0L', mastil: 'Duplex 4.5m', capacidad: '3,000 kg', precioBase: 17500, imagen: '/images/isotipo-p.png', descripcion: 'Montacarga a gas para uso mixto interior/exterior' },
  { id: '11', modelo: 'UNI-E25', categoria: 'montacarga-electrico', marca: 'UNILIFT', motor: 'Electrico 60V', mastil: 'Triple 4.8m', capacidad: '2,500 kg', precioBase: 21000, imagen: '/images/isotipo-p.png', descripcion: 'Montacarga electrico premium de ultima generacion' },
  { id: '12', modelo: 'ML-R20', categoria: 'mastil-retractil', marca: 'MEGALIFT', motor: 'Electrico 48V', mastil: 'Triple 8.5m', capacidad: '2,000 kg', precioBase: 32000, imagen: '/images/isotipo-p.png', descripcion: 'Mastil retractil de alcance extremo' },
];

// Operación real — todas las cotizaciones, facturas, pagos y pipeline
// vienen de Supabase. Estos arrays se mantienen vacíos para satisfacer
// los tipos de componentes legacy que aún los importan.
export const cotizaciones: Cotizacion[] = [];

export const facturas: Factura[] = [];

export const pagos: Pago[] = [];

export const pipelineCards: PipelineCard[] = [];

export const notificaciones: Notificacion[] = [];

export const categoriasProducto = [
  { value: 'montacarga-electrico', label: 'Montacarga Electrico' },
  { value: 'montacarga-combustion', label: 'Montacarga Combustion' },
  { value: 'apilador-electrico', label: 'Apilador Electrico' },
  { value: 'traspaleta-electrica', label: 'Traspaleta Electrica' },
  { value: 'mastil-retractil', label: 'Mastil Retractil' },
];

export const empresasCotizadoras = [
  'PARMONCA Panama',
  'PARMONCA Costa Rica',
  'MEGALIFT',
  'Uniparts Andina',
  'Grupo RCA',
];

export const paises = ['Panama', 'Costa Rica', 'Venezuela', 'Guatemala', 'Honduras', 'Nicaragua', 'Haiti'];
