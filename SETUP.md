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
| `ODOO_CR_CON_PRECIO` | `true` cuando Odoo tenga lista de precios CRC para CR | Mostrar precios de CR (hoy CR sale como "Cotizar") — ver §9 |

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

## 9. Catálogo y precios por país (Odoo multi-compañía)

PARMONCA opera **Panamá** y **Costa Rica** como **dos compañías dentro de la MISMA
instancia de Odoo** (`ml.parts`), no instancias separadas:
- `PARMONCA CORP` (id **4**, Panamá)
- `PARMONCA S.A.` (id **5**, Costa Rica)

El catálogo de productos es **compartido** (`company_id=false`). Se diferencia:
- **Stock** → por la bodega de cada compañía (se lee `qty_available` en el
  contexto de esa compañía).
- **Precio** → del `list_price` (USD). Costa Rica se muestra **tal como está en
  Odoo: en USD** (aún no hay lista de precios en colones). Cuando Odoo tenga una
  lista en CRC, se cambia la `moneda` de CR a `'CRC'` en `getPaisesOdoo()` y se
  ajusta el sync para leer ese precio.

### Cómo funciona

- **Detección de país**: `middleware.ts` lee `x-vercel-ip-country` y fija la
  cookie `parmonca_pais` (`PA` por defecto, `CR` si la IP es de Costa Rica). El
  visitante puede cambiarlo con el selector 🇵🇦/🇨🇷 del navbar.
- **Moneda**: PA → USD; CR → **USD por ahora** (como está en Odoo; cuando haya
  lista en CRC se cambia a colones). Impuesto en cotización: ITBMS (PA) / IVA (CR).
- **Sync**: el cron (`*/15 * * * *` → `/api/odoo/sync`) usa UNA conexión
  (`getOdooClient()`) y recorre `getPaisesOdoo()` (en `src/lib/odoo.ts`): para
  cada país lee el catálogo con el contexto de su compañía y hace upsert en
  `parmonca_repuestos` con `(odoo_id, pais)`. Unicidad: `(odoo_id, pais)` y
  `(sku, pais)`.

### Variables de entorno (opcionales)

| Variable | Default | Para qué |
|---|---|---|
| `ODOO_PA_COMPANY_ID` | `4` | Compañía de Panamá |
| `ODOO_CR_COMPANY_ID` | `5` | Compañía de Costa Rica |

### Pasar CR a colones (cuando Odoo lo tenga)

Hoy CR muestra los precios **en USD, tal como están en Odoo**. Para mostrarlos en
colones:
1. El equipo de Odoo crea una **lista de precios en CRC** para PARMONCA S.A.
   (hoy la instancia tiene **0 pricelists**).
2. En `getPaisesOdoo()` cambiar la `moneda` de CR a `'CRC'` y ajustar el sync para
   leer el precio de esa lista; actualizar también `monedaDePais()` en `utils.ts`.
3. Redesplegar; la web muestra los precios de CR en ₡.

> Nota: el script `scripts/explore-odoo.mjs` queda como utilidad de exploración,
> pero CR **no** requiere credenciales `ODOO_CR_*` separadas (es la misma instancia).

---

## 10. Bandeja de mensajes (inbox omnicanal)

Inbox tipo ManyChat dentro del CRM, en `/mensajes`. Tablas
`parmonca_conversaciones` + `parmonca_mensajes` (RLS: admin/gerente ven todo,
asesor solo lo asignado). Realtime activo. Canales viables: **WhatsApp,
Instagram, Messenger** (Meta). LinkedIn/TikTok no tienen API de DM.

### Estado
- **Fase 0 (hecha):** bandeja, historial, asignación, estados, tiempo real. Las
  respuestas se guardan aunque no haya canal conectado.
- **Fase 1 (código listo, falta configurar Meta):** webhook de entrada +
  envío real por WhatsApp Cloud API.

### Activar WhatsApp (Fase 1)

1. **Meta:** Business Manager + verificación del negocio → **WhatsApp Business
   Account (WABA)** → registrar un **número dedicado** (no el del botón actual) →
   crear una app y un **System User** con token permanente.
2. **Env vars en Vercel (producción):**

   | Variable | De dónde |
   |---|---|
   | `WHATSAPP_TOKEN` | Token permanente del System User |
   | `WHATSAPP_PHONE_NUMBER_ID` | ID del número en la WABA |
   | `WHATSAPP_VERIFY_TOKEN` | Cadena arbitraria (la inventas; se usa en el handshake) |
   | `WHATSAPP_APP_SECRET` | App secret (verifica la firma del webhook) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Ya configurada (el webhook la usa para escribir) |

3. **Configurar el webhook en Meta:**
   - URL de callback: `https://parmonca.com/api/webhooks/whatsapp`
   - Verify token: el mismo de `WHATSAPP_VERIFY_TOKEN`
   - Suscribir el campo **messages**.
4. **Redesplegar.** Entrantes → crean/actualizan conversación y se ven en vivo;
   las respuestas del equipo se envían por la Cloud API.

> **Ventana de 24h (Meta):** fuera de las 24h desde el último mensaje del cliente
> solo se pueden enviar **plantillas aprobadas**. El envío de texto libre actual
> aplica dentro de la ventana; las plantillas son una mejora posterior.

> **Instagram / Messenger:** misma bandeja; se agregan conectando la página de
> Facebook + IG Business y pasando el App Review de Meta (webhooks análogos).
