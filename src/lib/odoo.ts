/**
 * Minimal Odoo JSON-RPC client for server-side use in API routes.
 *
 * Uses Odoo's `/jsonrpc` endpoint with API-key authentication (Odoo 14+).
 * No deps — just native fetch.
 *
 * PARMONCA opera con DOS instancias de Odoo SEPARADAS (no multi-company ni
 * pricelists — verificado en la instancia de Panamá: 3 compañías todas en USD,
 * 0 listas de precios, sin Costa Rica). Cada país tiene su propia base:
 *
 *   Panamá (USD) — instancia actual:
 *     ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY
 *   Costa Rica (CRC) — instancia separada (opcional, se activa al definirla):
 *     ODOO_CR_URL, ODOO_CR_DB, ODOO_CR_LOGIN, ODOO_CR_API_KEY
 *     ODOO_CR_CATEG_MAP  (JSON opcional: {"<categId>":"llantas", ...}) — los
 *                        IDs de categoría de CR casi seguro difieren de los de PA.
 */

type OdooConfig = {
  url: string;
  db: string;
  login: string;
  apiKey: string;
};

export class OdooClient {
  private uid: number | null = null;

  constructor(private cfg: OdooConfig) {}

  /**
   * Build a client from env vars. `prefix` selects the instance:
   *   ''    → ODOO_URL / ODOO_DB / ODOO_LOGIN / ODOO_API_KEY        (Panamá)
   *   'CR_' → ODOO_CR_URL / ODOO_CR_DB / ODOO_CR_LOGIN / ODOO_CR_API_KEY (Costa Rica)
   */
  static fromEnv(prefix = ''): OdooClient {
    const cfg = {
      url: process.env[`ODOO_${prefix}URL`] || '',
      db: process.env[`ODOO_${prefix}DB`] || '',
      login: process.env[`ODOO_${prefix}LOGIN`] || '',
      apiKey: process.env[`ODOO_${prefix}API_KEY`] || '',
    };
    if (!cfg.url || !cfg.db || !cfg.login || !cfg.apiKey) {
      throw new Error(
        `Odoo config incomplete — set ODOO_${prefix}URL, ODOO_${prefix}DB, ODOO_${prefix}LOGIN, ODOO_${prefix}API_KEY in Vercel env vars.`
      );
    }
    return new OdooClient(cfg);
  }

  private async rpc(service: string, method: string, args: unknown[]): Promise<unknown> {
    const res = await fetch(`${this.cfg.url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: { service, method, args },
      }),
    });
    if (!res.ok) throw new Error(`Odoo ${service}.${method} HTTP ${res.status}`);
    const j = await res.json() as { result?: unknown; error?: { data?: { message?: string } } };
    if (j.error) {
      throw new Error(`Odoo error: ${j.error?.data?.message || JSON.stringify(j.error)}`);
    }
    return j.result;
  }

  async authenticate(): Promise<number> {
    if (this.uid != null) return this.uid;
    const uid = (await this.rpc('common', 'authenticate', [
      this.cfg.db,
      this.cfg.login,
      this.cfg.apiKey,
      {},
    ])) as number;
    if (!uid || typeof uid !== 'number') {
      throw new Error('Odoo authentication failed — check ODOO_LOGIN / ODOO_API_KEY');
    }
    this.uid = uid;
    return uid;
  }

  async executeKw<T = unknown>(
    model: string,
    method: string,
    args: unknown[],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    const uid = await this.authenticate();
    return (await this.rpc('object', 'execute_kw', [
      this.cfg.db,
      uid,
      this.cfg.apiKey,
      model,
      method,
      args,
      kwargs,
    ])) as T;
  }

  async searchRead<T = Record<string, unknown>>(
    model: string,
    domain: unknown[],
    fields: string[],
    opts: { limit?: number; offset?: number; order?: string } = {},
  ): Promise<T[]> {
    return this.executeKw<T[]>(
      model,
      'search_read',
      [domain, fields],
      { limit: opts.limit, offset: opts.offset, order: opts.order },
    );
  }
}

// ──────────────────────────────────────────────────────────────────────
// Mapeo de categorías Odoo → PARMONCA
// IDs descubiertos al explorar ml.parts (Odoo 17, company PARMONCA CORP)
// ──────────────────────────────────────────────────────────────────────
export const ODOO_CATEG_MAP: Record<number, 'llantas' | 'asientos' | 'traspaletas_manuales' | 'tanques'> = {
  24: 'llantas',                  // TIRES AND WHEELS (LLANTAS Y RUEDAS) — 224
  59: 'llantas',                  // SLOW MOVING TIRES — 62
  72: 'asientos',                 // PARTS / SEATS (ASIENTOS)
  25: 'traspaletas_manuales',     // MANUALES PALLETS (TRANSPALETA MANUAL)
  71: 'tanques',                  // PARTS / TANKS (TANQUES)
};

export const ODOO_CATEG_IDS = Object.keys(ODOO_CATEG_MAP).map(Number);

export type CategoriaRepuesto = 'llantas' | 'asientos' | 'traspaletas_manuales' | 'tanques';
export type Pais = 'PA' | 'CR';
export type Moneda = 'USD' | 'CRC';

/**
 * Mapa de categorías de la instancia de Costa Rica.
 *
 * ⚠️ Los IDs de categoría de CR casi seguro difieren de los de Panamá. Hasta
 * conocer la instancia de CR no podemos fijarlos, así que se leen de la env var
 * ODOO_CR_CATEG_MAP (JSON: {"<id>":"llantas", ...}). Mientras no exista, el sync
 * de CR no traerá productos (categIds vacío) en vez de traer datos incorrectos.
 */
function parseCrCategMap(): Record<number, CategoriaRepuesto> {
  const raw = process.env.ODOO_CR_CATEG_MAP;
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, CategoriaRepuesto>;
    const out: Record<number, CategoriaRepuesto> = {};
    for (const [k, v] of Object.entries(obj)) {
      const id = Number(k);
      if (Number.isFinite(id) && ['llantas', 'asientos', 'traspaletas_manuales', 'tanques'].includes(v)) {
        out[id] = v;
      }
    }
    return out;
  } catch {
    console.warn('ODOO_CR_CATEG_MAP no es JSON válido — se ignora.');
    return {};
  }
}

export type OdooInstance = {
  pais: Pais;
  moneda: Moneda;
  client: OdooClient;
  categMap: Record<number, CategoriaRepuesto>;
  categIds: number[];
};

/**
 * Devuelve las instancias de Odoo configuradas. Panamá siempre (env actual).
 * Costa Rica sólo si ODOO_CR_URL/DB/LOGIN/API_KEY están definidas — así el
 * código queda listo para CR sin romper mientras no haya credenciales.
 */
export function getOdooInstances(): OdooInstance[] {
  const instances: OdooInstance[] = [
    {
      pais: 'PA',
      moneda: 'USD',
      client: OdooClient.fromEnv(''),
      categMap: ODOO_CATEG_MAP,
      categIds: ODOO_CATEG_IDS,
    },
  ];

  if (process.env.ODOO_CR_URL && process.env.ODOO_CR_DB && process.env.ODOO_CR_LOGIN && process.env.ODOO_CR_API_KEY) {
    const crCategMap = parseCrCategMap();
    instances.push({
      pais: 'CR',
      moneda: 'CRC',
      client: OdooClient.fromEnv('CR_'),
      categMap: crCategMap,
      categIds: Object.keys(crCategMap).map(Number),
    });
  }

  return instances;
}
