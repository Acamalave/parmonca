/**
 * Flags de UI controlables a mano (sin panel de admin todavía).
 */

/**
 * Master switch para la zona de imagen en el catálogo público
 * (RepuestosSection, /productos, /repuestos/[id]).
 *
 * Con `true`, cada tarjeta decide por sí misma: muestra la imagen SÓLO si el
 * producto tiene `imagen_url`/`imagen`; si no la tiene, no renderiza la zona
 * de imagen (no se ve el campo vacío). Así, a medida que el backfill de Odoo
 * va cargando fotos, van apareciendo solas.
 *
 * Con `false`, se oculta la zona de imagen en TODO el catálogo (kill-switch
 * global, p. ej. si las fotos se ven mal y se quiere volver a texto puro).
 */
export const SHOW_CATALOG_IMAGES = true;
