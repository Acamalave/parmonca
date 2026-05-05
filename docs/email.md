# Envío transaccional de correos — Microsoft 365 SMTP

El CRM envía la cotización en PDF al cliente y una copia interna al equipo
comercial usando Microsoft 365 (SMTP autenticado). Vamos por Microsoft en vez
de Resend porque el dominio `parmonca.com` ya tiene DKIM y SPF configurados
para Office 365, así que los correos salen autenticados desde el dominio real
sin tocar DNS adicional ni esperar a Network Solutions.

## Variables de entorno requeridas

Configurar en Vercel (Production y Preview) → Settings → Environment Variables:

| Variable | Requerido | Ejemplo | Descripción |
|---|---|---|---|
| `M365_SMTP_USER` | ✅ | `cotizaciones@parmonca.com` | Buzón Microsoft 365 desde el que se envían los correos. Es también el FROM (Microsoft fuerza esa coincidencia). |
| `M365_SMTP_APP_PASSWORD` | ✅ | `abcd efgh ijkl mnop` | App Password de 16 caracteres generado desde [account.microsoft.com](https://account.microsoft.com) → Security → Advanced security options → App passwords. La cuenta debe tener MFA activo. |
| `M365_FROM_NAME` | ⚪ opt | `PARMONCA` | Display name que ve el cliente. Default: `PARMONCA`. |
| `MAIL_INTERNAL_COPY` | ⚪ opt | `comercial@parmonca.com,acacio@parmonca.com` | CSV de emails que reciben copia interna de cada cotización. Si está vacío, no se manda copia. |

## Configuración Microsoft 365 (admin del tenant)

1. **Crear / elegir el buzón** `cotizaciones@parmonca.com` con licencia que
   incluya Exchange Online (Business Basic o equivalente).

2. **Habilitar SMTP AUTH para ese buzón** (está deshabilitado por defecto a
   nivel tenant desde 2022):

   Microsoft 365 Admin Center → Users → Active users
     → seleccionar `cotizaciones@parmonca.com`
     → tab **Mail** → **Manage email apps**
     → marcar **Authenticated SMTP**

   Alternativa PowerShell:
   ```powershell
   Set-CASMailbox -Identity "cotizaciones@parmonca.com" -SmtpClientAuthenticationDisabled $false
   ```

3. **Generar App Password**:

   - Login con la cuenta en https://account.microsoft.com
   - Security → Advanced security options
   - Asegurarse que MFA esté activo
   - App passwords → Create a new app password → copiar la cadena (sólo se ve una vez)

## Parámetros SMTP

```
host:        smtp.office365.com
port:        587
secure:      false (STARTTLS)
requireTLS:  true
auth:        LOGIN (M365_SMTP_USER + M365_SMTP_APP_PASSWORD)
```

## Verificación

Tras configurar las env vars y desplegar, verificar:

1. Llenar el formulario de `/cotizar` en parmonca.com con un email externo.
2. Confirmar que el cliente recibe el correo con PDF adjunto.
3. Si tienes `MAIL_INTERNAL_COPY`, confirmar que la copia llega al equipo.
4. En Microsoft 365 Exchange Admin Center → Mail flow → **Message trace**
   se ven los envíos del CRM con el mismo formato que cualquier otro correo
   corporativo.

## Si SMTP AUTH está bloqueado por política del tenant

La alternativa es Microsoft Graph API con OAuth 2.0 (client credentials).
Requiere:

- App registration en Azure AD con permiso `Mail.Send` (application, no
  delegated).
- Tenant ID + Client ID + Client Secret.
- Admin consent sobre la app.

Si vamos por ese camino, hay que reemplazar `nodemailer` por `@microsoft/microsoft-graph-client`
o un envío HTTP directo a `https://graph.microsoft.com/v1.0/users/{id}/sendMail`.
El wrapper en `src/lib/mailer.ts` aísla el cambio — sólo se reemplaza la
implementación de `sendMail()`.

## Límites de Microsoft 365

- 10,000 destinatarios/día por buzón.
- ~30 mensajes por minuto.
- Máximo 500 destinatarios por mensaje.

Más que suficiente para PARMONCA. Si en algún punto se acerca al límite,
opciones: usar varios buzones rotando, o migrar a un servicio dedicado
(SendGrid/Postmark/Mailgun) verificando el dominio en serio.

## Rollback

Si Microsoft falla en producción:

1. Revertir el commit de `feat/m365-smtp` (recuperar el `import { Resend }`
   y los `resend.emails.send`).
2. Asegurarse que `RESEND_API_KEY` siga en Vercel (no la borramos).
3. Re-deploy.

Es una operación de ~5 minutos. El paquete `resend` queda instalado en
`package.json` por si hace falta.
