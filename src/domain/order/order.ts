// dominio/order — lógica del pedido (payload, validación, POST)
import type { CartItem } from '../cart/CartItem';
import { totalCents, fromCents } from '../cart/cart';
import type { OrderPayload, OrderResult } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida el payload del pedido antes de enviarlo. */
export function validateOrder(payload: Omit<OrderPayload, 'total'>): { ok: boolean; error?: string } {
  if (!payload.name || !payload.name.trim()) return { ok: false, error: 'El nombre es requerido' };
  if (!payload.email || !payload.email.trim()) return { ok: false, error: 'El email es requerido' };
  if (!EMAIL_RE.test(payload.email.trim())) return { ok: false, error: 'Email inválido' };
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { ok: false, error: 'El carrito está vacío' };
  }
  for (const item of payload.items) {
    if (!item.id || item.cantidad < 1) return { ok: false, error: 'Ítem inválido' };
  }
  return { ok: true };
}

/** Construye el payload de la orden con el total recalculado en centavos. */
export function buildOrderPayload(
  name: string,
  email: string,
  items: CartItem[],
  locale = 'es'
): Omit<OrderPayload, 'total'> {
  return { name: name.trim(), email: email.trim(), items, locale };
}

/**
 * Envía la orden a Apps Script (doPost).
 * Usa Content-Type: text/plain (workaround CORS — Apps Script no responde preflight).
 * El body es el JSON string.
 */
export async function postOrder(
  url: string,
  payload: OrderPayload,
  fetcher: typeof fetch = fetch
): Promise<OrderResult> {
  const validation = validateOrder(payload);
  if (!validation.ok) return { ok: false, error: validation.error };

  const total = fromCents(totalCents(payload.items));
  const body = JSON.stringify({ ...payload, total });

  try {
    const res = await fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
    });
    const data = (await res.json()) as OrderResult;
    return { ok: data.ok === true, success: data.success === true, total: data.total, error: data.error };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error de red al enviar la orden' };
  }
}
