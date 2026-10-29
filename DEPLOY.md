# Despliegue en Render (Static Site, configuración manual)

| Campo | Valor |
|---|---|
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |

## Variables de entorno
| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://til-backend.onrender.com/api/v1` (URL real del backend + `/api/v1`) |

La variable se incrusta al compilar: tras cambiarla hay que redeplegar.

## Rewrite (SPA)
En **Redirects/Rewrites** del servicio agregar:
- Source `/*` · Destination `/index.html` · Action **Rewrite**

## Cabeceras recomendadas (Headers del servicio)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`: `connect-src` debe incluir el dominio del backend.

## Después de desplegar
Agregar la URL pública de **Forwarder** a `CORS_ORIGINS` del backend y redeplegar el backend.
