# Roadmap del Proyecto — Menú de Pizzas (Take-home)

## Visión General
Sitio Astro **estático** de una página: menú de pizzas desde Google Sheets, carrito client-side, órdenes vía Apps Script a una segunda hoja. Diseño Starbucks. Desplegado en **Vercel** con URL live en README.

## Fases SDD

| Fase | Estado | Notas |
|------|--------|-------|
| Preflight + Init | ✅ | Interactivo, OpenSpec, single-pr, 400 líneas |
| Exploración | ✅ | AD-1..AD-8 definidos; corregido anclaje a Take-home |
| Proposal | ✅ | Alta Pinta, USD, Vercel, limpieza de residuo astro-portfolio |
| Specs | ✅ | `openspec/changes/pizza-menu-orders/spec.md` (refleja el estado implementado) |
| Design | ✅ | `DESIGN.md` (Starbucks global) + tokens en global.css |
| Tasks | ✅ | Implementado con TDD (28 unit + 3 e2e) |
| Apply | ✅ | Screaming Architecture implementada, compila limpio |
| Verify | ✅ | 28 unit tests + 3 e2e tests pasando |
| Archive + Deploy | ✅ | Live en alta-pinta.coltmandev.dev · repo github.com/juanvs23/Take-home |

## Decisiones de Exploración (AD)
- AD-1: Fetch client-side del menú
- AD-2: POST `text/plain` (CORS workaround)
- AD-3: Isla vanilla TS (sin framework)
- AD-4: Página única `index.astro`, lang=es
- AD-5: Deploy Vercel (usuario eligió)
- AD-6: Precios en centavos + Intl
- AD-7: Identidad Starbucks global (verde #00704A, crema #f2f0eb, Manrope/Nunito Sans)
- AD-8: Items JSON en columna; GAS en apps-script/Code.gs

## Hitos Clave
| Hito | Fecha Objetivo | Estado |
|------|----------------|--------|
| Exploración completa | 2026-08-28 | ✅ |
| Proposal aprobado | 2026-08-28 | ✅ |
| Implementación (TDD) | 2026-08-28 | ✅ (28 unit + e2e) |
| Apps Script desplegado | 2026-08-28 | ✅ (Web App, doGet/doPost OK) |
| Repo en GitHub | 2026-08-28 | ✅ (publico, commits por hito) |
| Deploy + URL live | 2026-08-28 | ✅ https://alta-pinta.coltmandev.dev/ |

## Pendientes (usuario)
- [x] Desplegar y agregar URL live al README
- [ ] (Opcional) deploy formal a Vercel con el plugin instalado

## Dependencias y Riesgos
- CORS POST: requiere smoke test con GAS desplegado
- `PUBLIC_SHEETS_URL`: debe fallar visible si falta
- GAS deploy manual (nueva deployment = nueva URL)
- doPost público sin auth (aceptable take-home)