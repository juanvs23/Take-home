// dominio/menu — acceso al catálogo del menú (pure, DOM-free)
import type { MenuItem, PriceTier } from './MenuItem';

export interface RawMenuEntry {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria?: string;
  imagen_url?: string;
  disponible?: boolean;
  tipos?: PriceTier[];
}

/** Normaliza una entrada del menú (objeto JSON del doGet) a MenuItem. */
export function parseMenuEntry(entry: RawMenuEntry): MenuItem | null {
  if (!entry) return null;
  const id = String(entry.id ?? '').trim();
  const nombre = String(entry.nombre ?? '').trim();
  const descripcion = String(entry.descripcion ?? '').trim();
  const precio = Number(entry.precio);
  if (!id || !nombre || !descripcion || !Number.isFinite(precio)) return null;
  return {
    id,
    nombre,
    descripcion,
    precio,
    categoria: entry.categoria ? String(entry.categoria).trim() : '',
    imagen_url: entry.imagen_url ? String(entry.imagen_url).trim() : undefined,
    disponible: entry.disponible !== false,
    tipos: Array.isArray(entry.tipos) ? entry.tipos : undefined,
  };
}

/**
 * Obtiene el menú desde el endpoint de Apps Script (doGet).
 * El endpoint devuelve { config, categorias, menu: [MenuItem] }.
 *
 * NOTA (redirect de Apps Script): el Web App responde 302 a
 * script.googleusercontent.com. El fetch del navegador debe seguir el
 * redirect explícitamente (redirect: 'follow' / 'manual') y luego leer el
 * texto, porque el content-type del echo a veces no es application/json.
 */
export async function fetchMenu(url: string, fetcher: typeof fetch = fetch): Promise<MenuItem[]> {
  // 1er intento: seguir redirects normales
  let res = await fetcher(url, { redirect: 'follow' });

  // 2º intento: si el content-type no es JSON, leer como texto y parsear (Apps Script echo)
  const ctype = res.headers.get('content-type') ?? '';
  let raw: unknown;
  if (ctype.includes('application/json')) {
    raw = await res.json();
  } else {
    const text = await res.text();
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error(`Respuesta inesperada del servidor (${res.status})`);
    }
  }

  if (!res.ok && !raw) throw new Error(`Error al cargar el menú (${res.status})`);
  const data = raw as { menu?: RawMenuEntry[] };
  const arr = Array.isArray(data.menu) ? data.menu : [];
  return arr.map(parseMenuEntry).filter((m): m is MenuItem => m !== null);
}
