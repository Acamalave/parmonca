# Cron jobs desactivados (stand-by, 16-ago-2026)

El proyecto está en pausa. Los dos cron jobs se quitaron de `vercel.json` para
no seguir consumiendo ejecuciones ni mantener viva la base de datos.

Para **reactivarlos**, devolver este bloque a `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/odoo/sync",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/backup/daily",
      "schedule": "0 6 * * *"
    }
  ]
}
```

- `/api/odoo/sync` — sincroniza el catálogo de repuestos desde Odoo (PA y CR).
  Corría cada 15 minutos: 96 ejecuciones al día.
- `/api/backup/daily` — vuelca todas las tablas a JSONL en el bucket privado
  `parmonca-backups`. Corría a las 6:00 UTC.

Las rutas y su código **siguen intactos**: solo se les quitó el disparador.
Ambas se pueden ejecutar a mano con `Authorization: Bearer $CRON_SECRET`.

> Antes de reactivar el sync, confirmar que `ODOO_API_KEY` sigue siendo válida
> y que existe el índice único **no parcial** `parmonca_repuestos_odoo_id_pais_key`
> (el `ON CONFLICT (odoo_id, pais)` del sync depende de él).
