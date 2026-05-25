/**
 * Motor de recomendación inteligente.
 *
 * Toma las respuestas del Asesor Virtual y devuelve los Top-N productos
 * que mejor se ajustan a la operación del cliente, con razones específicas
 * por las que cada uno fue elegido.
 *
 * Reglas de prioridad:
 * 1. **UNILIFT siempre arriba** — es la marca propia de PARMONCA, prioridad estratégica.
 * 2. **Match con ambiente** — eléctrico para interior, combustión para exterior.
 * 3. **Match con industria** — apiladores para almacén, montacargas pesados para construcción.
 * 4. **Match con frecuencia** — diesel para 3 turnos (24h/día), eléctrico para 1-2 turnos.
 * 5. **Calidad de presentación** — productos con imagen tienen prioridad.
 *
 * Solo se recomienda si el match es genuino (score mínimo > 0). No se hacen
 * recomendaciones a la ligera: si las respuestas no encajan, devolvemos vacío.
 */

import type { StoreProduct } from '@/lib/store-data';

export type AsesorAnswers = {
  ambiente?: string; // 'interior' | 'exterior' | 'mixto'
  industria?: string;
  frecuencia?: string;
  plazo?: string;
};

export type Recomendacion = {
  product: StoreProduct;
  score: number;
  reasons: string[];   // 2–3 frases cortas justificando
  badge: string;       // etiqueta visible
  marca_destacada: boolean;
  /**
   * true cuando ningún producto alcanzó el umbral de match fuerte y devolvemos
   * los más cercanos como "mejor esfuerzo". El frontend usa esto para mostrar
   * un mensaje suave ("Estas son las opciones más cercanas, confirma con un
   * asesor") en lugar de las razones positivas habituales.
   */
  bestEffort?: boolean;
};

const ELECTRIC_HINTS = ['eléctric', 'electric', 'li-ion', 'litio'];
const COMBUSTION_HINTS = ['combust', 'diesel', 'gas/lpg', 'dual fuel', 'dual-fuel'];

function parseCapacidadKg(s: string | null | undefined): number {
  if (!s) return 0;
  const m = String(s).replace(/[^\d]/g, '');
  return m ? parseInt(m, 10) : 0;
}

function isElectric(p: StoreProduct): boolean {
  const cat = p.categoriaLabel.toLowerCase();
  const motor = (p.motor || '').toLowerCase();
  return ELECTRIC_HINTS.some(h => cat.includes(h) || motor.includes(h));
}

function isCombustion(p: StoreProduct): boolean {
  const cat = p.categoriaLabel.toLowerCase();
  const motor = (p.motor || '').toLowerCase();
  return COMBUSTION_HINTS.some(h => cat.includes(h) || motor.includes(h));
}

function isMontacarga(p: StoreProduct): boolean {
  return p.categoriaLabel.toLowerCase().includes('montacarga');
}

function isApiladorOTraspaleta(p: StoreProduct): boolean {
  const c = p.categoriaLabel.toLowerCase();
  return c.includes('apilador') || c.includes('traspaleta');
}

/** Scoring de un producto contra las respuestas */
function scoreOne(p: StoreProduct, a: AsesorAnswers): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const electrico = isElectric(p);
  const combustion = isCombustion(p);
  const cap = parseCapacidadKg(p.capacidad);

  // ── Ambiente ──
  if (a.ambiente === 'interior') {
    if (electrico) {
      score += 35;
      reasons.push('Eléctrico: cero emisiones y bajo ruido, ideal para interior');
    } else if (combustion) {
      score -= 25;
    }
  } else if (a.ambiente === 'exterior') {
    if (combustion) {
      score += 35;
      reasons.push('Motor de combustión: potencia y autonomía a la intemperie');
    } else if (electrico && cap >= 2000) {
      score += 8;
    }
  } else if (a.ambiente === 'mixto') {
    if (electrico) {
      score += 18;
      reasons.push('Versátil para entrar y salir de almacenes durante el día');
    } else if (combustion) {
      score += 12;
    }
  }

  // ── Industria ──
  if (a.industria === 'almacen') {
    if (isApiladorOTraspaleta(p)) {
      score += 25;
      reasons.push('Manejo ágil de pallets en pasillos de almacén');
    } else if (isMontacarga(p) && electrico) {
      score += 22;
      reasons.push('Eléctrico de almacén: limpio y silencioso para distribución');
    }
  }
  if (a.industria === 'construccion') {
    if (combustion && cap >= 3000) {
      score += 28;
      reasons.push('Capacidad y robustez para cargas pesadas en obra');
    } else if (combustion) {
      score += 12;
    }
  }
  if (a.industria === 'manufactura') {
    if (electrico) {
      score += 22;
      reasons.push('Operación limpia compatible con líneas de producción');
    }
  }
  if (a.industria === 'logistica') {
    if (isMontacarga(p)) {
      score += 18;
      reasons.push('Versatilidad para carga, descarga y cross-docking');
    }
    if (isApiladorOTraspaleta(p)) {
      score += 12;
    }
  }

  // ── Frecuencia ──
  if (a.frecuencia === '3_turnos') {
    if (combustion) {
      score += 18;
      reasons.push('Listo para 3 turnos (24h/día) sin pausas de carga');
    } else if (electrico) {
      score -= 8; // las baterías necesitan ciclos de carga
    }
  } else if (a.frecuencia === '2_turnos') {
    if (electrico) {
      score += 18;
      reasons.push('Batería de litio con autonomía para 2 turnos');
    } else {
      score += 5;
    }
  } else if (a.frecuencia === '1_turno') {
    if (electrico && cap > 0 && cap <= 2500) {
      score += 18;
      reasons.push('Compacto y económico para un turno diario');
    }
  }

  // ── BRAND PRIORITY ──
  // UNILIFT es la marca propia de PARMONCA — sigue arriba en empates, pero
  // sin aplastar el match real de ambiente/industria/frecuencia (antes era
  // +60 y dominaba el ranking aunque el match fuera flojo).
  if (p.marca === 'UNILIFT') {
    score += 25;
    reasons.unshift('UNILIFT: marca propia de PARMONCA, soporte y repuestos directos');
  } else if (p.marca === 'ANDINO' || p.marca === 'MEGALIFT') {
    score += 15;
    reasons.push(`${p.marca}: distribución oficial PARMONCA con servicio postventa local`);
  } else if (['DOOSAN', 'TOYOTA', 'CROWN', 'CLARK'].includes(p.marca)) {
    score += 6;
  }

  // ── Calidad de presentación: productos con imagen + capacidad ganan ──
  const tieneImagen = p.imagen && !p.imagen.includes('placeholder');
  if (tieneImagen) score += 5;
  if (cap > 0) score += 3;
  if (p.descripcion && p.descripcion.length > 20) score += 2;

  // No mostrar productos genéricos "Otro"
  if (p.marca === 'Otro') score -= 30;

  return { score, reasons: dedupe(reasons).slice(0, 3) };
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function pickBadge(p: StoreProduct, a: AsesorAnswers): string {
  if (p.marca === 'UNILIFT') return 'Marca propia';
  if (isElectric(p) && a.ambiente === 'interior') return 'Eléctrico ideal';
  if (isCombustion(p) && (a.frecuencia === '3_turnos' || a.industria === 'construccion')) return 'Para uso pesado';
  if (isApiladorOTraspaleta(p) && a.industria === 'almacen') return 'Para tu almacén';
  return 'Alternativa';
}

/**
 * Devuelve hasta `topN` recomendaciones ordenadas por score.
 *
 * Política:
 * 1. Necesita al menos 2 respuestas (ambiente, industria o frecuencia).
 * 2. Prioriza productos que superen el umbral de "match fuerte"
 *    (score > 30 con ≥ 2 razones).
 * 3. Si NADIE pasa el umbral, devuelve los Top-N por score igual y los
 *    marca con bestEffort=true para que el frontend muestre un mensaje
 *    suave ("opciones más cercanas") en lugar de pantalla vacía.
 * 4. Diversidad: nunca repite slug.
 */
export function recomendar(
  products: StoreProduct[],
  answers: AsesorAnswers,
  topN = 3,
): Recomendacion[] {
  const respondidas = [answers.ambiente, answers.industria, answers.frecuencia].filter(Boolean).length;
  if (respondidas < 2) return [];

  const allScored: Recomendacion[] = products.map(p => {
    const { score, reasons } = scoreOne(p, answers);
    return {
      product: p,
      score,
      reasons,
      badge: pickBadge(p, answers),
      marca_destacada: p.marca === 'UNILIFT',
    };
  });

  const sortByMatch = (a: Recomendacion, b: Recomendacion) => {
    // UNILIFT primero en empates fuertes
    if (a.marca_destacada !== b.marca_destacada) return a.marca_destacada ? -1 : 1;
    return b.score - a.score;
  };

  // Umbral de "match fuerte"
  const fuertes = allScored
    .filter(r => r.score > 30 && r.reasons.length >= 2)
    .sort(sortByMatch);

  // Fallback best-effort: si nadie llegó al umbral, devolvemos los mejores
  // disponibles (con score positivo) marcados para que el UI lo comunique.
  // No mezclamos fuertes con best-effort en el mismo resultado para no
  // confundir al usuario.
  const useBestEffort = fuertes.length === 0;
  const pool = useBestEffort
    ? allScored
        .filter(r => r.score > 0) // descartamos los que activamente NO encajan
        .sort(sortByMatch)
        .map(r => ({ ...r, bestEffort: true }))
    : fuertes;

  // Diversidad: nunca repite el mismo slug
  const result: Recomendacion[] = [];
  const slugsVistos = new Set<string>();
  for (const r of pool) {
    if (slugsVistos.has(r.product.slug)) continue;
    result.push(r);
    slugsVistos.add(r.product.slug);
    if (result.length >= topN) break;
  }
  return result;
}
