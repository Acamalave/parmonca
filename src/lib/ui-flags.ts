/**
 * Flags de UI controlables a mano (sin panel de admin todavía).
 */

/**
 * Mostrar la zona de imagen en las tarjetas/detalle del catálogo público
 * (RepuestosSection, /productos, /repuestos/[id]).
 *
 * Lo dejamos en `false` mientras el catálogo no tiene todas las fotos
 * sincronizadas desde Odoo — así las tarjetas se ven limpias y enfocadas en
 * texto en vez de mostrar un placeholder gris vacío.
 *
 * El backfill de imágenes corre por cron (ver /api/odoo/sync). Cuando la
 * mayoría de los productos ya tenga `imagen_url`, cambiar esto a `true` para
 * volver a mostrar las imágenes — no requiere ningún otro cambio.
 */
export const SHOW_CATALOG_IMAGES = false;
