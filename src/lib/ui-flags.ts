/**
 * Flags de UI controlables a mano (sin panel de admin todavía).
 */

/**
 * Master switch para la zona de imagen de los REPUESTOS
 * (RepuestosSection y /repuestos/[id]).
 *
 * Sólo aplica a repuestos. Los equipos (montacargas / apiladores) en
 * /productos muestran SIEMPRE su imagen y no dependen de este flag.
 *
 * Con `true`, cada tarjeta de repuesto decide por sí misma: muestra la imagen
 * SÓLO si el repuesto tiene `imagen_url`; si no la tiene, no renderiza la zona
 * de imagen (no se ve el campo vacío). Así, a medida que el backfill de Odoo
 * va cargando fotos, van apareciendo solas.
 *
 * Con `false`, se oculta la zona de imagen en todos los repuestos
 * (kill-switch, p. ej. si las fotos se ven mal y se quiere volver a texto).
 */
export const SHOW_CATALOG_IMAGES = true;
