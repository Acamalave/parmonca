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

### Pendientes de configurar

| Variable | Dónde obtenerla | Qué habilita |
|---|---|---|
| `SLACK_WEBHOOK_URL` | Slack → App → Incoming Webhooks | Notifica al equipo cuando llega una cotización |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Reemplazar placeholder con número real | Botón flotante de WhatsApp |

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
