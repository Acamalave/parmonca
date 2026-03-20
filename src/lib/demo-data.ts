import { Cliente, Producto, Cotizacion, Factura, Pago, PipelineCard, Notificacion } from '@/types';

export const usuarios = [
  { id: '1', nombre: 'Acacio Malave', email: 'acacio@parmonca.com', rol: 'super-admin' as const },
  { id: '2', nombre: 'Carlos Mendez', email: 'carlos@parmonca.com', rol: 'asesor' as const },
  { id: '3', nombre: 'Maria Rodriguez', email: 'maria@parmonca.com', rol: 'asesor' as const },
  { id: '4', nombre: 'Jose Herrera', email: 'jose@parmonca.com', rol: 'gerente' as const },
];

export const clientes: Cliente[] = [
  { id: '1', nombre: 'Distribuidora Central S.A.', telefono: '+507 6234-5678', email: 'compras@distcentral.com', pais: 'Panama', ciudad: 'Ciudad de Panama', direccion: 'Via España 123', tipo: 'customer', contactoPrincipal: 'Roberto Jimenez', cargoContacto: 'Gerente de Compras', comercialAsignado: 'Carlos Mendez', empresaAsignada: 'PARMONCA Panama', markup: 25, estado: 'activo', creadoEn: '2025-08-15', notas: 'Cliente frecuente, 3 compras anteriores' },
  { id: '2', nombre: 'Logistica del Pacifico', telefono: '+506 8765-4321', email: 'ops@logpac.cr', pais: 'Costa Rica', ciudad: 'San Jose', direccion: 'La Uruca, Calle 40', tipo: 'customer', contactoPrincipal: 'Ana Morales', cargoContacto: 'CEO', comercialAsignado: 'Maria Rodriguez', empresaAsignada: 'PARMONCA Costa Rica', markup: 30, estado: 'activo', creadoEn: '2025-06-20', notas: 'Interesada en flota de 5 montacargas' },
  { id: '3', nombre: 'Almacenes Unidos C.A.', telefono: '+58 212-456-7890', email: 'gerencia@almaunidos.com.ve', pais: 'Venezuela', ciudad: 'Caracas', direccion: 'Av. Libertador, Torre Norte', tipo: 'lead', contactoPrincipal: 'Pedro Gonzalez', cargoContacto: 'Presidente', comercialAsignado: 'Carlos Mendez', empresaAsignada: 'MEGALIFT', markup: 35, estado: 'activo', creadoEn: '2026-01-10', notas: 'Lead nuevo, requiere cotizacion de apiladores' },
  { id: '4', nombre: 'TransCarga Guatemala', telefono: '+502 5543-2100', email: 'ventas@transcarga.gt', pais: 'Guatemala', ciudad: 'Ciudad de Guatemala', direccion: 'Zona 10, 4a Avenida', tipo: 'customer', contactoPrincipal: 'Luis Estrada', cargoContacto: 'Director de Operaciones', comercialAsignado: 'Jose Herrera', empresaAsignada: 'Grupo RCA', markup: 28, estado: 'activo', creadoEn: '2025-04-05', notas: 'Renta mensual de 2 montacargas' },
  { id: '5', nombre: 'Puerto Industrial HN', telefono: '+504 9988-7766', email: 'admin@puertoindustrial.hn', pais: 'Honduras', ciudad: 'San Pedro Sula', direccion: 'Blvd. del Norte Km 5', tipo: 'lead', contactoPrincipal: 'Carmen Reyes', cargoContacto: 'Compradora', comercialAsignado: 'Maria Rodriguez', empresaAsignada: 'PARMONCA Panama', markup: 30, estado: 'activo', creadoEn: '2026-02-28', notas: 'Solicito informacion de traspaletas electricas' },
  { id: '6', nombre: 'Bodega Express Nicaragua', telefono: '+505 8877-6655', email: 'contacto@bodegaexpress.ni', pais: 'Nicaragua', ciudad: 'Managua', direccion: 'Km 8 Carretera Norte', tipo: 'lead', contactoPrincipal: 'Fernando Lacayo', cargoContacto: 'Gerente General', comercialAsignado: 'Carlos Mendez', empresaAsignada: 'Uniparts Andina', markup: 32, estado: 'activo', creadoEn: '2026-03-05', notas: 'Primer contacto via web' },
  { id: '7', nombre: 'Industrias del Caribe S.A.', telefono: '+507 6100-2233', email: 'operaciones@indcaribe.com', pais: 'Panama', ciudad: 'Colon', direccion: 'Zona Libre, Edificio 45', tipo: 'customer', contactoPrincipal: 'Miguel Torres', cargoContacto: 'Gerente de Planta', comercialAsignado: 'Jose Herrera', empresaAsignada: 'MEGALIFT', markup: 25, estado: 'activo', creadoEn: '2025-09-12', notas: 'Cliente VIP, 8 equipos en operacion' },
  { id: '8', nombre: 'AgroExport Haiti', telefono: '+509 3344-5566', email: 'direction@agroexport.ht', pais: 'Haiti', ciudad: 'Port-au-Prince', direccion: 'Rue du Commerce 78', tipo: 'lead', contactoPrincipal: 'Jean Pierre Duval', cargoContacto: 'Director', comercialAsignado: 'Carlos Mendez', empresaAsignada: 'PARMONCA Panama', markup: 35, estado: 'activo', creadoEn: '2026-03-10', notas: 'Requiere montacargas para almacen agricola' },
];

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

export const cotizaciones: Cotizacion[] = [
  { id: '1', numero: 'COT-2026-001', clienteId: '1', clienteNombre: 'Distribuidora Central S.A.', tipo: 'venta', estado: 'aceptada', items: [{ productoId: '1', modelo: 'ML-E20', cantidad: 2, precioUnitario: 23125, precioTotal: 46250 }], subtotal: 46250, impuesto: 3237.5, total: 49487.5, empresaCotizadora: 'PARMONCA Panama', markup: 25, comercialAsignado: 'Carlos Mendez', condicionesPago: '50% anticipo, 50% contra entrega', validezDias: 30, notas: 'Incluye capacitacion de operadores', creadoEn: '2026-01-15', enviadoEn: '2026-01-16' },
  { id: '2', numero: 'COT-2026-002', clienteId: '2', clienteNombre: 'Logistica del Pacifico', tipo: 'venta', estado: 'enviada', items: [{ productoId: '3', modelo: 'ML-C25', cantidad: 3, precioUnitario: 20540, precioTotal: 61620 }, { productoId: '7', modelo: 'UNI-TP20', cantidad: 2, precioUnitario: 5460, precioTotal: 10920 }], subtotal: 72540, impuesto: 9430.2, total: 81970.2, empresaCotizadora: 'PARMONCA Costa Rica', markup: 30, comercialAsignado: 'Maria Rodriguez', condicionesPago: '30% anticipo, 70% financiado a 6 meses', validezDias: 15, notas: 'Cliente solicita descuento por volumen', creadoEn: '2026-02-20', enviadoEn: '2026-02-21' },
  { id: '3', numero: 'COT-2026-003', clienteId: '3', clienteNombre: 'Almacenes Unidos C.A.', tipo: 'venta', estado: 'borrador', items: [{ productoId: '5', modelo: 'AND-E15S', cantidad: 4, precioUnitario: 11475, precioTotal: 45900 }], subtotal: 45900, impuesto: 7344, total: 53244, empresaCotizadora: 'MEGALIFT', markup: 35, comercialAsignado: 'Carlos Mendez', condicionesPago: '100% anticipo', validezDias: 30, notas: '', creadoEn: '2026-03-01' },
  { id: '4', numero: 'COT-2026-004', clienteId: '4', clienteNombre: 'TransCarga Guatemala', tipo: 'renta', estado: 'aceptada', items: [{ productoId: '4', modelo: 'ML-C35', cantidad: 2, precioUnitario: 1800, precioTotal: 3600 }], subtotal: 3600, impuesto: 0, total: 3600, empresaCotizadora: 'Grupo RCA', markup: 28, comercialAsignado: 'Jose Herrera', condicionesPago: 'Mensual anticipado', validezDias: 30, notas: 'Renta mensual incluye mantenimiento', creadoEn: '2025-11-10', enviadoEn: '2025-11-12' },
  { id: '5', numero: 'COT-2026-005', clienteId: '7', clienteNombre: 'Industrias del Caribe S.A.', tipo: 'venta', estado: 'en-estudio', items: [{ productoId: '9', modelo: 'ML-R16', cantidad: 1, precioUnitario: 35000, precioTotal: 35000 }, { productoId: '12', modelo: 'ML-R20', cantidad: 1, precioUnitario: 40000, precioTotal: 40000 }], subtotal: 75000, impuesto: 5250, total: 80250, empresaCotizadora: 'MEGALIFT', markup: 25, comercialAsignado: 'Jose Herrera', condicionesPago: '40% anticipo, 60% financiado', validezDias: 20, notas: 'Cliente VIP, aplicar mejores condiciones', creadoEn: '2026-03-05', enviadoEn: '2026-03-06' },
  { id: '6', numero: 'COT-2026-006', clienteId: '5', clienteNombre: 'Puerto Industrial HN', tipo: 'venta', estado: 'enviada', items: [{ productoId: '7', modelo: 'UNI-TP20', cantidad: 5, precioUnitario: 5460, precioTotal: 27300 }, { productoId: '8', modelo: 'UNI-TP25', cantidad: 3, precioUnitario: 6630, precioTotal: 19890 }], subtotal: 47190, impuesto: 3303.3, total: 50493.3, empresaCotizadora: 'PARMONCA Panama', markup: 30, comercialAsignado: 'Maria Rodriguez', condicionesPago: '50% anticipo, 50% contra entrega', validezDias: 15, notas: 'Envio a San Pedro Sula', creadoEn: '2026-03-10', enviadoEn: '2026-03-11' },
  { id: '7', numero: 'COT-2026-007', clienteId: '6', clienteNombre: 'Bodega Express Nicaragua', tipo: 'venta', estado: 'borrador', items: [{ productoId: '11', modelo: 'UNI-E25', cantidad: 1, precioUnitario: 27720, precioTotal: 27720 }], subtotal: 27720, impuesto: 0, total: 27720, empresaCotizadora: 'Uniparts Andina', markup: 32, comercialAsignado: 'Carlos Mendez', condicionesPago: 'Por definir', validezDias: 30, notas: 'Primer contacto, pendiente validar necesidad exacta', creadoEn: '2026-03-15' },
  { id: '8', numero: 'COT-2026-008', clienteId: '8', clienteNombre: 'AgroExport Haiti', tipo: 'venta', estado: 'rechazada', items: [{ productoId: '10', modelo: 'AND-C30', cantidad: 2, precioUnitario: 23625, precioTotal: 47250 }], subtotal: 47250, impuesto: 0, total: 47250, empresaCotizadora: 'PARMONCA Panama', markup: 35, comercialAsignado: 'Carlos Mendez', condicionesPago: '100% anticipo', validezDias: 15, notas: 'Cliente rechazo por precio', creadoEn: '2026-02-01', enviadoEn: '2026-02-02' },
];

export const facturas: Factura[] = [
  { id: '1', numero: 'FAC-2026-001', cotizacionId: '1', clienteId: '1', clienteNombre: 'Distribuidora Central S.A.', items: cotizaciones[0].items, subtotal: 46250, impuesto: 3237.5, total: 49487.5, estado: 'pagada', fechaEmision: '2026-01-20', fechaVencimiento: '2026-02-20', montoPagado: 49487.5, comercialAsignado: 'Carlos Mendez' },
  { id: '2', numero: 'FAC-2026-002', cotizacionId: '4', clienteId: '4', clienteNombre: 'TransCarga Guatemala', items: cotizaciones[3].items, subtotal: 3600, impuesto: 0, total: 3600, estado: 'pagada', fechaEmision: '2025-12-01', fechaVencimiento: '2025-12-15', montoPagado: 3600, comercialAsignado: 'Jose Herrera' },
  { id: '3', numero: 'FAC-2026-003', cotizacionId: '4', clienteId: '4', clienteNombre: 'TransCarga Guatemala', items: cotizaciones[3].items, subtotal: 3600, impuesto: 0, total: 3600, estado: 'pendiente', fechaEmision: '2026-03-01', fechaVencimiento: '2026-03-15', montoPagado: 0, comercialAsignado: 'Jose Herrera' },
  { id: '4', numero: 'FAC-2026-004', cotizacionId: '4', clienteId: '4', clienteNombre: 'TransCarga Guatemala', items: cotizaciones[3].items, subtotal: 3600, impuesto: 0, total: 3600, estado: 'vencida', fechaEmision: '2026-01-01', fechaVencimiento: '2026-01-15', montoPagado: 0, comercialAsignado: 'Jose Herrera' },
  { id: '5', numero: 'FAC-2026-005', cotizacionId: '4', clienteId: '4', clienteNombre: 'TransCarga Guatemala', items: cotizaciones[3].items, subtotal: 3600, impuesto: 0, total: 3600, estado: 'vencida', fechaEmision: '2026-02-01', fechaVencimiento: '2026-02-15', montoPagado: 0, comercialAsignado: 'Jose Herrera' },
];

export const pagos: Pago[] = [
  { id: '1', facturaId: '1', clienteNombre: 'Distribuidora Central S.A.', monto: 24743.75, metodoPago: 'transferencia', referencia: 'TRF-20260120-001', fecha: '2026-01-20' },
  { id: '2', facturaId: '1', clienteNombre: 'Distribuidora Central S.A.', monto: 24743.75, metodoPago: 'transferencia', referencia: 'TRF-20260215-002', fecha: '2026-02-15' },
  { id: '3', facturaId: '2', clienteNombre: 'TransCarga Guatemala', monto: 3600, metodoPago: 'transferencia', referencia: 'TRF-20251201-003', fecha: '2025-12-05' },
];

export const pipelineCards: PipelineCard[] = [
  { id: '1', cotizacionId: '6', clienteNombre: 'Bodega Express Nicaragua', monto: 27720, comercial: 'Carlos Mendez', etapa: 'prospecto', diasEnEtapa: 4 },
  { id: '2', cotizacionId: '8', clienteNombre: 'AgroExport Haiti', monto: 47250, comercial: 'Carlos Mendez', etapa: 'prospecto', diasEnEtapa: 9 },
  { id: '3', cotizacionId: '3', clienteNombre: 'Almacenes Unidos C.A.', monto: 53244, comercial: 'Carlos Mendez', etapa: 'contacto', diasEnEtapa: 18 },
  { id: '4', cotizacionId: '6', clienteNombre: 'Puerto Industrial HN', monto: 50493.3, comercial: 'Maria Rodriguez', etapa: 'cotizado', diasEnEtapa: 8 },
  { id: '5', cotizacionId: '2', clienteNombre: 'Logistica del Pacifico', monto: 81970.2, comercial: 'Maria Rodriguez', etapa: 'negociacion', diasEnEtapa: 27 },
  { id: '6', cotizacionId: '5', clienteNombre: 'Industrias del Caribe S.A.', monto: 80250, comercial: 'Jose Herrera', etapa: 'negociacion', diasEnEtapa: 14 },
  { id: '7', cotizacionId: '1', clienteNombre: 'Distribuidora Central S.A.', monto: 49487.5, comercial: 'Carlos Mendez', etapa: 'ganada', diasEnEtapa: 0 },
  { id: '8', cotizacionId: '4', clienteNombre: 'TransCarga Guatemala', monto: 3600, comercial: 'Jose Herrera', etapa: 'ganada', diasEnEtapa: 0 },
];

export const notificaciones: Notificacion[] = [
  { id: '1', tipo: 'factura', titulo: 'Factura vencida', mensaje: 'FAC-2026-004 de TransCarga Guatemala vencida hace 63 dias', leida: false, fecha: '2026-03-19', link: '/facturas/4' },
  { id: '2', tipo: 'factura', titulo: 'Factura vencida', mensaje: 'FAC-2026-005 de TransCarga Guatemala vencida hace 32 dias', leida: false, fecha: '2026-03-19', link: '/facturas/5' },
  { id: '3', tipo: 'lead', titulo: 'Lead sin atender', mensaje: 'AgroExport Haiti lleva 9 dias sin seguimiento', leida: false, fecha: '2026-03-19', link: '/clientes/8' },
  { id: '4', tipo: 'cotizacion', titulo: 'Cotizacion en estudio', mensaje: 'Industrias del Caribe esta evaluando COT-2026-005 ($80,250)', leida: true, fecha: '2026-03-18', link: '/cotizaciones/5' },
  { id: '5', tipo: 'pago', titulo: 'Pago recibido', mensaje: 'Distribuidora Central pago $24,743.75 - FAC-2026-001', leida: true, fecha: '2026-02-15', link: '/facturas/1' },
  { id: '6', tipo: 'cotizacion', titulo: 'Nueva cotizacion creada', mensaje: 'COT-2026-007 para Bodega Express Nicaragua por $27,720', leida: true, fecha: '2026-03-15', link: '/cotizaciones/7' },
];

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
