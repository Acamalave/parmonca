/**
 * Minimal Odoo JSON-RPC client for server-side use in API routes.
 *
 * Uses Odoo's `/jsonrpc` endpoint with API-key authentication (Odoo 14+).
 * No deps — just native fetch.
 *
 * PARMONCA opera Panamá y Costa Rica como DOS COMPAÑÍAS dentro de la MISMA
 * instancia de Odoo (verificado en ml.parts): PARMONCA CORP (id 4, Panamá) y
 * PARMONCA S.A. (id 5, Costa Rica). El catálogo es compartido (company_id=false);
 * se diferencia el stock por compañía (bodega) y el precio por país.
 *
 *   Env (una sola instancia):
 *     ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY
 *   Opcionales:
 *     ODOO_PA_COMPANY_ID (def 4), ODOO_CR_COMPANY_ID (def 5)
 *     ODOO_CR_CON_PRECIO=true  → cuando Odoo tenga lista de precios en CRC.
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
    opts: { limit?: number; offset?: number; order?: string; context?: Record<string, unknown> } = {},
  ): Promise<T[]> {
    return this.executeKw<T[]>(
      model,
      'search_read',
      [domain, fields],
      {
        limit: opts.limit,
        offset: opts.offset,
        order: opts.order,
        ...(opts.context ? { context: opts.context } : {}),
      },
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
 * Costa Rica NO es una instancia separada: es la compañía `PARMONCA S.A.`
 * (Costa Rica) dentro de la MISMA instancia de Odoo que Panamá (`PARMONCA CORP`).
 * Por eso sincronizamos con una sola conexión y diferenciamos por compañía:
 *   - el catálogo (product.template) es compartido (company_id=false),
 *   - el STOCK se lee en el contexto de cada compañía (su bodega),
 *   - el PRECIO sale del list_price (USD). Costa Rica aún NO tiene lista de
 *     precios en colones en Odoo, así que `conPrecio=false` → la web muestra
 *     "Cotizar" en vez de un monto en la moneda equivocada. Cuando exista la
 *     lista CRC, poner ODOO_CR_CON_PRECIO=true.
 */
export type PaisOdoo = {
  pais: Pais;
  companyId: number;
  moneda: Moneda;
  conPrecio: boolean;
};

export function getPaisesOdoo(): PaisOdoo[] {
  const paCompany = Number(process.env.ODOO_PA_COMPANY_ID || 4); // PARMONCA CORP
  const crCompany = Number(process.env.ODOO_CR_COMPANY_ID || 5); // PARMONCA S.A.
  // Costa Rica se muestra TAL COMO está en Odoo: el list_price está en USD
  // (no hay lista de precios en colones), así que CR usa moneda USD y muestra
  // el precio. Cuando Odoo tenga lista en CRC, cambiar `moneda` a 'CRC' y
  // ajustar el sync para leer ese precio.
  return [
    { pais: 'PA', companyId: paCompany, moneda: 'USD', conPrecio: true },
    { pais: 'CR', companyId: crCompany, moneda: 'USD', conPrecio: true },
  ];
}

/** Cliente único hacia la instancia de Odoo (env ODOO_*). */
export function getOdooClient(): OdooClient {
  return OdooClient.fromEnv('');
}
