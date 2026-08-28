// dominio/order — modelo del pedido
import type { CartItem } from '../cart/CartItem';

/**
 * Payload de la orden que se envía a Apps Script (doPost).
 * IMPORTANTE: el campo es "name" (inglés) — el código GAS espera "name".
 * (No usar "nombre" — ese era el bug que rompía la validación.)
 */
export interface OrderPayload {
  name: string;
  email: string;
  items: CartItem[];
  total: number;
  locale?: string;
}

export interface OrderResult {
  ok: boolean;
  success?: boolean;
  total?: number;
  error?: string;
}
