/**
 * Alta Pinta — Google Apps Script Web App
 * Puente entre el sitio Astro (estático) y Google Sheets.
 *
 * - doGet:  devuelve { config, categorias, menu } como JSON (lectura del menú)
 * - doPost: recibe una orden, valida, recalcula el total y agrega fila a "ordenes"
 *
 * Hoja de cálculo: pizza-alta (SHEET_ID configurado)
 */

/** Nombre exacto de la hoja de cálculo (spreadsheet) en Google Sheets. */
const SHEET_NAME = 'pizza-alta';

/**
 * ID de la hoja de cálculo (método robusto, sin permisos de Drive).
 * Se toma de la URL: https://docs.google.com/spreadsheets/d/AQUI_EL_ID/edit
 */
const SHEET_ID = '1taXfQY86-gnLL1k15rltCPrDqi9K7GxpiV54_6aVoc8';

/** Nombres exactos de las pestañas. */
const TAB_CONFIG = 'config';
const TAB_CATEGORIAS = 'categorias';
const TAB_MENU = 'menu';
const TAB_ORDENES = 'ordenes';

/** Límite anti-spam: máx. órdenes por email por hora. */
const RATE_LIMIT_PER_EMAIL_PER_HOUR = 5;

/* ============================================================
 * GET — devuelve el catálogo completo
 * ============================================================ */

function doGet() {
  try {
    logStep('doGet', 'inicio');
    const ss = getSpreadsheet();
    logStep('doGet', 'hoja abierta: ' + ss.getName());
    const config = readConfig(ss);
    const categorias = readCategorias(ss);
    const menu = readMenu(ss);
    logStep('doGet', 'config keys: ' + Object.keys(config).length +
      ' | categorias: ' + categorias.length +
      ' | productos: ' + menu.length);
    const payload = { config: config, categorias: categorias, menu: menu };
    return jsonResponse(payload);
  } catch (err) {
    logStep('doGet', 'ERROR: ' + String(err));
    return jsonResponse({ ok: false, error: 'Error al leer el catálogo', detail: String(err) });
  }
}

/* ============================================================
 * POST — registra una orden
 * ============================================================ */

function doPost(e) {
  try {
    logStep('doPost', 'inicio');
    // El sitio envía el body como text/plain (workaround CORS) con un JSON string
    const body = e && e.postData && e.postData.contents ? e.postData.contents : '';
    if (!body) {
      logStep('doPost', 'ERROR: body vacío');
      return jsonResponse({ ok: false, error: 'Body vacío' });
    }
    logStep('doPost', 'body recibido (' + body.length + ' chars)');

    let order;
    try {
      order = JSON.parse(body);
    } catch (err) {
      logStep('doPost', 'ERROR JSON inválido: ' + String(err));
      return jsonResponse({ ok: false, error: 'JSON inválido' });
    }
    logStep('doPost', 'order parseado: nombre=' + order.name + ' email=' + order.email +
      ' items=' + (order.items ? order.items.length : 0));

    // 1. Validar estructura
    const validation = validateOrder(order);
    if (!validation.ok) {
      logStep('doPost', 'ERROR validación: ' + validation.error);
      return jsonResponse({ ok: false, error: validation.error });
    }
    logStep('doPost', 'validación OK');

    // 2. Rate limit (anti-spam básico)
    const rate = rateLimit(order.email);
    if (!rate.ok) {
      logStep('doPost', 'ERROR rate limit: ' + rate.error);
      return jsonResponse({ ok: false, error: rate.error });
    }
    logStep('doPost', 'rate limit OK');

    // 3. Recalcular total server-side (no confiar en el total del cliente)
    const ss = getSpreadsheet();
    logStep('doPost', 'hoja abierta: ' + ss.getName());
    const menu = readMenu(ss);
    logStep('doPost', 'menú leído: ' + menu.length + ' productos');
    const total = computeTotal(order.items, menu);
    if (total <= 0) {
      logStep('doPost', 'ERROR total inválido: ' + total);
      return jsonResponse({ ok: false, error: 'Total inválido' });
    }
    logStep('doPost', 'total recalculado server-side: ' + total + ' (cliente envió: ' + order.total + ')');

    // 4. Sanitizar campos (anti inyección de fórmulas en Sheets)
    const safeName = sanitizeCell(order.name);
    const safeEmail = sanitizeCell(order.email);

    // 5. Agregar fila a la pestaña ordenes (se crea si no existe)
    const itemsJson = JSON.stringify(order.items);
    const row = [
      new Date(),            // timestamp
      safeName,              // nombre
      safeEmail,             // email
      itemsJson,             // items (JSON)
      total,                 // total (recalculado)
      order.estado || 'nueva',
    ];
    const ordenesSheet = getSheet(ss, TAB_ORDENES);
    logStep('doPost', 'pestaña ordenes lista: ' + ordenesSheet.getName() + ' (fila actual: ' + ordenesSheet.getLastRow() + ')');
    ordenesSheet.appendRow(row);
    logStep('doPost', 'fila agregada en fila ' + ordenesSheet.getLastRow());

    return jsonResponse({ ok: true, success: true, total });
  } catch (err) {
    logStep('doPost', 'ERROR capturado: ' + String(err) + (err && err.stack ? ' | stack: ' + err.stack : ''));
    return jsonResponse({ ok: false, error: 'Error al registrar la orden', detail: String(err) });
  }
}

/**
 * DIAGNÓSTICO 1/2 — Conexión y lectura.
 * Ejecutar desde el editor (▶️) y mirar Ver → Registros.
 * Devuelve {ok:true} si la hoja se abre y se leen los datos.
 */
function testConnection() {
  try {
    logStep('testConnection', 'inicio');
    const ss = getSpreadsheet();
    const pestañasReales = ss.getSheets().map(function (s) { return s.getName(); });
    const esperadas = [TAB_CONFIG, TAB_CATEGORIAS, TAB_MENU, TAB_ORDENES];
    const faltantes = esperadas.filter(function (name) { return pestañasReales.indexOf(name) === -1; });

    const info = {
      ok: true,
      hoja: ss.getName(),
      url: ss.getUrl(),
      pestañasReales: pestañasReales,
      pestañasEsperadas: esperadas,
      pestañasFaltantes: faltantes,
      config: readConfig(ss),
      categorias: readCategorias(ss).length,
      productos: readMenu(ss).length,
    };
    logStep('testConnection', 'resultado: ' + JSON.stringify({
      hoja: info.hoja,
      pestañas: pestañasReales.length,
      faltantes: faltantes,
      categorias: info.categorias,
      productos: info.productos,
    }));
    return JSON.stringify(info);
  } catch (err) {
    logStep('testConnection', 'ERROR: ' + String(err) + (err && err.stack ? ' | stack: ' + err.stack : ''));
    return JSON.stringify({ ok: false, error: String(err), stack: err && err.stack });
  }
}

/**
 * DIAGNÓSTICO 2/2 — Simula una orden COMPLETA desde el editor.
 * Ejecutar con ▶️ o depurar con 🐞 (breakpoints) para ver cada paso en los registros.
 * Usa un objeto e simulado (igual que recibiría un POST real del sitio).
 */
function testDoPost() {
  // [DEBUG] JSON hardcodeado literal — campo "name" (inglés) que el código espera
  var fakeEvent = {
    postData: {
      type: 'text/plain',
      contents: '{"name":"Prueba Depurador","email":"debug@test.com","items":[{"id":"pz-001","nombre":"Margarita","precio":12.96,"cantidad":1,"tipo":"grande"},{"id":"beb-001","nombre":"Coca-Cola","precio":3.6,"cantidad":2,"tipo":"grande"}],"total":20.16,"locale":"es"}'
    }
  };
  logStep('testDoPost', '=== JSON hardcodeado: ' + fakeEvent.postData.contents + ' ===');
  logStep('testDoPost', '=== chars: ' + fakeEvent.postData.contents.length + ' ===');
  var result = doPost(fakeEvent);
  logStep('testDoPost', '=== Resultado doPost: ' + result.getContent() + ' ===');
  return result.getContent();
}

/**
 * DIAGNÓSTICO 3/3 — Estado de AUTORIZACIÓN del script.
 * Muestra si la autorización OAuth está completa y, si no, la URL para autorizar.
 * Ejecutar desde el editor (▶️). Si authorizationStatus != REQUIRED, está OK.
 */
function getAuthInfo() {
  try {
    var info = ScriptApp.getAuthorizationInfo(ScriptApp.AuthorizationMode.WEB_APP);
    var status = info.getAuthorizationStatus();
    var result = {
      ok: status === ScriptApp.AuthorizationStatus.REQUIRED ? false : true,
      authorizationStatus: String(status),
      // Valores posibles: REQUIRED, NOT_REQUIRED, NONE, DEPRECATED
      requiereAutorizacion: status === ScriptApp.AuthorizationStatus.REQUIRED,
      urlAutorizacion: status === ScriptApp.AuthorizationStatus.REQUIRED ? info.getAuthorizationUrl() : null,
      consejo: status === ScriptApp.AuthorizationStatus.REQUIRED
        ? 'Falta autorización: ejecuta testConnection() y acepta el permiso "Ver y administrar hojas de cálculo"'
        : 'Autorización OK — el script corre con tu identidad (dueño)'
    };
    logStep('getAuthInfo', JSON.stringify(result));
    return JSON.stringify(result);
  } catch (err) {
    logStep('getAuthInfo', 'ERROR: ' + String(err));
    return JSON.stringify({ ok: false, error: String(err) });
  }
}

/* ============================================================
 * Lectura de la hoja
 * ============================================================ */

function getSpreadsheet() {
  // Método 1 (robusto): abrir por ID — no requiere permisos de Drive
  if (SHEET_ID && SHEET_ID !== 'PON_AQUI_EL_ID_DE_LA_HOJA') {
    return SpreadsheetApp.openById(SHEET_ID);
  }
  // Método 2: script creado desde la propia hoja (Extensiones → Apps Script)
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active && active.getName() === SHEET_NAME) return active;
  } catch (e) {
    // no hay hoja activa en un Web App desplegado → sigue
  }
  // SIN fallback de DriveApp: su error de plataforma no es capturable con
  // try/catch y produce el HTML "No se pudo abrir el archivo".
  throw new Error('SHEET_ID no configurado. Pega el ID real en la línea const SHEET_ID = ...');
}

/** Devuelve la pestaña o la CREA si no existe (evita fallos silenciosos). */
function getSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function readConfig(ss) {
  const rows = getSheet(ss, TAB_CONFIG).getDataRange().getValues();
  const config = {};
  for (let i = 1; i < rows.length; i++) {
    const key = String(rows[i][0] || '').trim();
    const value = rows[i][1];
    if (key) config[key] = value;
  }
  return config;
}

function readCategorias(ss) {
  const rows = getSheet(ss, TAB_CATEGORIAS).getDataRange().getValues();
  const categorias = [];
  for (let i = 1; i < rows.length; i++) {
    const id = String(rows[i][0] || '').trim();
    if (!id) continue;
    categorias.push({
      id: id,
      nombre: String(rows[i][1] || ''),
      orden: Number(rows[i][2] || 0),
    });
  }
  return categorias;
}

function readMenu(ss) {
  const rows = getSheet(ss, TAB_MENU).getDataRange().getValues();
  const menu = [];
  for (let i = 1; i < rows.length; i++) {
    const id = String(rows[i][0] || '').trim();
    if (!id) continue;
    const disponible = String(rows[i][7] || 'TRUE').toUpperCase() !== 'FALSE';
    if (!disponible) continue;
    const tipos = parseTipos(rows[i][4]);
    menu.push({
      id: id,
      nombre: String(rows[i][1] || ''),
      descripcion: String(rows[i][2] || ''),
      precio: Number(rows[i][3] || 0),
      tipos: tipos,
      categoria: String(rows[i][5] || '').trim(),
      imagen_url: String(rows[i][6] || ''),
    });
  }
  return menu;
}

/** La columna "tipos" guarda un JSON string: [{"nombre":"pequeña","precio":9},...] */
function parseTipos(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw; // ya es objeto (Sheets a veces auto-parsea)
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
}

/* ============================================================
 * Validación y seguridad
 * ============================================================ */

function validateOrder(order) {
  if (!order || typeof order !== 'object') return { ok: false, error: 'Orden inválida' };
  if (!order.name || typeof order.name !== 'string' || !order.name.trim())
    return { ok: false, error: 'Nombre requerido' };
  if (!order.email || typeof order.email !== 'string' || !isValidEmail(order.email.trim()))
    return { ok: false, error: 'Email inválido' };
  if (!Array.isArray(order.items) || order.items.length === 0)
    return { ok: false, error: 'Carrito vacío' };
  for (const item of order.items) {
    if (!item || typeof item !== 'object') return { ok: false, error: 'Item inválido' };
    if (!item.id) return { ok: false, error: 'Item sin id' };
    const qty = Number(item.cantidad);
    if (!Number.isFinite(qty) || qty < 1 || Math.floor(qty) !== qty)
      return { ok: false, error: 'Cantidad inválida' };
  }
  return { ok: true };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Recalcula el total con los precios REALES del menú (nunca confía en el cliente). */
function computeTotal(items, menu) {
  const byId = {};
  for (const m of menu) byId[m.id] = m;

  let total = 0;
  for (const item of items) {
    const prod = byId[item.id];
    if (!prod) return -1; // producto inexistente → inválido
    const qty = Number(item.cantidad);
    const tipo = item.tipo || 'pequeña';
    const precio = priceForTipo(prod, tipo);
    if (precio < 0) return -1;
    total += precio * qty;
  }
  return Math.round(total * 100) / 100;
}

/** Devuelve el precio para el tipo (pequeña/mediana/grande) según el JSON de la hoja. */
function priceForTipo(prod, tipo) {
  if (!prod.tipos || prod.tipos.length === 0) return Number(prod.precio) || 0;
  const found = prod.tipos.find(function (t) { return t.nombre === tipo; });
  if (found) return Number(found.precio);
  // fallback: primer tipo del JSON
  return Number(prod.tipos[0].precio) || 0;
}

/**
 * Anti inyección de fórmulas: si un valor empieza con = + - @ (o tab/CR),
 * lo neutraliza anteponiendo un apóstrofe para que Sheets lo trate como texto.
 */
function sanitizeCell(value) {
  let s = String(value || '').trim();
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

/** Rate limit simple: máx. RATE_LIMIT por email por hora, usando CacheService. */
function rateLimit(email) {
  const key = 'order-' + String(email).toLowerCase();
  const cache = CacheService.getScriptCache();
  const current = Number(cache.get(key) || 0);
  if (current >= RATE_LIMIT_PER_EMAIL_PER_HOUR) {
    return { ok: false, error: 'Demasiadas órdenes, intenta más tarde' };
  }
  cache.put(key, String(current + 1), 3600); // 1 hora
  return { ok: true };
}

/* ============================================================
 * Utilidades de respuesta y depuración
 * ============================================================ */

/** Log consistente para los registros de Apps Script (Ver → Registros). */
function logStep(fn, msg) {
  console.log('[' + fn + '] ' + msg);
}

function jsonResponse(obj) {
  const out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  // ContentService SIEMPRE responde HTTP 200 (no soporta 400/429/500).
  // Por eso el contrato es {ok:true} / {ok:false, error:...} en el body.
  return out;
}
