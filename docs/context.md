# Contexto del Proyecto

## Información General
- **Nombre del proyecto**: Take-home (menú de pizzas) — workspace: /mnt/1TB/proyects/astro
- **Descripción**: Sitio Astro **estático** de menú de pizzas: lee productos de Google Sheets, carrito client-side, órdenes vía Apps Script a otra hoja. (Spec type: Entregable/take-home)
- **Fecha de inicio**: 2026-08-28
- **Estado**: Implementado con TDD (28 unit + 3 e2e). SDD con OpenSpec a nivel de spec (cambio: pizza-menu-orders)

## Stack Tecnológico
- **Framework**: Astro 7.2.9 — **estático** (`output: static` por defecto, sin adapter), una isla vanilla TS para el carrito
- **Estilos**: Tailwind CSS v4 (`@tailwindcss/vite`) + tokens de diseño Starbucks en `src/app/styles/global.css` (vía `@theme`)
- **Tests**: Vitest (unit, `npx vitest run`, environment node) + Playwright (e2e)
- **TypeScript**: Astro por defecto
- **Backend**: Google Sheets (4 pestañas: config, categorias, menu, ordenes) + Google Apps Script Web App (doGet menú / doPost orden)
- **Arquitectura**: Screaming Architecture — `src/domain/` (lógica pura), `src/app/` (presentación/orquestación), `src/infrastructure/` (adaptadores)
- **Diseño base**: Starbucks (getdesign) — verde Siren #006241, crema #f2f0eb, oro #c79f5a, Manrope/Nunito Sans
- **Deploy**: Vercel — URL live en README (pendiente)

## Arquitectura
- Astro estático: 1 página de menú + 1 isla de carrito (client-side)
- Flujo: Sheets(menu) → Apps Script doGet (JSON) → isla fetch client-side → render cards → carrito → POST text/plain → doPost → Sheets(orders)
- CORS gotcha: POST como `text/plain` (JSON en body) porque Apps Script no responde preflight

## Convenciones y Estándares
- SDD con OpenSpec (por inicializar para Take-home)
- Strict TDD si el proyecto lo soporta (detectar en sdd-init)
- Spec del entregable: README con pasos para preparar pizza + URL live
- Registro de conversaciones: docs/chat.md (obligatorio, cada intercambio)

## Decisiones Importantes
- 2026-08-28: SDD Session Preflight → interactivo, OpenSpec, single-pr, 400 líneas
- 2026-08-28: **Corrección de anclaje** — el proyecto es Take-home (Astro estático), NO astro-portfolio (server)
- 2026-08-28: Diseño base = Starbucks (getdesign), aplicado global en Take-home
- 2026-08-28: Backend = Google Sheets (menu, orders) + Apps Script Web App
- 2026-08-28 (exploración): AD-1 fetch client-side · AD-2 POST text/plain · AD-3 isla vanilla TS · AD-4 página única lang=es · AD-5 GitHub Pages primary/Vercel fallback · AD-6 precios centavos + Intl es-MX · AD-7 Starbucks global (verde #00704A 4 niveles, crema #f2f0eb, Manrope/Nunito Sans, botón Frap) · AD-8 items JSON + GAS en apps-script/Code.gs
- 2026-08-28 (config definitiva): **Alta Pinta** — pizzeria, USD (locale en-US), slogan "Pizza de calidad", logo `logo-pizzería-minimalista.png` (en public/ PNG/SVG/WebP). Categorías: pizzas, bebidas, postres
- 2026-08-28 (matriz v2): pestañas `config` (clave/valor), `categorias`, `menu` (con columna `tipos` JSON), `ordenes`. CSVs en `sheets/` listos para subir a Google Sheets
- 2026-08-28 (menú): 15 productos (5/categoría), imágenes descargadas a `public/img/` (Unsplash 800px). Tipos: pequeña (base), mediana +20%, grande +20% (1.44×)

## Contactos y Recursos
- Proyecto: /mnt/1TB/proyects/astro/Take-home (git init, "Initial commit from Astro")
- **Repo GitHub**: https://github.com/juanvs23/Take-home (público, commit 74212c7)
- Docs del proyecto: /mnt/1TB/proyects/astro/Take-home/docs/
- Otros proyectos del workspace (no relacionados): astro-portfolio, portfolio