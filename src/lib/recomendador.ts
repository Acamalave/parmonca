/**
 * Motor de recomendación inteligente.
 *
 * Toma las respuestas del Asesor Virtual y devuelve los Top-N productos
 * que mejor se ajustan a la operación del cliente, con razones específicas
 * por las que cada uno fue elegido.
 *
 * Reglas de prioridad (ajustadas según feedback del equipo comercial):
 * 1. **El match operativo manda.** Ambiente (interior→eléctrico, exterior→
 *    combustión), tipo de equipo según industria y frecuencia de uso deciden
 *    el ranking.
 * 2. **UNILIFT solo desempata.** La marca propia se prefiere únicamente cuando
 *    hay un empate real de idoneidad (scores casi iguales), NUNCA por encima de
 *    un equipo claramente más adecuado.
 * 3. **Diversidad en el Top-N.** No devolvemos 3 variantes del mismo tipo y
 *    capacidad; mostramos opciones genuinamente distintas.
 *
 * ⚠️ Limitación de datos conocida: en el catálogo actual el combustible solo es
 * confiable vía la CATEGORÍA ('Montacarga Combustion' vs el resto, que figura
 * como eléctrico). Los campos `motor` y `descripcion` dicen "eléctrico" de forma
 * uniforme aunque haya equipos de gas/diesel mal categorizados. Por eso usamos
 * la categoría como señal principal; la precisión fina de combustible depende de
 * corregir esos datos en el origen (Odoo).
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

type TipoEquipo = 'montacarga' | 'apilador' | 'traspaleta' | 'mastil' | 'plataforma' | 'otro';

const COMBUSTION_HINTS = ['combust', 'diesel', 'gas/lpg', 'gas', 'lpg', 'glp', 'gasolina', 'dual fuel', 'dual-fuel'];

function parseCapacidadKg(s: string | null | undefined): number {
  if (!s) return 0;
  const m = String(s).replace(/[^\d]/g, '');
  return m ? parseInt(m, 10) : 0;
}

/**
 * Capacidad utilizable: ignora valores basura (< 100 kg) que en el catálogo
 * aparecen como 1, 2, 3, 5… (toneladas mal guardadas o sin parsear). Cuando es
 * dudosa devolvemos null para NO aplicar reglas de capacidad sobre datos malos.
 */
function capEfectiva(p: StoreProduct): number | null {
  const n = parseCapacidadKg(p.capacidad);
  return n >= 100 ? n : null;
}

/** Tipo de equipo según la categoría real del catálogo. */
function tipoEquipo(p: StoreProduct): TipoEquipo {
  const c = p.categoriaLabel.toLowerCase();
  if (c.includes('montacarga')) return 'montacarga';
  if (c.includes('apilador')) return 'apilador';
  if (c.includes('traspaleta') || c.includes('transpaleta')) return 'traspaleta';
  if (c.includes('mastil') || c.includes('mástil') || c.includes('pantograf') || c.includes('pantógraf') || c.includes('retractil') || c.includes('retráctil')) return 'mastil';
  if (c.includes('plataforma')) return 'plataforma';
  return 'otro';
}

/** Combustión = categoría 'Montacarga Combustión' o un motor explícitamente de combustión. */
function isCombustion(p: StoreProduct): boolean {
  const cat = p.categoriaLabel.toLowerCase();
  if (cat.includes('combust')) return true;
  const motor = (p.motor || '').toLowerCase();
  return COMBUSTION_HINTS.some(h => motor.includes(h));
}

/** Detecta batería de litio por el nombre del modelo (sufijo 'Li') o descripción. */
function esLiIon(p: StoreProduct): boolean {
  if (/li$/i.test((p.modelo || '').trim())) return true;
  const s = `${p.modelo || ''} ${p.descripcion || ''}`.toLowerCase();
  return /li-?ion|litio/.test(s);
}

function brandTier(marca: string): number {
  if (marca === 'UNILIFT') return 3;            // marca propia
  if (marca === 'ANDINO' || marca === 'MEGALIFT') return 2; // distribución oficial
  return 1;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/** Scoring de un producto contra las respuestas. La marca NO suma score. */
function scoreOne(p: StoreProduct, a: AsesorAnswers): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const combustion = isCombustion(p);
  const electrico = !combustion;
  const cap = capEfectiva(p);
  const tipo = tipoEquipo(p);
  const liion = esLiIon(p);

  // ── Ambiente ──
  if (a.ambiente === 'interior') {
    if (electrico) {
      score += 30;
      reasons.push('Eléctrico: cero emisiones y bajo ruido, ideal para interior');
    } else {
      score -= 30; // combustión en interior: no recomendable
    }
  } else if (a.ambiente === 'exterior') {
    if (combustion) {
      score += 35;
      reasons.push('Motor de combustión: potencia y autonomía a la intemperie');
    } else if (cap && cap >= 2500) {
      score += 6; // eléctrico grande tolera exterior puntual
    } else {
      score -= 5;
    }
  } else if (a.ambiente === 'mixto') {
    if (electrico) {
      score += 16;
      reasons.push('Versátil para entrar y salir de almacenes durante el día');
    } else {
      score += 14;
      reasons.push('Apto para nave y patio, con potencia para exterior');
    }
  }

  // ── Industria → tipo de equipo ──
  switch (a.industria) {
    case 'almacen':
      if (tipo === 'apilador' || tipo === 'traspaleta' || tipo === 'mastil') {
        score += 26;
        reasons.push('Diseñado para mover pallets en pasillos de almacén');
      } else if (tipo === 'montacarga' && electrico) {
        score += 18;
        reasons.push('Montacargas eléctrico limpio para distribución interna');
      }
      break;
    case 'construccion':
      if (combustion && cap && cap >= 3000) {
        score += 30;
        reasons.push('Capacidad y robustez para cargas pesadas en obra');
      } else if (combustion) {
        score += 16;
        reasons.push('Motor de combustión para terreno exigente');
      } else {
        score -= 4;
      }
      break;
    case 'manufactura':
      if (tipo === 'montacarga' && electrico) {
        score += 20;
        reasons.push('Operación limpia compatible con líneas de producción');
      } else if (electrico) {
        score += 12;
      }
      break;
    case 'logistica':
      if (tipo === 'montacarga') {
        score += 20;
        reasons.push('Versátil para carga, descarga y cross-docking');
      } else if (tipo === 'traspaleta' || tipo === 'apilador') {
        score += 14;
        reasons.push('Ágil para preparación de pedidos y muelles');
      }
      break;
    case 'retail':
      if (tipo === 'traspaleta' || tipo === 'apilador') {
        score += 18;
        reasons.push('Compacto y maniobrable para tiendas y bodegas pequeñas');
      } else if (electrico) {
        score += 8;
      }
      break;
    case 'agricola':
      if (combustion) {
        score += 20;
        reasons.push('Combustión para patios y terrenos irregulares');
      } else if (cap && cap >= 2500) {
        score += 6;
      }
      break;
    case 'farmaceutica':
      if (electrico) {
        score += 18;
        reasons.push('Operación limpia, sin emisiones para ambientes controlados');
      }
      break;
    // 'otro' / sin industria: sin bono
  }

  // ── Frecuencia ──
  if (a.frecuencia === '3_turnos') {
    if (combustion) {
      score += 18;
      reasons.push('Listo para 3 turnos (24h/día) sin pausas de carga');
    } else if (liion) {
      score += 12;
      reasons.push('Batería de litio: carga de oportunidad para uso intensivo');
    } else {
      score -= 6; // plomo-ácido no rinde 24h sin baterías de repuesto
    }
  } else if (a.frecuencia === '2_turnos') {
    if (liion) {
      score += 16;
      reasons.push('Batería de litio con autonomía para 2 turnos');
    } else if (electrico) {
      score += 8;
    } else {
      score += 6;
    }
  } else if (a.frecuencia === '1_turno') {
    if (electrico) {
      score += 12;
      reasons.push('Eficiente y económico para un turno diario');
    } else {
      score += 4;
    }
  }

  // ── Calidad de presentación (señal débil; nunca decide el match) ──
  const tieneImagen = p.imagen && !p.imagen.includes('placeholder');
  if (tieneImagen) score += 3;
  if (cap) score += 2;

  // Penaliza genéricos "Otro"
  if (p.marca === 'Otro' || p.modelo === 'Otro') score -= 25;

  return { score, reasons: dedupe(reasons).slice(0, 3) };
}

function pickBadge(p: StoreProduct, a: AsesorAnswers): string {
  if (isCombustion(p) && (a.frecuencia === '3_turnos' || a.industria === 'construccion' || a.ambiente === 'exterior')) {
    return 'Para uso pesado';
  }
  const tipo = tipoEquipo(p);
  if ((tipo === 'apilador' || tipo === 'traspaleta' || tipo === 'mastil') && a.industria === 'almacen') {
    return 'Para tu almacén';
  }
  if (!isCombustion(p) && a.ambiente === 'interior') return 'Eléctrico ideal';
  if (p.marca === 'UNILIFT') return 'Marca propia';
  return 'Alternativa';
}

/** Tramo de capacidad para diversificar el Top-N. */
function capTier(p: StoreProduct): string {
  const c = parseCapacidadKg(p.capacidad);
  if (c < 100) return 'na';
  if (c <= 2000) return 'baja';
  if (c <= 3500) return 'media';
  return 'alta';
}

/**
 * Devuelve hasta `topN` recomendaciones ordenadas por idoneidad.
 *
 * Política:
 * 1. Necesita al menos 2 respuestas (ambiente, industria o frecuencia).
 * 2. Prioriza productos que superen el umbral de "match fuerte"
 *    (score > 30 con ≥ 2 razones).
 * 3. Orden por score; la marca (UNILIFT > ANDINO/MEGALIFT > resto) SOLO
 *    desempata cuando los scores están dentro de ±EPS — nunca aplasta un
 *    match operativo claramente mejor.
 * 4. Diversidad: evita 3 variantes del mismo (tipo, tramo de capacidad).
 * 5. Si NADIE pasa el umbral, devuelve los Top-N por score con bestEffort=true.
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

  // El match manda; la marca solo desempata cuando el score es casi igual.
  const EPS = 3;
  const sortByMatch = (a: Recomendacion, b: Recomendacion) => {
    if (Math.abs(b.score - a.score) > EPS) return b.score - a.score;
    const t = brandTier(b.product.marca) - brandTier(a.product.marca);
    if (t !== 0) return t;
    return b.score - a.score;
  };

  // Umbral de "match fuerte"
  const fuertes = allScored
    .filter(r => r.score > 30 && r.reasons.length >= 2)
    .sort(sortByMatch);

  // Fallback best-effort: si nadie llegó al umbral, los mejores con score > 0.
  const useBestEffort = fuertes.length === 0;
  const pool = useBestEffort
    ? allScored
        .filter(r => r.score > 0)
        .sort(sortByMatch)
        .map(r => ({ ...r, bestEffort: true }))
    : fuertes;

  // Selección con diversidad: primero combinaciones (tipo, tramo de cap) nuevas.
  const result: Recomendacion[] = [];
  const slugsVistos = new Set<string>();
  const combosVistos = new Set<string>();
  for (const r of pool) {
    if (slugsVistos.has(r.product.slug)) continue;
    const combo = `${tipoEquipo(r.product)}:${capTier(r.product)}`;
    if (combosVistos.has(combo)) continue;
    result.push(r);
    slugsVistos.add(r.product.slug);
    combosVistos.add(combo);
    if (result.length >= topN) break;
  }
  // Completa si la diversidad dejó menos de topN.
  if (result.length < topN) {
    for (const r of pool) {
      if (slugsVistos.has(r.product.slug)) continue;
      result.push(r);
      slugsVistos.add(r.product.slug);
      if (result.length >= topN) break;
    }
  }
  return result;
}
