import { test, expect, type Page } from '@playwright/test';

/**
 * E2E — flujo completo del sitio Alta Pinta.
 * Requiere: servidor (npm run dev / preview) + PUBLIC_SHEETS_URL en .env,
 * y el Web App de Apps Script desplegado con doGet/doPost funcionando.
 */
test.describe('Alta Pinta sitio', () => {
  test('carga la página con header y menú (imágenes visibles)', async ({ page }: { page: Page }) => {
    await page.goto('/');
    // Título de página centrado en h1
    await expect(page.getByRole('heading', { name: 'Nuestro menú', level: 1 })).toBeVisible();
    // Nombre de marca en el header (no es h1)
    await expect(page.locator('.brand-name')).toHaveText('Alta Pinta');
    // Esperar cards del menú (skeleton desaparece)
    await expect(page.locator('.menu-card').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Margarita', { exact: false }).first()).toBeVisible();
    // Imágenes de producto cargadas (las que tengan imagen_url)
    const imgOk = await page.locator('.menu-card-img:not([style*="display: none"])').first().getAttribute('src');
    expect(imgOk).toBeTruthy();
  });

  test('abre el drawer del carrito, agrega productos y muestra total', async ({ page }: { page: Page }) => {
    await page.goto('/');
    await expect(page.locator('.menu-card').first()).toBeVisible({ timeout: 10000 });
    // Agregar dos veces el primer producto → al agregar el drawer se abre automáticamente
    const addBtn = page.locator('.menu-card-add').first();
    await addBtn.click();
    await addBtn.click();
    // El drawer ya está abierto (se auto-abre al agregar)
    await expect(page.locator('[data-cart-drawer]')).toBeVisible();
    // Un item con cantidad 2
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.cart-item .qty-input')).toHaveValue('2');
    // Total visible y no $0.00
    await expect(page.locator('[data-cart-total]')).toBeVisible();
    const total = await page.locator('[data-cart-total]').textContent();
    expect(total).not.toBe('$0.00');
  });

  test('envía una orden desde el checkout del drawer', async ({ page }: { page: Page }) => {
    await page.goto('/');
    await expect(page.locator('.menu-card').first()).toBeVisible({ timeout: 10000 });
    // Agregar al carrito → el drawer se abre automáticamente
    await page.locator('.menu-card-add').first().click();
    // Email único por ejecución (evita el rate-limit de 5/hora de Apps Script)
    const uniqueEmail = `e2e${Date.now()}@test.com`;
    // Rellenar el form del checkout
    await page.locator('[data-field-name]').fill('Prueba E2E');
    await page.locator('[data-field-email]').fill(uniqueEmail);
    await page.locator('[data-btn-submit]').click();
    // Esperar texto de éxito (endpoint real responde). No exigimos visibilidad:
    // tras el envío el carrito se limpia y el footer del drawer (que contiene el
    // status) se oculta al no haber items, pero el mensaje sí se escribe.
    const status = page.locator('[data-order-status]');
    await expect(status).toHaveText(/enviado|éxito|success/i, { timeout: 25000 });
  });
});
