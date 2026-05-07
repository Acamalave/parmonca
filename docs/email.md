# Envío transaccional de correos — Microsoft Graph API

El CRM envía la cotización en PDF al cliente y una copia interna al equipo
comercial usando Microsoft Graph API con OAuth 2.0 (client credentials flow).
Vamos por Graph en vez de SMTP porque Microsoft está deprecando App Passwords
y SMTP AUTH; Graph es la ruta oficial moderna y permite restringir el acceso
al buzón con `New-ApplicationAccessPolicy` desde Exchange Online.

El dominio `parmonca.com` ya tiene DKIM y SPF configurados para Microsoft 365,
así que los correos salen autenticados desde el dominio real con la mejor
deliverability.

## Variables de entorno requeridas

Configurar en Vercel (Production, Preview, Development) → Settings →
Environment Variables:

| Variable | Requerido | Descripción |
|---|---|---|
| `M365_TENANT_ID` | ✅ | Directory (tenant) ID de Azure AD. UUID. |
| `M365_CLIENT_ID` | ✅ | Application (client) ID de la app registration en Azure AD. UUID. |
| `M365_CLIENT_SECRET` | ✅ (Sensitive) | Client Secret "Value" (no el Secret ID) de la app. Cadena larga generada por Azure. |
| `M365_FROM_EMAIL` | ✅ | Buzón desde el que se envía. Ej: `cotizaciones@parmonca.com`. La app debe tener permiso (vía ApplicationAccessPolicy) sobre este buzón. |
| `M365_FROM_NAME` | ⚪ opt | Display name visible al cliente. Default: `PARMONCA`. |
| `MAIL_INTERNAL_COPY` | ⚪ opt | CSV de emails que reciben copia interna de cada cotización (ej. `comercial@parmonca.com,acacio@parmonca.com`). Si vacío, no se manda copia. |

## Setup en Azure AD (admin del tenant)

Estos pasos los hizo Pedro (sysadmin de gruporca) ya. Documentado para
referencia futura:

1. **App Registration** en https://entra.microsoft.com → Identity →
   Applications → App registrations → **New registration**:
   - Name: `PARMONCA CRM Mailer`
   - Single tenant
   - Redirect URI: en blanco
   - Copiar el **Application (client) ID** y **Directory (tenant) ID**.

2. **Client Secret** en Certificates & secrets → **New client secret**:
   - Description: `PARMONCA CRM`
   - Expires: 24 months (renovar antes)
   - ⚠️ Copiar el **Value** apenas se cree (no el Secret ID, sólo se ve una vez).

3. **Permiso `Mail.Send`** en API permissions → Add a permission →
   Microsoft Graph → **Application permissions** (NO Delegated) →
   marcar `Mail.Send` → Add. Luego: **Grant admin consent for [tenant]**.

4. **Restringir al buzón `cotizaciones@parmonca.com`** vía PowerShell con
   Connect-ExchangeOnline (sin esto, la app puede enviar desde CUALQUIER
   buzón del tenant):
   ```powershell
   New-ApplicationAccessPolicy `
     -AppId <CLIENT_ID> `
     -PolicyScopeGroupId cotizaciones@parmonca.com `
     -AccessRight RestrictAccess `
     -Description "PARMONCA CRM mailer"
   ```

## Cómo funciona en runtime

1. **Token OAuth** (cacheado entre invocaciones lambda warm):
   ```
   POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
   Body: client_id + client_secret + scope=https://graph.microsoft.com/.default
         + grant_type=client_credentials
   ```

2. **Envío**:
   ```
   POST https://graph.microsoft.com/v1.0/users/{from}/sendMail
   Authorization: Bearer {token}
   Body: { message: {...}, saveToSentItems: true }
   ```

3. Microsoft devuelve **202 Accepted** y procesa el envío async. El correo
   queda registrado en la carpeta "Enviados" del buzón
   `cotizaciones@parmonca.com` (auditable desde Outlook o Exchange Admin
   Center → Mail flow → Message trace).

## Verificación

Tras configurar las env vars y desplegar:

1. Llenar el formulario de `/cotizar` en parmonca.com con un email externo
   (no tu propio Gmail).
2. Confirmar que el cliente recibe el correo con PDF adjunto.
3. Si tienes `MAIL_INTERNAL_COPY`, confirmar que la copia llega al equipo.
4. En Exchange Admin Center → Mail flow → **Message trace** se ven los
   envíos del CRM con el mismo formato que cualquier otro correo
   corporativo, asociados al buzón `cotizaciones@parmonca.com`.
5. Endpoint opcional para health check: `verifyMailer()` en
   `src/lib/mailer.ts` valida sólo el OAuth (sin enviar correo).

## Límites

- Graph API rate limit: ~10,000 requests por usuario por 10 minutos. Más
  que suficiente para PARMONCA.
- Microsoft 365 outbound: 10,000 destinatarios/día por buzón, 30/min.
- Tamaño máximo de mensaje: 25 MB (incluye attachments en base64). Para
  PARMONCA un PDF de cotización pesa ~50-300 KB, lejos del límite.

## Rotación del Client Secret

El secret actual expira a los 24 meses. Para rotar (también necesario si se
filtró):

1. Azure AD → App registrations → PARMONCA CRM Mailer → Certificates &
   secrets → **New client secret**.
2. Copiar el nuevo **Value**.
3. Vercel → Settings → Environment Variables → editar `M365_CLIENT_SECRET`
   → pegar el nuevo valor → Save.
4. Redeploy (Vercel lo hace automático si `Trigger Redeploy` está activo,
   o `npx vercel --prod --yes`).
5. Borrar el secret viejo desde Azure (icono de basura).

## Troubleshooting

**`Microsoft OAuth falló (401)`**
- Client Secret incorrecto o expirado.
- Tenant ID o Client ID equivocado.

**`Graph sendMail falló (403)`**
- Falta `Grant admin consent` sobre el permiso `Mail.Send`.
- ApplicationAccessPolicy bloquea ese buzón.
- M365_FROM_EMAIL no es un buzón válido en el tenant.

**`Graph sendMail falló (404)`**
- El buzón `M365_FROM_EMAIL` no existe en el tenant.

**`Graph sendMail falló (429)`**
- Rate limit. Reintentar con backoff (no implementado aún — agregar si
  pasa con frecuencia).

**Correos no llegan al cliente pero Graph devuelve 202**
- Revisar Mail flow → Message trace en Exchange Admin Center buscando el
  email del cliente.
- Revisar carpeta de spam del cliente (improbable con DKIM/SPF correctos).

## Rollback

Si Graph API falla en producción y necesitamos volver a Resend rápidamente:

1. Restaurar `src/lib/mailer.ts` y `src/app/api/cotizacion/route.ts` desde
   un commit anterior a `feat/m365-graph-api`.
2. Confirmar que `RESEND_API_KEY` sigue en Vercel.
3. Re-deploy.

El paquete `resend` queda en `package.json` por compatibilidad. El paquete
`nodemailer` también (de un intento anterior con SMTP que descartamos).
