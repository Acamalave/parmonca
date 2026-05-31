# PARMONCA CRM — Guía de configuración

Sistema end-to-end: **Landing de venta/alquiler** → **API** → **Supabase** → **Panel de Colaboradores**.

---

## 1. Acceso al panel de colaboradores

**URL:** `https://parmonca-crm.vercel.app/login`

**Usuario administrador inicial** (creado automáticamente):

- **Email:** `admin@parmonca.com`
- **Contraseña:** `Parmonca2026!`

> ⚠️ **IMPORTANTE:** cambia esta contraseña en el primer login desde Supabase Studio → Authentication → Users.

### Crear más usuarios colaboradores

Opción A — desde Supabase Studio:
1. Entrar a https://supabase.com/dashboard/project/wbsaefkvvkktkgnwhtov
2. Authentication → Users → Add user → Create new user
3. El profile se crea automáticamente con rol `asesor`. Para cambiar a `gerente` o `super-admin`:

```sql
update public.parmonca_profiles set rol = 'gerente' where email = 'nuevo@parmonca.com';
```

---

## 2. Variables de entorno

### Ya configuradas en Vercel

| Variable | Valor |
|---|---|
| `RESEND_API_KEY` | Key de Resend para emails |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key público |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `50760000000` (placeholder) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `ventas@parmonca.com` |
| `ODOO_URL` / `ODOO_DB` / `ODOO_LOGIN` / `ODOO_API_KEY` | Instancia de **Panamá** (`ml.parts`) | Sync de repuestos/precios PA (USD) |
| `CRON_SECRET` | Generado | Autoriza el cron de sync de Odoo |

### Pendientes de configurar

| Variable | Dónde obtenerla | Qué habilita |
|---|---|---|
| `SLACK_WEBHOOK_URL` | Slack → App → Incoming Webhooks | Notifica al equipo cuando llega una cotización |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Reemplazar placeholder con número real | Botón flotante de WhatsApp |
| `ODOO_CR_URL` / `ODOO_CR_DB` / `ODOO_CR_LOGIN` / `ODOO_CR_API_KEY` | Instancia de **Costa Rica** (separada) | Sync de repuestos/precios CR (CRC) — ver §9 |
| `ODOO_CR_CATEG_MAP` | Salida del script `scripts/explore-odoo.mjs` | Mapeo de categorías de la instancia CR — ver §9 |

**Para configurar Slack:**
```bash
npx vercel env add SLACK_WEBHOOK_URL production
# Pegar la URL del webhook
npx vercel --prod  # redeploy
```

**Para cambiar el número de WhatsApp:**
```bash
npx vercel env rm NEXT_PUBLIC_WHATSAPP_NUMBER production
npx vercel env add NEXT_PUBLIC_WHATSAPP_NUMBER production
# Pegar el número en formato internacional sin +, ej: 50760001234
```

---

## 3. Configurar dominio propio en Resend

El API actualmente envía emails desde `onboarding@resend.dev` al email hardcodeado `malave.acacio@gmail.com` (modo prueba).

Para enviar emails al cliente real:

1. En [resend.com](https://resend.com) → Domains → Add Domain → `parmonca.com`
2. Agregar los registros DNS que indica Resend (DKIM, SPF, DMARC)
3. Esperar verificación (~15 min)
4. En `src/app/api/cotizacion/route.ts` cambiar:

```diff
- from: 'PARMONCA <onboarding@resend.dev>',
- to: ['malave.acacio@gmail.com'], // TODO: change to [body.email]
+ from: 'PARMONCA <cotizaciones@parmonca.com>',
+ to: [body.email],
```

---

## 4. Flujo end-to-end

### El cliente:
1. Entra a `/productos` → navega catálogo o usa el Asesor Virtual
2. Abre el detalle de un producto → configura accesorios → clic "Cotizar"
3. Llena formulario en `/cotizar` con sus datos + contexto comercial
4. Envía → recibe email de confirmación (cuando el dominio esté activo)

### El sistema:
1. `POST /api/cotizacion` valida los datos
2. **Inserta** en `parmonca_cotizaciones` con estado `nueva` y etapa `prospecto`
3. El trigger crea/actualiza automáticamente el cliente en `parmonca_clientes`
4. Envía email al cliente y al equipo vía Resend
5. Envía alerta a Slack si está configurado
6. Responde al frontend con el número de cotización

### El colaborador:
1. Entra a `/login` con su cuenta → middleware lo autentica
2. Ve el dashboard con KPIs en tiempo real
3. En `/cotizaciones` ve todas las solicitudes **en vivo** (realtime subscription)
4. Click en cotización → detalle con contexto, historial de notas, cambio de estado
5. En `/pipeline` arrastra tarjetas entre etapas → persiste en DB
6. En `/clientes` ve todos los clientes consolidados
7. Botón "Exportar CSV" para descargar cotizaciones filtradas

---

## 5. Estructura de base de datos

```
parmonca_profiles              — perfiles de colaboradores (rol, email, nombre)
parmonca_cotizaciones          — cotizaciones de la landing
parmonca_clientes              — clientes consolidados (auto-upsert por email)
parmonca_cotizacion_notas      — notas internas y actividad por cotización
parmonca_repuestos             — catálogo de repuestos sincronizado desde Odoo
                                 (incluye `pais` PA/CR y `moneda` USD/CRC — ver §9)
parmonca_productos             — maquinaria (catálogo propio, precios en USD)
parmonca_odoo_sync_log         — bitácora de cada corrida del sync de Odoo
```

**Estados de cotización:** `nueva` → `contactado` → `cotizado` → `negociacion` → `ganada` / `perdida`

**Etapas del pipeline:** `prospecto` → `contacto` → `cotizado` → `negociacion` → `ganada` / `perdida`

**Roles:** `super-admin` (todo), `gerente` (lectura+edición), `asesor` (lectura+edición propia)

---

## 6. Desarrollo local

```bash
npm install
cp .env.local.example .env.local  # pedir las keys al admin
npm run dev
```

Abrir http://localhost:3000

---

## 7. URLs importantes

| Ambiente | URL |
|---|---|
| Landing público | https://parmonca-crm.vercel.app/productos |
| Panel colaboradores | https://parmonca-crm.vercel.app/login |
| Supabase Studio | https://supabase.com/dashboard/project/wbsaefkvvkktkgnwhtov |
| Vercel Project | https://vercel.com/acamalave/parmonca-crm |

---

## 8. Todos pendientes para producción completa

- [ ] Dominio propio configurado en Resend (enviar emails al cliente real)
- [ ] WhatsApp real (reemplazar placeholder)
- [ ] Slack webhook configurado (opcional, para alertas al equipo)
- [ ] Cambiar password del usuario `admin@parmonca.com`
- [ ] Crear usuarios para el equipo comercial con sus roles
- [ ] Revisar tasa de impuesto por país (actualmente fija en 7%)
- [ ] Módulo de facturación: conectar con sistema contable si existe
- [ ] Integrar Cal.com o Google Calendar para "Agendar llamada"
- [ ] **Activar Costa Rica**: cargar credenciales `ODOO_CR_*` + `ODOO_CR_CATEG_MAP` (ver §9)

---

## 9. Catálogo y precios por país (Odoo multi-instancia)

PARMONCA opera en **Panamá** y **Costa Rica**. En Odoo cada país vive en una
**instancia separada** (no son multi-company ni listas de precios — verificado:
la instancia de PA tiene 3 compañías, todas en USD, sin pricelists). La web
muestra catálogo, stock y precio según la ubicación del visitante.

### Cómo funciona

- **Detección de país**: `middleware.ts` lee `x-vercel-ip-country` y fija la
  cookie `parmonca_pais` (`PA` por defecto, `CR` si la IP es de Costa Rica).
  El visitante puede cambiarlo con el selector 🇵🇦/🇨🇷 del navbar; esa elección
  manual sobreescribe la autodetección.
- **Moneda**: PA → USD (`es-PA`), CR → CRC (`es-CR`, sin decimales). El impuesto
  mostrado en el carrito es ITBMS (PA) o IVA (CR).
- **Sync**: el cron (`*/15 * * * *` en `vercel.json` → `/api/odoo/sync`) recorre
  las instancias configuradas (`getOdooInstances()` en `src/lib/odoo.ts`) y
  hace upsert en `parmonca_repuestos` con su `pais`/`moneda`. La unicidad es por
  `(odoo_id, pais)` y `(sku, pais)`, así PA y CR no colisionan.
- Si una instancia no está configurada (o no tiene categorías mapeadas), el sync
  **la omite** sin romper las demás.

### Activar Costa Rica (pasos)

1. **Pedir accesos** de la instancia de Odoo de CR (URL, DB, usuario con lectura
   de inventario, API key). El API key se genera en Odoo:
   *Preferencias → Seguridad de la cuenta → Nueva clave API*.

2. **Descubrir los IDs de categoría** de esa instancia (casi seguro difieren de
   los de PA). Ejecutar el script incluido:

   ```bash
   ODOO_CR_URL=https://... ODOO_CR_DB=... ODOO_CR_LOGIN=... ODOO_CR_API_KEY=... \
     node scripts/explore-odoo.mjs
   ```

   Imprime compañías, monedas y todas las categorías con productos, y sugiere un
   JSON para `ODOO_CR_CATEG_MAP`. **Revisar manualmente** que el mapeo a
   `llantas` / `asientos` / `traspaletas_manuales` / `tanques` sea correcto (el
   match por palabra clave es solo orientativo).

3. **Configurar las env vars en Vercel** (producción):

   ```bash
   npx vercel env add ODOO_CR_URL production
   npx vercel env add ODOO_CR_DB production
   npx vercel env add ODOO_CR_LOGIN production
   npx vercel env add ODOO_CR_API_KEY production
   npx vercel env add ODOO_CR_CATEG_MAP production   # pegar el JSON, ej: {"31":"llantas","48":"asientos"}
   ```

4. **Redesplegar** (`npx vercel --prod`) y disparar el sync manual desde el panel
   admin o esperar la próxima corrida del cron. El catálogo de CR aparece solo.

> Mientras `ODOO_CR_*` no esté definido, la web funciona con Panamá únicamente y,
> al elegir Costa Rica, muestra un mensaje de "muy pronto" en vez de un catálogo
> vacío.
