# GanaderApp — Web (React)

SPA React del SaaS ganadero. Identidad visual: `design/system.md` del repo backend
(verde #1C3A2D, crema #F4F0E4, dorado #C99B3F, serif display).

## Arquitectura (igual a Electronica_Central_frontend)

- Vite + React 19 + Tailwind v4 + react-router 7 + axios.
- La API se consume por `VITE_API_URL` (env var de BUILD), ej:
  `https://ganaderia.187.127.19.244.sslip.io/api`.
  En desarrollo la ruta relativa `/api` se proxea con `API_PROXY_TARGET`.
- Token JWT en `localStorage` (`session.ts`); interceptor agrega `Authorization`
  y redirige a `/login` en 401.
- Contrato de la API: éxito `{ data }`, error `{ error: { code, message, details? } }`.

## Offline-first (PWA)

- `public/sw.js` cachea el shell de la app (network-first para `/api`, fallback
  al shell): la app abre en el potrero sin señal.
- `src/lib/offlineQueue.ts` guarda en `localStorage` las mutaciones que fallan
  por falta de conexión y las reenvía en orden al volver la red. El servidor
  sigue siendo autoritativo: lo que rechaza se quita de la cola y se muestra
  con su motivo en `SyncBanner` (nada se pierde ni se reporta como guardado).
- El manifest está enlazado en `index.html`, así que la app es instalable.

## Pantallas

`/login`, `/registro`, `/` (resumen del día), `/animales`, `/animales/:id`
(ficha con las 7 fases y consumo por lote), `/inventario`, `/alertas`,
`/reportes` (KPI con rango de fechas).

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción (`dist/`)
- `npm run preview` — sirve el build

## Docker

Multi-stage: build de Vite, luego nginx estático con fallback SPA
(`try_files ... /index.html`). Build arg `VITE_API_URL` define la URL de la API.
