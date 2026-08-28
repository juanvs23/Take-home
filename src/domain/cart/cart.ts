// dominio/cart — lógica pura del carrito (sin DOM, sin framework)
import type { CartItem } from './CartItem';

export type CartState = CartItem[];

/** Centavos para aritmética exacta de dinero. */
export function toCents(value: number): number {
  return Math.round(value * 100);
}
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Agrega un item al carrito; si ya existe (mismo id+tipo), incrementa cantidad. */
export function addItem(state: CartState, item: Omit<CartItem, 'cantidad'> & { cantidad?: number }): CartState {
  const qty = item.cantidad ?? 1;
  const existing = state.findIndex((i) => i.id === item.id && (i.tipo ?? '') === (item.tipo ?? ''));
  if (existing >= 0) {
    const next = [...state];
    next[existing] = { ...next[existing], cantidad: next[existing].cantidad + qty };
    return next;
  }
  return [...state, { ...item, cantidad: qty } as CartItem];
}

/** Quita el item por índice. */
export function removeItem(state: CartState, index: number): CartState {
  return state.filter((_, i) => i !== index);
}

/** Cambia cantidad (>=1); si es 0 o negativo, se elimina. */
export function setQty(state: CartState, index: number, qty: number): CartState {
  if (qty <= 0) return removeItem(state, index);
  const next = [...state];
  next[index] = { ...next[index], cantidad: qty };
  return next;
}

/** Subtotal de un item (precio unitario * cantidad) en centavos. */
export function itemSubtotalCents(item: CartItem): number {
  return toCents(item.precio) * item.cantidad;
}

/** Total del carrito en centavos. */
export function totalCents(state: CartState): number {
  return state.reduce((acc, item) => acc + itemSubtotalCents(item), 0);
}
