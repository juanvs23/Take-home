# Spec: pizza-menu-orders (Take-home — Alta Pinta)

> Change: `pizza-menu-orders` · Project: `Take-home` · Date: 2026-08-28
> Status: **Implemented** (refleja el estado actual del código, no un plan futuro).
> This spec replaces the stale `exploration.md` (which was anchored to GitHub Pages / MXN / `src/lib/pizza/` — superseded by the implemented state).

## Overview

Sitio web **estático** de una página para **Alta Pinta**, una pizzería. Lee el menú desde **Google Sheets** (vía un Web App de **Google Apps Script**), permite armar un **carrito client-side** y envía las órdenes de vuelta a la hoja de pedidos. Construido con **Astro 7.2.9** en modo estático (`output: static`), **TypeScript**, **Tailwind CSS v4** y una sola isla vanilla TS para la interactividad.

- **Marca**: Alta Pinta
- **Rubro**: pizzería
- **Moneda**: USD (locale `en-US`)
- **Slogan**: "Pizza de calidad"
- **Deploy**: Vercel (pendiente de URL live)
- **Backend**: Google Sheets (pestañas `config`, `categorias`, `menu`, `ordenes`) + Web App de Apps Script (`doGet` / `doPost`)

## Architecture (Screaming Architecture)

La estructura separa dominio (lógica pura), aplicación (presentación/orquestación) e infraestructura (adaptadores del mundo exterior).

```
Take-home/
├── src/
│   ├── domain/               # lógica pura, DOM-free, unit-tested
│   │   ├── menu/             # MenuItem, PriceTier, parseMenuEntry, fetchMenu
│   │   ├── cart/             # CartItem, addItem/removeItem/setQty/totals, createCartStore
│   │   └── order/            # OrderPayload/OrderResult, validateOrder, buildOrderPayload, postOrder
│   ├── app/                  # presentación + orquestación client-side
│   │   ├── layout/BaseLayout.astro
│   │   ├── components/       # Header, Hero, MenuGrid, CartDrawer, FrapButton, Footer
│   │   ├── island.ts         # initIsland() — conecta dominio con DOM
│   │   └── styles/global.css # design tokens Starbucks + Tailwind @theme
│   ├── infrastructure/       # adaptadores
│   │   ├── env.ts            # PUBLIC_SHEETS_URL tipado + fail-visible
│   │   └── sheets/           # Code.gs + appsscript.json (el puente GAS)
│   └── pages/index.astro     # página única
├── apps-script/              # Code.js + appsscript.json + .clasp.json (mirror del GAS)
├── sheets/                   # CSVs (config, categorias, menu, ordenes) con delimiter ;
├── e2e/site.spec.ts          # Playwright (3 tests)
├── docs/                     # context.md, roadmap.md, chat.md, apps-script-setup.md
└── openspec/config.yaml
```

## Data Model

### MenuItem (`src/domain/menu/MenuItem.ts`)
```ts
interface PriceTier { nombre: 'pequeña' | 'mediana' | 'grande'; precio: number }
interface MenuItem {
  id: string; nombre: string; descripcion: string; precio: number;
  tipos?: PriceTier[]; categoria: string; imagen_url?: string; disponible: boolean;
}
```

### CartItem (`src/domain/cart/CartItem.ts`)
```ts
interface CartItem {
  id: string; nombre: string; precio: number; cantidad: number;
  tipo?: string; imagen_url?: string;
}
```

### OrderPayload / OrderResult (`src/domain/order/types.ts`)
```ts
interface OrderPayload { name: string; email: string; items: CartItem[]; total: number; locale?: string }
interface OrderResult { ok: boolean; success?: boolean; total?: number; error?: string }
```
> Note (RFC 2119 — MUST): el campo es `name` en inglés; el código GAS espera `name`. Usar `nombre` era un bug que rompía la validación.

### Google Sheets schema (la hoja es la fuente de verdad)
| Sheet | Columns |
|-------|---------|
| `config` | clave/valor: rubro, marca, moneda (USD), slogan, logo |
| `categorias` | id, nombre, orden |
| `menu` | id, nombre, descripcion, precio, tipos (JSON), categoria, imagen_url, disponible |
| `ordenes` | timestamp, nombre, email, items (JSON), total, estado |

## Requirements (RFC 2119)

### R1 — Menú desde la hoja
The site **MUST** render the product menu fetched at runtime from the Apps Script `doGet` endpoint, which returns a single envelope `{ config, categorias, menu }`.

- R1.1 The fetch **MUST** be client-side in the island (no build-time fetch), since static output has no server at runtime and the endpoint may be undeployed during builds.
- R1.2 The island **MUST** follow the Apps Script `302` redirect to `script.googleusercontent.com` and parse JSON even when the echo `content-type` is not `application/json`.
- R1.3 Each menu row **MUST** be normalized via `parseMenuEntry`; rows missing `id`, `nombre`, `descripcion`, or a non-finite `precio` **MUST** be dropped.
- R1.4 Items with `disponible === false` **MUST** be excluded.

#### Scenario: Menú cargado
Given the endpoint returns a valid envelope, when the island calls `fetchMenu(url)`, then the grid renders one `.menu-card` per product with name, description, price, and image (when `imagen_url` is present).

#### Scenario: Carga en progreso
Given the menu is still loading, when the page first renders, then 6 skeleton cards (`[data-menu-skeleton]`) **SHOULD** be shown until the fetch resolves.

#### Scenario: Menú fallido
Given `PUBLIC_SHEETS_URL` is missing or the fetch throws, when the island tries to load, then the skeletons are hidden and `[data-menu-error]` **SHALL** become visible with a clear message. The site **MUST** fail visibly, never silently.

### R2 — Config de marca
The site **MUST** read brand config (marca, slogan, moneda, logo) from the `config` sheet so the brand is editable in the sheet without redeploy.

#### Scenario: Marca por defecto
Given no config is loaded in a given render, when the header renders, then it **SHOULD** fall back to `"Alta Pinta"` / `"Pizza de calidad"`.

### R3 — Carrito client-side
The cart **MUST** be a client-side store built on pure domain functions, with no framework dependency.

- R3.1 Adding an item that already exists (same `id` + `tipo`) **MUST** increment its `cantidad`; otherwise it **MUST** append a new item.
- R3.2 `setQty` to `<= 0` **MUST** remove the item.
- R3.3 All money math **MUST** be done in cents (`toCents`/`fromCents`) to avoid float drift.
- R3.4 The cart state **MUST** persist across reloads via `localStorage` under key `alta-pinta-cart`.

#### Scenario: Agregar producto
Given the menu is rendered, when the user clicks `+ Agregar` on a card, then the item is added to the store, the Frap counter increments, and the cart total updates.

#### Scenario: Cantidad a cero
Given an item is in the cart with `cantidad=1`, when the user presses `−`, then the item is removed from the cart.

### R4 — Envío de la orden
The site **MUST** post the order to the Apps Script `doPost` endpoint using `Content-Type: text/plain` with the JSON body (CORS workaround — Apps Script cannot answer an `OPTIONS` preflight).

- R4.1 The payload **MUST** use field `name` (NOT `nombre`).
- R4.2 Validation **MUST** run client-side before submit: non-empty name, non-empty valid email, at least one item, each item with `id` and `cantidad >= 1`.
- R4.3 The total uploaded **MUST** be the client-computed total; the server **MUST** recompute it from the real menu and never trust the client total.

#### Scenario: Orden enviada con éxito
Given the cart has items and a valid name/email, when the user submits the checkout form, then `doPost` returns `{ ok: true }`, the cart is cleared, the form is reset, and a success status message shows the total.

#### Scenario: Orden rechazada
Given `doPost` returns `{ ok: false }` or a network error occurs, when the user submits, then an error status **MUST** be shown and the cart **MUST NOT** be cleared.

### R5 — Diseño (Starbucks + marca)
The design **MUST** follow `DESIGN.md`: Starbucks/Siren green four-tier system, cream canvas, gold brand accent, Manrope/Nunito Sans, 12px cards, 50px pills, and the floating **Frap** cart button as the signature element.

- R5.1 Buttons **MUST** have a touch target `>= 44px`.
- R5.2 An `:focus-visible` ring **MUST** be present everywhere.
- R5.3 `prefers-reduced-motion` **MUST** disable transitions/animations.
- R5.4 No gradients (system is solid color-block); the cream → white cards → House Green footer bookend **SHALL** be preserved.

### R6 — Seguridad del backend
The Apps Script bridge **MUST** apply defensive measures regardless of client behavior.

- R6.1 `doPost` **MUST** validate name/email/items server-side.
- R6.2 `doPost` **MUST** recompute the total against the real menu (never trust the client total).
- R6.3 `doPost` **MUST** sanitize cells against formula injection (`= + - @`). It **SHOULD** prefix a `'` to values starting with those characters.
- R6.4 `doPost` **SHOULD** rate-limit to 5 orders per email per hour via `CacheService`.
- R6.5 `doGet` **MUST** return only the menu/config/categorias envelope and **SHALL NOT** expose the `ordenes` sheet.
- R6.6 The spreadsheet itself **MUST** remain private; the Web App runs as "Me" (owner) with access "Anyone".

### R7 — Backend bridge
The repository **MUST** ship the Apps Script source at `apps-script/Code.js` (mirrored in `src/infrastructure/sheets/Code.gs`), and the deployment guide at `docs/apps-script-setup.md`.

- R7.1 The spreadsheet **MUST** be `pizza-alta` (`SHEET_ID = 1taXfQY86-gnLL1k15rltCPrDqi9K7GxpiV54_6aVoc8`).
- R7.2 `getSpreadsheet()` **MUST** use `SpreadsheetApp.openById(SHEET_ID)` (no `DriveApp` fallback — its platform error is not catchable).
- R7.3 The manifest **MUST** declare `executeAs: USER_DEPLOYING` and access `ANYONE_ANONYMOUS`, with `spreadsheets` in `oauthScopes` (read + write).
- R7.4 Diagnostic functions `testConnection()`, `testDoPost()`, and `getAuthInfo()` **SHOULD** exist for debugging.

### R8 — Calidad
The project **MUST** keep the pure domain logic unit-tested and the full flow e2e-tested.

- R8.1 `npm test` (Vitest, environment `node`) **MUST** pass — 28 unit tests across `src/domain/**/*.test.ts`.
- R8.2 `npm run test:e2e` (Playwright, single chromium worker, `baseURL: http://localhost:4321`) **MUST** pass — 3 e2e tests.
- R8.3 `npm run build` **MUST** produce a static `dist/` (output: static).

## Non-goals

- Multi-page / routing beyond `/` (single page only).
- Server-side rendering / `output: server` (spec requires static).
- Authentication of customers (public unauthenticated `doPost` is acceptable for take-home scope).
- A backend proxy to hide the Apps Script URL (breaks the static requirement).
- i18n beyond the single Spanish page (lang="es").

## Open questions (non-blocking)

- Live URL after Vercel deploy (to be added to README).
- Whether to add a serverless proxy for production-grade auth (out of scope v1).
