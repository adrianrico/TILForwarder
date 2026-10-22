# TIL Forwarder (frontend)

SPA en React + Vite para administrar clientes, transportistas, rutas, maniobras y su seguimiento. Consume la API REST `TIL_Backend`.

## Inicio rápido

```bash
npm install
npm run dev      # usa .env.development (backend local en http://localhost:8080)
npm run build    # usa .env.production (HTTPS obligatorio)
npm run lint
```

`VITE_API_URL` define la URL de TIL_Backend con `/api/v1` (ver `.env.example`). El usuario y la contraseña los genera el portal TIL_Superadmin; el login se valida en `POST /client-auth/login` y el mismo JWT autoriza `/clients`, `/transporters`, `/routes` y `/maneuvers`.

## Estructura

```
src/
  app/        composición: App, tema, queryClient, navegación
  features/   clientes · transportistas · rutas · maniobras · seguimiento · dashboard
              (cada una con pages/, services/ y, si aplica, components/)
  shared/     api/ (cliente Axios seguro) · components/ · layout/ · utils/
```

Alias `@` → `src/`. Las páginas llaman a `services/*`, nunca a Axios directamente.

## Seguridad

HTTPS obligatorio en producción, timeouts, errores normalizados, CSP y cabeceras (`render.yaml`), sin CDNs externos para código, validación de coordenadas/URLs, `npm audit` limpio. Detalle en `docs/GUIA_APRENDIZAJE.md`.

## Documentación

- `docs/GUIA_APRENDIZAJE.md`: conceptos clave y guía paso a paso para construir un proyecto igual desde cero.
- `graphify-out/GRAPH_REPORT.md`: grafo de conocimiento del código.
