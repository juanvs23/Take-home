import { describe, it, expect, vi } from 'vitest';
import { validateOrder, buildOrderPayload, postOrder } from './order';
import type { CartItem } from '../cart/CartItem';

const items: CartItem[] = [
  { id: 'pz-001', nombre: 'Margarita', precio: 12.96, cantidad: 1, tipo: 'grande' },
  { id: 'beb-001', nombre: 'Coca-Cola', precio: 3.6, cantidad: 2, tipo: 'grande' },
];

describe('order | validateOrder', () => {
  it('acepta un pedido válido', () => {
    expect(validateOrder({ name: 'Juan', email: 'juan@mail.com', items })).toEqual({ ok: true });
  });
  it('rechaza nombre vacío', () => {
    expect(validateOrder({ name: '', email: 'juan@mail.com', items }).ok).toBe(false);
  });
  it('rechaza email inválido', () => {
    expect(validateOrder({ name: 'Juan', email: 'no-email', items }).ok).toBe(false);
  });
  it('rechaza carrito vacío', () => {
    expect(validateOrder({ name: 'Juan', email: 'juan@mail.com', items: [] }).ok).toBe(false);
  });
  it('rechaza item con cantidad < 1', () => {
    const bad = [{ id: 'pz-001', nombre: 'X', precio: 10, cantidad: 0 }];
    expect(validateOrder({ name: 'Juan', email: 'juan@mail.com', items: bad }).ok).toBe(false);
  });
});

describe('order | buildOrderPayload', () => {
  it('trimea nombre y email y fija locale', () => {
    const payload = buildOrderPayload('  Juan  ', ' juan@mail.com ', items, 'es');
    expect(payload.name).toBe('Juan');
    expect(payload.email).toBe('juan@mail.com');
    expect(payload.locale).toBe('es');
  });
});

describe('order | postOrder', () => {
  const okResponse = () =>
    ({ ok: true, json: async () => ({ ok: true, success: true, total: 20.16 }) }) as Response;

  it('envía POST con Content-Type text/plain y body JSON', async () => {
    const fetcher = vi.fn(async () => okResponse());
    const res = await postOrder('https://example.com', { name: 'Juan', email: 'j@mail.com', items, total: 20.16 }, fetcher as typeof fetch);
    const [, init] = (fetcher as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('text/plain;charset=utf-8');
    expect(JSON.parse(init.body).name).toBe('Juan');
    expect(JSON.parse(init.body).total).toBe(20.16);
    expect(res.ok).toBe(true);
  });
  it('no envía si la validación falla', async () => {
    const fetcher = vi.fn(async () => okResponse());
    const res = await postOrder('https://example.com', { name: '', email: 'j@mail.com', items, total: 20.16 }, fetcher as typeof fetch);
    expect(res.ok).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('retorna error si fetch falla', async () => {
    const fetcher = vi.fn(async () => { throw new Error('network'); });
    const res = await postOrder('https://example.com', { name: 'Juan', email: 'j@mail.com', items, total: 20.16 }, fetcher as typeof fetch);
    expect(res.ok).toBe(false);
    expect(res.error).toContain('network');
  });
});
