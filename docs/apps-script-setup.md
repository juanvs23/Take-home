# Paso a Paso — Google Apps Script Web App (Alta Pinta)

Guía completa para desplegar el puente entre el sitio web y Google Sheets.
Este script es el "backend": `doGet` devuelve el menú, `doPost` registra órdenes.

> ✅ **Ya configurado**: la hoja de cálculo se llama **`pizza-alta`** y el script (`apps-script/Code.gs`) ya la referencia por ese nombre. Solo tienes que pegarlo y desplegarlo.

---

## 0. Requisitos previos

- Cuenta de Google (Gmail)
- Los 4 CSVs listos: `sheets/config.csv`, `sheets/categorias.csv`, `sheets/menu.csv`, `sheets/ordenes.csv`
- (El código del script estará en `apps-script/Code.gs` del proyecto)

---

## Paso 1 — Crear la hoja de cálculo (Google Sheets)

> ✅ **Ya hecho por el usuario**: la hoja se llama **`pizza-alta`** y los datos ya están subidos.

1. Ve a [sheets.new](https://sheets.new) — crea una hoja nueva en blanco
2. Nómbrala: **`pizza-alta`** ← el script la busca por este nombre exacto
3. Crea **4 pestañas** (abajo, botón `+`), una por cada CSV, con estos nombres **exactos**:
   - `config`
   - `categorias`
   - `menu`
   - `ordenes`
4. Sube los datos de cada CSV a su pestaña:
   - **Opción A (importar CSV)**: en cada pestaña → `Archivo` → `Importar` → `Subir` → selecciona el CSV → `Reemplazar hoja de cálculo`
   - **Opción B (copiar/pegar)**: abre cada CSV en un editor de texto y pega el contenido en la pestaña (A1)
5. **Verifica**: la fila 1 de cada pestaña son los encabezados (clave/valor, id/nombre/orden, etc.)

> ⚠️ Los nombres de las pestañas deben coincidir **exactamente** (minúsculas): `config`, `categorias`, `menu`, `ordenes`

---

## Paso 2 — Abrir el editor de Apps Script

1. En la hoja `pizza-alta`: menú `Extensiones` → `Apps Script`
2. Se abre el editor en una pestaña nueva
3. Borra el contenido por defecto (`function myFunction() {}`)

---

## Paso 3 — Pegar el código

1. Copia el contenido completo de **`apps-script/Code.gs`** del proyecto
2. Pégalo en el editor de Apps Script (reemplaza todo)
3. **Ya está configurado con tu hoja**:
   - `SHEET_ID = '1taXfQY86-gnLL1k15rltCPrDqi9K7GxpiV54_6aVoc8'` (método robusto `openById`)
   - `SHEET_NAME = 'pizza-alta'` (respaldo)
4. Guarda con `Ctrl+S` (o botón 💾)

> 💡 Si algún día cambias de hoja, el ID se toma de la URL: `https://docs.google.com/spreadsheets/d/` **`AQUI_EL_ID`** `/edit`

---

## Paso 4 — Desplegar como Web App

1. Botón **`Implementar`** (arriba a la derecha) → **`Nueva implementación`**
2. En **Tipo de implementación** → selecciona **`Aplicación web`**
3. Configura:
   - **Descripción**: `v1 - producción`
   - **Ejecutar como**: `Yo` (tu cuenta) — **importante**
   - **Quién tiene acceso**: `Cualquier persona` — **importante**
4. Clic en **`Implementar`**
5. **Autoriza**: aparecerá un aviso "La aplicación necesita permiso" → `Revisar permisos` → elige tu cuenta → `Avanzado` → `Ir a Alta Pinta... (no seguro)` → `Permitir`
6. **Copia la URL del Web App** que aparece:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   Guárdala — es tu `PUBLIC_SHEETS_URL`

> ⚠️ Cada vez que edites el código, debes hacer `Implementar` → **`Administrar implementaciones`** → ✏️ (lápiz) → `Nueva versión` → `Implementar` para que los cambios tomen efecto. La URL **no cambia** si usas "Nueva versión".

---

## Paso 5 — Probar el doGet (lectura del menú)

1. Abre la URL del Web App en el navegador (o una pestaña incógnito)
2. Deberías ver el **JSON del menú completo**:
   ```json
   {
     "config": { "rubro": "pizzeria", "marca": "Alta Pinta", ... },
     "categorias": [ { "id": "pizzas", "nombre": "Pizza", "orden": 1 }, ... ],
     "menu": [ { "id": "pz-001", "nombre": "Margarita", ... }, ... ]
   }
   ```
3. Si ves eso → ✅ doGet funcionando

---

## Paso 6 — Probar el doPost (registro de orden)

Puedes probarlo con `curl` (o Postman):

```bash
curl -X POST "https://script.google.com/macros/s/AKfycb.../exec" \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{"nombre":"Test","email":"test@mail.com","items":[{"id":"pz-001","nombre":"Margarita","precio":12.96,"cantidad":1,"tipo":"grande"}],"total":12.96,"locale":"es"}'
```

- Respuesta esperada: `{"success":true}`
- Revisa tu hoja → pestaña `ordenes` → debe aparecer **una fila nueva**

---

## Paso 7 — Conectar el sitio

1. En el proyecto, copia `.env.example` a `.env`
2. Pega tu URL del Web App:
   ```
   PUBLIC_SHEETS_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```
3. El sitio ya puede leer el menú y enviar órdenes

---

## Notas importantes (seguridad y operación)

- 🔒 **La hoja NO se comparte públicamente** — solo el script la lee/escribe ("ejecutar como Yo")
- 🔒 El script **recalcula el total server-side** (no confía en el total del navegador)
- 🔒 El script **sanitiza** los valores que empiezan con `=`, `+`, `-`, `@` (anti inyección de fórmulas)
- 🔒 El script **valida** nombre, email e items antes de escribir
- ⚠️ El acceso es "Cualquier persona" → cualquier usuario puede enviar órdenes (aceptable para demo/take-home)
- ⚠️ Si cambias el código, usa "Nueva versión" en Administrar implementaciones (la URL no cambia)

---

## Solución de problemas

| Problema | Causa | Solución |
|---|---|---|
| `404` o `ScriptError` al abrir la URL | Web App mal desplegado | Rehacer Paso 4, verifica "Cualquier persona" |
| JSON no aparece, sale HTML | Falta autorizar | Repetir Paso 4 punto 5 |
| `No se pudo abrir el archivo` | El script no puede abrir la hoja | Verifica `SHEET_ID` correcto (de la URL de la hoja) y que el script esté autorizado (Paso 4.5) |
| El menú está vacío en el sitio | URL mal en `.env` | Verifica `PUBLIC_SHEETS_URL` exacta |
| Las órdenes no llegan a la hoja | Nombre de pestaña distinto | Verifica `ordenes` minúscula exacta |
| CORS error en POST | Se envió con `application/json` | Debe ser `text/plain` (el sitio ya lo hace) |

---

## Paso 8 — Depuración (NUEVO)

El script incluye **depuradores integrados** para diagnosticar sin adivinar:

### Funciones de diagnóstico (en el selector de funciones del editor)

| Función | Qué hace | Cómo leerlo |
|---|---|---|
| `testConnection()` | Abre la hoja, verifica pestañas y lee datos | Devuelve JSON con pestañas reales/esperadas/faltantes |
| `testDoPost()` | Simula una orden COMPLETA de 2 items sin HTTP | Ejecuta todo el flujo doPost y devuelve el resultado |

### Cómo usarlas

1. En el editor de Apps Script, en el selector de funciones (arriba), elige `testConnection` o `testDoPost`
2. Clic en **Ejecutar** (▶️) — o **Depurar** (🐞) para usar breakpoints y ver el flujo paso a paso
3. Mira el resultado en **Ver → Registros** (o la pestaña "Ejecuciones")

### Qué registra el código (logStep)

- `doGet`: apertura de hoja, nº de config/categorías/productos
- `doPost` (paso a paso): body recibido → JSON parseado → validación → rate limit → total recalculado → pestaña ordenes → fila agregada
- Cualquier ERROR se registra con detalle y stack

### Resultados esperados

- `testConnection` → `{"ok":true,...}` con las 4 pestañas presentes
- `testDoPost` → `{"ok":true,"success":true,"total":20.16}` (Margarita grande 12.96 + 2 Coca-Cola grandes 7.20)
- Si algo falla, el log muestra el paso exacto del error

---

## Paso 9 — Autenticación con tu identidad (dueño) y scopes

**Cómo funciona**: el Web App está configurado con **`executeAs: USER_DEPLOYING`** ("Ejecutar como: Yo") — el script corre SIEMPRE con TU autenticación, sin importar quién visita el sitio. Por eso la hoja puede seguir siendo 100% privada (solo tú la ves) y el script la lee/escribe con tu identidad.

**Archivos que lo garantizan**:
- `appsscript.json` (manifest) — declara scopes explícitos:
  - `https://www.googleapis.com/auth/spreadsheets` (lectura + escritura)
  - `https://www.googleapis.com/auth/script.external_request`
  - `executeAs: USER_DEPLOYING` + `access: ANYONE_ANONYMOUS`
- `Code.gs` → `getAuthInfo()` — diagnóstico del estado de autorización

### Cómo verificar/repair la autorización

1. Pega `Code.gs` y `appsscript.json` en el proyecto (Archivo → Nuevo → Archivo HTML no; usa **Configuración del proyecto** o simplemente sube ambos archivos)
2. En el selector de funciones elige **`getAuthInfo`** → **Ejecutar** (▶️)
3. Si dice `authorizationStatus: REQUIRED`:
   - Ejecuta `testConnection()` y en el diálogo de permisos acepta **"Ver y administrar hojas de cálculo"** (¡debe ser el scope de escritura, no solo "Ver"!)
   - Alternativa: `Configuración del proyecto` (⚙️) → sección Scopes → verifica que aparezca `auth/spreadsheets`
4. Si dice `NOT_REQUIRED` → autorización completa, el script corre con tu identidad
5. Re-despliega con Nueva versión después de autorizar
