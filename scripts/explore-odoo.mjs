#!/usr/bin/env node
/**
 * Explora una instancia de Odoo para descubrir su estructura: compañías,
 * monedas, listas de precios y —lo más importante— los IDs de categoría de
 * producto que necesitamos mapear en `src/lib/odoo.ts` (ODOO_CR_CATEG_MAP).
 *
 * Pensado para preparar el alta de una instancia nueva (p. ej. Costa Rica)
 * antes de conectarla al sync.
 *
 * USO:
 *   # Costa Rica (prefijo por defecto CR_):
 *   ODOO_CR_URL=https://... ODOO_CR_DB=... ODOO_CR_LOGIN=... ODOO_CR_API_KEY=... \
 *     node scripts/explore-odoo.mjs
 *
 *   # Panamá (instancia actual, prefijo vacío):
 *   node scripts/explore-odoo.mjs ""
 *
 * El primer argumento opcional es el prefijo de las env vars
 * (ODOO_<prefix>URL / DB / LOGIN / API_KEY). Por defecto: "CR_".
 *
 * No requiere dependencias: usa fetch nativo (Node 18+).
 */

const prefix = process.argv[2] ?? 'CR_';
const env = (k) => process.env[`ODOO_${prefix}${k}`] || '';
const url = env('URL');
const db = env('DB');
const login = env('LOGIN');
const apiKey = env('API_KEY');

if (!url || !db || !login || !apiKey) {
  console.error(
    `❌ Faltan credenciales. Define ODOO_${prefix}URL, ODOO_${prefix}DB, ` +
    `ODOO_${prefix}LOGIN, ODOO_${prefix}API_KEY.`
  );
  process.exit(1);
}

// Palabras clave para reconocer las 4 categorías PARMONCA en cualquier idioma.
const KEYWORDS = {
  llantas: ['tire', 'wheel', 'llanta', 'rueda', 'neumat'],
  asientos: ['seat', 'asiento'],
  traspaletas_manuales: ['pallet', 'traspaleta', 'transpaleta', 'manual'],
  tanques: ['tank', 'tanque', 'glp', 'lpg'],
};

async function rpc(service, method, args) {
  const res = await fetch(`${url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { service, method, args } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${service}.${method}`);
  const j = await res.json();
  if (j.error) throw new Error(j.error?.data?.message || JSON.stringify(j.error));
  return j.result;
}

async function main() {
  console.log(`\n🔌 Conectando a ${url} (db: ${db}) como ${login}\n`);
  const uid = await rpc('common', 'authenticate', [db, login, apiKey, {}]);
  if (!uid) throw new Error('Autenticación fallida — revisa LOGIN / API_KEY.');
  const kw = (model, method, a, k = {}) => rpc('object', 'execute_kw', [db, uid, apiKey, model, method, a, k]);
  console.log(`✅ Autenticado (uid: ${uid})\n`);

  // ── Compañías ──────────────────────────────────────────────────────────
  const companies = await kw('res.company', 'search_read', [[], ['id', 'name', 'currency_id', 'country_id']]);
  console.log('=== COMPAÑÍAS ===');
  for (const c of companies) {
    console.log(`  #${c.id}  ${c.name}  ·  ${c.currency_id?.[1] || '?'}  ·  ${c.country_id?.[1] || '?'}`);
  }

  // ── Listas de precios ──────────────────────────────────────────────────
  try {
    const pls = await kw('product.pricelist', 'search_read', [[], ['id', 'name', 'currency_id']]);
    console.log('\n=== LISTAS DE PRECIOS ===');
    console.log(pls.length ? pls.map((p) => `  #${p.id} ${p.name} (${p.currency_id?.[1] || '?'})`).join('\n') : '  (ninguna)');
  } catch {
    console.log('\n=== LISTAS DE PRECIOS ===\n  (sin permiso o no disponible)');
  }

  // ── Categorías con productos + match por keyword ─────────────────────────
  const cats = await kw('product.category', 'search_read', [[], ['id', 'complete_name']]);
  console.log(`\n=== CATEGORÍAS (${cats.length}) con productos activos y posible mapeo ===`);
  const sugerencias = {};
  for (const cat of cats) {
    const n = await kw('product.template', 'search_count', [[['categ_id', '=', cat.id], ['active', '=', true]]]);
    if (n === 0) continue;
    const nombre = (cat.complete_name || '').toLowerCase();
    let match = '';
    for (const [parmonca, words] of Object.entries(KEYWORDS)) {
      if (words.some((w) => nombre.includes(w))) {
        match = parmonca;
        (sugerencias[parmonca] ??= []).push(cat.id);
        break;
      }
    }
    console.log(`  #${cat.id}  ${cat.complete_name}  —  ${n} productos${match ? `  →  ${match} ⭐` : ''}`);
  }

  // ── Sugerencia de ODOO_CR_CATEG_MAP ─────────────────────────────────────
  const flat = {};
  for (const [parmonca, ids] of Object.entries(sugerencias)) {
    for (const id of ids) flat[id] = parmonca;
  }
  console.log('\n=== SUGERENCIA para ODOO_' + prefix + 'CATEG_MAP ===');
  console.log('  (revisa que el mapeo sea correcto antes de usarlo)\n');
  console.log('  ' + JSON.stringify(flat));
  console.log('\n💡 Pega ese JSON en la env var ODOO_' + prefix + 'CATEG_MAP de Vercel.\n');
}

main().catch((e) => {
  console.error('\n❌ Error:', e.message, '\n');
  process.exit(1);
});
