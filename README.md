# 🍕 Alta Pinta — Pizzería

Sitio web estático de **Alta Pinta** que lee el menú desde Google Sheets, permite armar un carrito y envía las órdenes a la hoja de pedidos vía Google Apps Script.

> **🔴 Live**: URL pendiente de despliegue (se agrega aquí cuando se publique).

---

## 📖 Resumen del proyecto

**Alta Pinta** es una pizzería cuyo sitio funciona como un menú digital en vivo: los productos viven en una hoja de Google Sheets y se muestran en la página al cargar, así que **editar la hoja actualiza el sitio sin redeploy**. El cliente arma su carrito (puede elegir tamaño y cantidad) y lo envía como una orden; el backend la valida, recalcula el total y la guarda en la pestaña de pedidos.

**Flujo**: Google Sheets (`menu`) → Web App `doGet` (JSON) → isla Astro (fetch client-side) → tarjetas → carrito → POST `text/plain` → Web App `doPost` → Google Sheets (`ordenes`).

**Características**:
- Menú con categorías (pizzas, bebidas, postres) y tamaños escalonados (pequeña/mediana/grande, +20% por nivel).
- Carrito client-side con drawer, cantidad editable y eliminación por item.
- Checkout con nombre + email; modal de confirmación al enviar la orden.
- Backend defensivo: validación server-side, recálculo del total (no confía en el cliente), sanitización anti-fórmulas y rate-limit.

---

## 🍕 Cómo preparar una pizza

¿Quieres una pizza casera perfecta? Sigue estos pasos simples:

1. **Precalienta el horno** a 250 °C (con una piedra o bandeja dentro).
2. **Estira la masa** sobre harina hasta ~5 mm y colócala en la bandeja.
3. **Cubre con salsa** de tomate dejando 1 cm de borde.
4. **Añade queso** mozzarella y tus ingredientes favoritos.
5. **Hornea 10–12 min** hasta que el queso burbujee y el borde se dore.
6. **Saca, corta y disfruta.**

---

## 🎨 Diseño

Identidad **Starbucks** (getdesign) adaptada con el color de marca del logo (verde Siren) y un acento oro. Sistema de tokens en `src/app/styles/global.css` + especificación en `DESIGN.md`. Elemento firma: botón flotante **Frap** para el carrito.

---

## ⚡ Stack

- **Astro 7** — sitio estático (`output: static`), con una isla vanilla TS para el carrito.
- **Google Sheets** — base de datos (pestañas `config`, `categorias`, `menu`, `ordenes`).
- **Google Apps Script Web App** — puente `doGet` (lee menú) / `doPost` (agrega orden).
- **Tailwind CSS v4** — utilitarios sobre tokens de diseño.
- **Vitest** — tests unit de la lógica de dominio (28).
- **Playwright** — tests e2e del flujo completo.

---

## 🏗️ Arquitectura (Screaming Architecture)

```
src/
├── domain/         # Lógica pura (sin framework ni DOM) — unit-tested
│   ├── menu/       # MenuItem, PriceTier, parseMenuEntry, fetchMenu
│   ├── cart/       # CartItem, add/remove/qty, totales (centavos), createCartStore
│   └── order/      # OrderPayload/Result, validateOrder, buildOrderPayload, postOrder
├── app/            # Presentación + orquestación client-side
│   ├── layout/BaseLayout.astro
│   ├── components/ # Header, Hero, MenuGrid, CartDrawer, FrapButton, OrderSuccessModal, Footer
│   ├── island.ts   # initIsland() — conecta dominio con DOM
│   └── styles/global.css  # design tokens + Tailwind @theme
├── infrastructure/ # Adaptadores del mundo exterior
│   ├── env.ts      # PUBLIC_SHEETS_URL tipado + fail-visible
│   └── sheets/     # Code.gs + appsscript.json (el bridge GAS)
└── pages/index.astro
```

La **lógica de negocio vive en `domain/`** (pura y testeable); `app/` solo orquesta la UI; `infrastructure/` aísla el mundo exterior (env, Google).

---

## 🚀 Puesta en marcha local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# → pega la URL del Web App de Apps Script en PUBLIC_SHEETS_URL

# 3. Levantar en desarrollo
npm run dev
```

---

## 🧪 Tests

```bash
npm test          # unit (Vitest) — lógica de dominio
npm run test:e2e  # e2e (Playwright) — flujo completo con el Web App real
npm run build     # build estático
```

---

## 📄 Setup de Google Apps Script (back-end)

1. Crea una hoja de cálculo **`pizza-alta`** con las pestañas `config`, `categorias`, `menu`, `ordenes` (los CSVs están en `sheets/`).
2. Crea un proyecto de Apps Script, pega `src/infrastructure/sheets/Code.gs`, y configura el `SHEET_ID` (el ID de tu hoja).
3. Despliega como **Web App**: *Ejecutar como: Yo* · *Acceso: Cualquier persona*.
4. Copia la URL resultante a `.env` → `PUBLIC_SHEETS_URL`.

> 📖 Guía paso a paso completa en `docs/apps-script-setup.md`.

---

## 🌐 Despliegue

Sitio estático — publícalo donde prefieras (GitHub Pages, Vercel, Netlify):

```bash
npm run build   # genera dist/
```

- **GitHub Pages**: push a un repo + GitHub Actions con `base: '/repo-nombre/'`.
- **Vercel**: `vercel deploy --prod` (zero-config).

---

## 🔗 Código fuente

📦 Repositorio: [github.com/juanvs23/Take-home](https://github.com/juanvs23/Take-home)

---

Hecho con Astro + Google Sheets. 🍕
