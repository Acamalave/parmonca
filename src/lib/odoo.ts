/**
 * Minimal Odoo JSON-RPC client for server-side use in API routes.
 *
 * Uses Odoo's `/jsonrpc` endpoint with API-key authentication (Odoo 14+).
 * No deps — just native fetch.
 *
 * Env vars required (set in Vercel production):
 *   ODOO_URL      e.g. https://www.ml.parts
 *   ODOO_DB       e.g. odoogrupobuco-odoo17-bucoprod-19282048
 *   ODOO_LOGIN    user email with access to inventory
 *   ODOO_API_KEY  API key generated in Odoo: Preferences → Account Security
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

  static fromEnv(): OdooClient {
    const cfg = {
      url: process.env.ODOO_URL || '',
      db: process.env.ODOO_DB || '',
      login: process.env.ODOO_LOGIN || '',
      apiKey: process.env.ODOO_API_KEY || '',
    };
    if (!cfg.url || !cfg.db || !cfg.login || !cfg.apiKey) {
      throw new Error(
        'Odoo config incomplete — set ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_API_KEY in Vercel env vars.'
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
