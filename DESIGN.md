---
version: beta
name: Alta-Pinta-design
description: |
  Sistema de diseño para Alta Pinta, pizzería con menú desde Google Sheets.
  Basado en la paleta Starbucks (getdesign) adaptada con el color de marca del logo
  (verde Siren #006241 ≈ logo #016241 + oro/ámbar #c79f5a). Aplicado globalmente
  porque el proyecto no tenía identidad previa. Página única con menú en tarjetas,
  carrito client-side y envío de órdenes.

colors:
  green-siren: "#006241"       # encabezados / señal de marca (≈ logo)
  green-accent: "#00754A"      # píldoras rellenas (CTAs), botón Frap
  green-house: "#1E3932"       # footer / bookend oscuro
  green-uplift: "#2b5148"      # acentos decorativos
  green-light: "#d4e9e2"       # tinte de estado válido
  gold-brand: "#c79f5a"        # acento de marca (del logo Alta Pinta)
  cream: "#f2f0eb"             # canvas de página
  ceramic: "#edebe9"           # separadores de zona
  card: "#ffffff"              # superficie de tarjeta
  text-black: "rgba(0,0,0,0.87)"
  text-soft: "rgba(0,0,0,0.58)"
  text-white: "#ffffff"
  text-white-soft: "rgba(255,255,255,0.70)"
  red: "#c82014"               # errores

typography:
  display:
    fontFamily: Manrope
    fontWeight: 600
    letterSpacing: -0.01em
  body:
    fontFamily: Nunito Sans
    fontWeight: 400
    letterSpacing: -0.01em

rounded:
  card: 12px
  pill: 50px

spacing:
  s1: 0.4rem
  s2: 0.8rem
  s3: 1.6rem
  s4: 2.4rem
  s5: 3.2rem
  s6: 4rem
  s7: 4.8rem
  s8: 5.6rem
  s9: 6.4rem

components:
  menu-card:
    - white surface, 12px radius, --shadow-card
    - nombre: 600 Siren green
    - descripcion: --text-soft
    - precio: 600 Text Black
    - boton "+ Agregar": pill 50px green-accent, min 44x44
  menu-grid:
    - repeat(auto-fill, minmax(240px, 1fr)) -> 1/2/3 columnas
  cart-frap:
    - boton flotante circular 56px green-accent, sombra --shadow-frap, scale(0.95)
    - mobile: bottom-sheet; desktop: aside sticky
  primary-cta:
    - pill 50px green-accent fill, white 16/600 text, min-height 44px
  order-form:
    - etiquetas visibles (nunca solo placeholder)
    - email validado inline; error --red; valido --green-light
  footer:
    - House Green #1E3932, white / rgba(255,255,255,0.70) text

rules:
  - Sin gradientes — sistema de bloques de color sólidos
  - Bookend color-block: header crema -> cards blancas -> footer House Green
  - Elemento firma: boton Frap flotante (único elemento audaz)
  - Contrast AA: #00754A on white 4.7:1 | white on #00754A ok | #006241 on cream 10:1
  - Touch targets >= 44px
  - Focus ring green-accent; prefers-reduced-motion respetado
