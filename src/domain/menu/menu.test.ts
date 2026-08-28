import { describe, it, expect, vi } from 'vitest';
import { parseMenuEntry, fetchMenu, type RawMenuEntry } from './menu';

describe('menu | parseMenuEntry', () => {
  it('parsea una entrada válida a MenuItem', () => {
    const item = parseMenuEntry({
      id: 'pz-001',
      nombre: 'Margarita',
      descripcion: 'Salsa, mozzarella',
      precio: 12.96,
      categoria: 'pizzas',
      imagen_url: '/img/pz-001.jpg',
      disponible: true,
    });
    expect(item).toEqual({
      id: 'pz-001',
      nombre: 'Margarita',
      descripcion: 'Salsa, mozzarella',
      precio: 12.96,
      categoria: 'pizzas',
      imagen_url: '/img/pz-001.jpg',
      disponible: true,
    });
  });
  it('preserva los tipos (tamaños escalonados)', () => {
    const item = parseMenuEntry({
      id: 'pz-001', nombre: 'Pizza', descripcion: 'Desc', precio: 9,
      tipos: [{ nombre: 'pequeña', precio: 9 }, { nombre: 'mediana', precio: 10.8 }],
    });
    expect(item?.tipos).toHaveLength(2);
    expect(item?.tipos?.[1].precio).toBe(10.8);
  });
  it('devuelve null si falta id/nombre/descripcion o precio no numérico', () => {
    expect(parseMenuEntry(undefined as unknown as RawMenuEntry)).toBeNull();
    expect(parseMenuEntry({ id: '', nombre: 'N', descripcion: 'D', precio: 10 })).toBeNull();
    expect(parseMenuEntry({ id: 'x', nombre: '', descripcion: 'D', precio: 10 })).toBeNull();
    expect(parseMenuEntry({ id: 'x', nombre: 'N', descripcion: 'D', precio: NaN })).toBeNull();
  });
  it('marca disponible false si viene false', () => {
    const item = parseMenuEntry({ id: 'x', nombre: 'N', descripcion: 'D', precio: 10, disponible: false });
    expect(item?.disponible).toBe(false);
  });
});

describe('menu | fetchMenu', () => {
  const okJson = (body: unknown) =>
    ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => body,
      text: async () => JSON.stringify(body),
    }) as unknown as Response;

  it('obtiene y parsea el menú desde el response', async () => {
    const fetcher = vi.fn(async () =>
      okJson({ menu: [{ id: 'pz-001', nombre: 'Margarita', descripcion: 'Desc', precio: 12.96 }] })
    );
    const menu = await fetchMenu('https://example.com/exec', fetcher as typeof fetch);
    expect(menu).toHaveLength(1);
    expect(menu[0].id).toBe('pz-001');
  });
  it('lanza error si el response no es ok', async () => {
    const fetcher = vi.fn(async () => ({ ok: false, status: 500 }) as Response);
    await expect(fetchMenu('https://example.com', fetcher as typeof fetch)).rejects.toThrow();
  });
  it('filtra entradas inválidas', async () => {
    const fetcher = vi.fn(async () =>
      okJson({ menu: [{ id: 'pz-001', nombre: 'Pizza', descripcion: 'Desc', precio: 10 }, { id: '' }] })
    );
    const menu = await fetchMenu('https://example.com', fetcher as typeof fetch);
    expect(menu).toHaveLength(1);
  });
  it('parsea texto JSON si el content-type no es application/json (echo de Apps Script)', async () => {
    const fetcher = vi.fn(async () =>
      ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => JSON.stringify({ menu: [{ id: 'pz-001', nombre: 'Margarita', descripcion: 'Desc', precio: 9 }] }),
        json: async () => { throw new Error('no json'); },
      }) as unknown as Response
    );
    const menu = await fetchMenu('https://example.com', fetcher as typeof fetch);
    expect(menu).toHaveLength(1);
    expect(menu[0].precio).toBe(9);
  });
});
