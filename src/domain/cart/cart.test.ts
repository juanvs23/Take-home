import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  addItem,
  removeItem,
  setQty,
  itemSubtotalCents,
  totalCents,
  type CartState,
} from './cart';

const base = { id: 'pz-001', nombre: 'Margarita', precio: 12.96 };

describe('cart | aritmética de dinero (centavos)', () => {
  it('convierte precio a centavos exactos', () => {
    expect(toCents(12.96)).toBe(1296);
    expect(toCents(10.5)).toBe(1050);
  });
  it('convierte centavos a decimal', () => {
    expect(fromCents(1296)).toBe(12.96);
    expect(fromCents(2016)).toBe(20.16);
  });
});

describe('cart | addItem', () => {
  it('agrega un item nuevo al carrito vacío', () => {
    const state: CartState = [];
    const next = addItem(state, base);
    expect(next).toHaveLength(1);
    expect(next[0]).toEqual({ ...base, cantidad: 1 });
  });
  it('incrementa cantidad si el item ya existe (mismo id y tipo)', () => {
    let state = addItem([], base);
    state = addItem(state, base);
    expect(state).toHaveLength(1);
    expect(state[0].cantidad).toBe(2);
  });
  it('trata items del mismo id con distinto tipo como distintos', () => {
    let state = addItem([], { id: 'pz-001', nombre: 'Margarita', precio: 12.96, tipo: 'grande' });
    state = addItem(state, { id: 'pz-001', nombre: 'Margarita', precio: 9, tipo: 'pequeña' });
    expect(state).toHaveLength(2);
  });
});

describe('cart | removeItem y setQty', () => {
  it('removeItem elimina por índice', () => {
    const state = addItem(addItem([], base), { id: 'beb-001', nombre: 'Coca', precio: 3 });
    const next = removeItem(state, 0);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe('beb-001');
  });
  it('setQty actualiza la cantidad', () => {
    const state = addItem([], base);
    const next = setQty(state, 0, 3);
    expect(next[0].cantidad).toBe(3);
  });
  it('setQty con 0 o negativo elimina el item', () => {
    const state = addItem([], base);
    expect(setQty(state, 0, 0)).toHaveLength(0);
    expect(setQty(state, 0, -1)).toHaveLength(0);
  });
});

describe('cart | totales', () => {
  it('calcula subtotal por item en centavos', () => {
    expect(itemSubtotalCents({ ...base, cantidad: 3 })).toBe(3888);
  });
  it('calcula el total del carrito en centavos', () => {
    let state: CartState = [];
    state = addItem(state, { id: 'pz-001', nombre: 'Margarita', precio: 12.96, cantidad: 1 });
    state = addItem(state, { id: 'beb-001', nombre: 'Coca-Cola', precio: 3.6, cantidad: 2 });
    expect(totalCents(state)).toBe(2016);
  });
  it('carrito vacío tiene total 0', () => {
    expect(totalCents([])).toBe(0);
  });
});
