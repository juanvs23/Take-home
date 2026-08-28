import { test, expect, type Page } from '@playwright/test';

/**
 * Smoke test del rediseño de UX del carrito.
 * Mockea `window.fetch` para no depender del Web App real de Apps Script
 * (que requiere red + endpoint externo). Valida los 5 puntos de UX:
 *  1. Stepper centrado con botones verdes/redondeados
 *  2. Cantidad editable (escribir 10 directo)
 *  3. Botón eliminar por item (quita todo el item)
 *  4. Al agregar → el carrito se abre automáticamente
 *  5. Total recalculado correctamente
 */
const MENU = {
  config: { marca: 'Alta Pinta' },
  categorias: [{ id: 'pizzas', nombre: 'Pizza', orden: 1 }],
  menu: [
    { id: 'pz-001', nombre: 'Margarita', descripcion: 'Salsa de tomate, mozzarella', precio: 9, categoria: 'pizzas', tipos: [{ nombre: 'pequeña', precio: 9 }], imagen_url: '/img/pz-001.jpg', disponible: true },
  ],
};

async function mockMenu(page: Page) {
  await page.addInitScript((menu) => {
    window.__mockMenu = menu;
    const origFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      // GET del menú → devolver el envelope mockeado
      if (!init || !init.method || init.method === 'GET') {
        return new Response(JSON.stringify(menu), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // POST de la orden → respuesta ok
      if (init.method === 'POST') {
        return new Response(JSON.stringify({ ok: true, success: true, total: 9 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return origFetch(input, init);
    };
  }, MENU);
}

test.describe('Carrito rediseñado', () => {
  test.beforeEach(async ({ page }) => {
    await mockMenu(page);
    await page.goto('/');
    await expect(page.locator('.menu-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('al agregar se abre el drawer automáticamente', async ({ page }) => {
    await page.locator('.menu-card-add').first().click();
    // Drawer abierto (is-open) + aria-hidden=false sin interacción manual
    await expect(page.locator('[data-cart-drawer]')).toHaveClass(/is-open/);
    await expect(page.locator('[data-cart-drawer]')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });

  test('botones del stepper + y − verdes y redondeados', async ({ page }) => {
    await page.locator('.menu-card-add').first().click();
    const plus = page.locator('[data-qty="1"]');
    const minus = page.locator('[data-qty="-1"]');
    await expect(plus).toBeVisible();
    await expect(minus).toBeVisible();
    const bg = await plus.evaluate((el) => getComputedStyle(el).backgroundColor);
    const radius = await plus.evaluate((el) => getComputedStyle(el).borderRadius);
    // green-accent #00754A -> rgb(0,117,74)
    expect(bg).toMatch(/rgb\(0,\s*117,\s*74\)/);
    expect(radius).not.toBe('0px');
    await expect(page.locator('.cart-qty')).toBeVisible();
  });

  test('cantidad editable: escribir 10 actualiza total', async ({ page }) => {
    await page.locator('.menu-card-add').first().click();
    const input = page.locator('.qty-input');
    await expect(input).toHaveValue('1');
    await input.fill('10');
    await input.dispatchEvent('change');
    await expect(input).toHaveValue('10');
    await expect(page.locator('[data-cart-total]')).toHaveText('$90.00');
    await expect(page.locator('[data-cart-count]')).toHaveText('10');
  });

  test('botón eliminar quita todo el item de una', async ({ page }) => {
    await page.locator('.menu-card-add').first().click();
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await page.locator('[data-remove]').click();
    await expect(page.locator('.cart-item')).toHaveCount(0);
    await expect(page.locator('.cart-empty')).toBeVisible();
  });

  test('flujo completo: footer oculto con carrito vacío, visible con items', async ({ page }) => {
    await page.locator('.menu-card-add').first().click();
    await expect(page.locator('[data-cart-footer]')).toBeVisible();
    await page.locator('[data-remove]').click();
    await expect(page.locator('[data-cart-footer]')).toBeHidden();
  });
});
