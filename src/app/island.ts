// app/island — lógica de hidratación client-side (conecta dominio con DOM)
import { fetchMenu } from '../domain/menu/menu';
import { createCartStore } from '../domain/cart/store';
import { postOrder, buildOrderPayload } from '../domain/order/order';
import { getSheetsUrl } from '../infrastructure/env';
import type { MenuItem } from '../domain/menu/MenuItem';
import type { CartItem } from '../domain/cart/CartItem';

export async function initIsland(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-menu-root]');
  const drawer = document.querySelector<HTMLElement>('[data-cart-drawer]');
  const frapBtn = document.querySelector<HTMLButtonElement>('[data-cart-frap]');
  const drawerClose = document.querySelector<HTMLButtonElement>('[data-drawer-close]');
  const drawerBackdrop = document.querySelector<HTMLElement>('[data-drawer-backdrop]');
  if (!root || !drawer) return;

  // --- Modal de éxito post-compra ---
  const successModal = document.querySelector<HTMLElement>('[data-success-modal]');
  const successBackdrop = document.querySelector<HTMLElement>('[data-success-backdrop]');
  const successClose = document.querySelector<HTMLButtonElement>('[data-success-close]');
  const successTotal = document.querySelector<HTMLElement>('[data-success-total]');
  const openSuccess = (total: number) => {
    if (!successModal || !successBackdrop) return;
    if (successTotal) successTotal.textContent = '$' + total.toFixed(2);
    successModal.classList.add('is-open');
    successModal.removeAttribute('hidden');
    successModal.setAttribute('aria-hidden', 'false');
    successBackdrop.classList.add('is-open');
    successBackdrop.removeAttribute('hidden');
    successClose?.focus();
  };
  const closeSuccess = () => {
    if (!successModal || !successBackdrop) return;
    successModal.classList.remove('is-open');
    successModal.setAttribute('aria-hidden', 'true');
    successModal.setAttribute('hidden', '');
    successBackdrop.classList.remove('is-open');
    successBackdrop.setAttribute('hidden', '');
  };
  successClose?.addEventListener('click', closeSuccess);
  successBackdrop?.addEventListener('click', closeSuccess);

  const url = getSheetsUrl();
  const store = createCartStore({
    get: () => localStorage.getItem('alta-pinta-cart'),
    set: (s) => localStorage.setItem('alta-pinta-cart', s),
  });

  // --- Open/close del drawer ---
  const openDrawer = () => {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  };
  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  };
  frapBtn?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  drawerBackdrop?.addEventListener('click', closeDrawer);

  // --- Render del menú ---
  const renderMenu = (items: MenuItem[]) => {
    const grid = root.querySelector<HTMLElement>('[data-menu-grid]');
    if (!grid) return;
    grid.innerHTML = '';
    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'menu-card flex flex-col bg-white rounded-[10px] shadow-md overflow-hidden';
      card.dataset.menuId = item.id;
      card.innerHTML = `
        <div class="menu-card-media w-full aspect-square bg-ceramic overflow-hidden">
          <img class="menu-card-img w-full h-full object-cover" src="" alt="" loading="lazy" />
        </div>
        <div class="menu-card-body flex flex-col items-center text-center gap-1 p-4 flex-1">
          <h3 class="menu-card-name text-xl font-bold text-siren m-0"></h3>
          <p class="menu-card-desc text-sm text-black/60 leading-relaxed flex-1 m-0"></p>
          <div class="menu-card-footer flex flex-col items-center justify-center gap-3 mt-2">
            <span class="menu-card-price font-semibold text-black"></span>
            <button class="menu-card-add px-3 py-1 border border-accent bg-accent text-white font-bold hover:bg-white hover:text-accent hover:border-accent transition-colors" data-add-id="${item.id}">+ Agregar</button>
          </div>
        </div>`;
      // Imagen (si hay imagen_url)
      const img = card.querySelector<HTMLImageElement>('.menu-card-img')!;
      if (item.imagen_url) {
        img.src = item.imagen_url;
        img.alt = item.nombre;
      } else {
        img.style.display = 'none';
        card.querySelector('.menu-card-media')!.classList.add('is-placeholder');
      }
      card.querySelector('.menu-card-name')!.textContent = item.nombre;
      card.querySelector('.menu-card-desc')!.textContent = item.descripcion;
      card.querySelector('.menu-card-price')!.textContent = '$' + item.precio.toFixed(2);
      const addBtn = card.querySelector<HTMLButtonElement>('.menu-card-add')!;
      addBtn.addEventListener('click', () => {
        const tipo = item.tipos && item.tipos.length > 0 ? item.tipos[0].nombre : undefined;
        store.add({
          id: item.id,
          nombre: item.nombre,
          precio: item.tipos && item.tipos.length > 0 ? item.tipos[0].precio : item.precio,
          tipo,
          imagen_url: item.imagen_url,
        });
        // Open the cart automatically so the user can adjust the quantity right away.
        openDrawer();
      });
      grid.appendChild(card);
    });
  };

  // --- Render del carrito (dentro del drawer) ---
  const list = drawer.querySelector<HTMLElement>('[data-cart-list]');
  const footer = drawer.querySelector<HTMLElement>('[data-cart-footer]');
  const totalEl = drawer.querySelector<HTMLElement>('[data-cart-total]');
  // El contador vive en el FrapButton (hermano del drawer, no hijo).
  const countEl = document.querySelector<HTMLElement>('[data-cart-count]');

  const renderCart = (items: CartItem[], total: number) => {
    if (!list || !footer || !totalEl) return;
    list.innerHTML = '';
    if (countEl) countEl.textContent = String(items.reduce((a, i) => a + i.cantidad, 0));
    if (items.length === 0) {
      list.innerHTML = '<li class="cart-empty">Tu carrito está vacío. ¡Agrega una pizza!</li>';
      footer.setAttribute('hidden', '');
      return;
    }
    footer.removeAttribute('hidden');
    totalEl.textContent = '$' + total.toFixed(2);
    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `
        <div class="cart-item-media">${item.imagen_url ? `<img src="${item.imagen_url}" alt="" loading="lazy">` : ''}</div>
        <div class="cart-item-info">
          <div class="cart-item-name"></div>
          <div class="cart-item-price"></div>
        </div>
        <div class="cart-item-actions">
          <div class="cart-qty">
            <button data-qty="-1" aria-label="Quitar uno">−</button>
            <input type="number" class="qty-input" value="" min="1" step="1" inputmode="numeric" aria-label="Cantidad" />
            <button data-qty="1" aria-label="Agregar uno">+</button>
          </div>
          <button class="cart-remove" data-remove aria-label="Eliminar este producto" title="Eliminar">✕</button>
        </div>`;
      li.querySelector('.cart-item-name')!.textContent = item.nombre;
      li.querySelector('.cart-item-price')!.textContent = '$' + item.precio.toFixed(2);
      const qtyInput = li.querySelector<HTMLInputElement>('.qty-input')!;
      qtyInput.value = String(item.cantidad);
      li.querySelector('[data-qty="-1"]')!.addEventListener('click', () => store.setQty(index, item.cantidad - 1));
      li.querySelector('[data-qty="1"]')!.addEventListener('click', () => store.setQty(index, item.cantidad + 1));
      qtyInput.addEventListener('change', () => {
        const next = parseInt(qtyInput.value, 10);
        if (Number.isNaN(next) || next < 1) qtyInput.value = String(item.cantidad);
        else store.setQty(index, next);
      });
      li.querySelector('[data-remove]')!.addEventListener('click', () => store.remove(index));
      list.appendChild(li);
    });
  };

  store.subscribe(renderCart);

  // --- Formulario de orden (solo en el checkout del drawer) ---
  const form = drawer.querySelector<HTMLFormElement>('form[data-order-form]');
  const statusEl = drawer.querySelector<HTMLElement>('[data-order-status]');
  const submitBtn = drawer.querySelector<HTMLButtonElement>('[data-btn-submit]');
  const nameInput = drawer.querySelector<HTMLInputElement>('[data-field-name]');
  const emailInput = drawer.querySelector<HTMLInputElement>('[data-field-email]');
  const emailError = drawer.querySelector<HTMLElement>('[data-error-email]');

  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (!nameInput || !emailInput || !statusEl || !submitBtn) return;
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const items = store.getItems();
      const payload = buildOrderPayload(name, email, items);
      if (!payload.name) return setStatus(statusEl, 'El nombre es requerido', true);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (emailError) emailError.hidden = false;
        return;
      }
      if (emailError) emailError.hidden = true;
      if (items.length === 0) return setStatus(statusEl, 'El carrito está vacío', true);

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      const result = await postOrder(url, { ...payload, total: store.getTotal() });
      if (result.ok) {
        const paidTotal = result.total ?? store.getTotal();
        store.clear();
        form.reset();
        closeDrawer();
        // Modal de felicitaciones + status (por si JS de accesibilidad)
        openSuccess(paidTotal);
        setStatus(statusEl, '¡Pedido enviado con éxito!', false);
      } else {
        setStatus(statusEl, result.error ?? 'Error al enviar, intenta de nuevo', true);
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar orden';
    });
  }

  // --- Estado de carga/error con skeleton ---
  const skeletons = root.querySelectorAll<HTMLElement>('[data-menu-skeleton]');
  const menuError = root.querySelector<HTMLElement>('[data-menu-error]');
  const hideSkeletons = () => skeletons.forEach((s) => { s.hidden = true; });
  (async () => {
    try {
      const menu = await fetchMenu(url);
      hideSkeletons();
      if (menuError) menuError.hidden = true;
      renderMenu(menu);
    } catch (err) {
      hideSkeletons();
      if (menuError) {
        menuError.hidden = false;
        menuError.textContent = err instanceof Error ? err.message : 'Error al cargar el menú';
      }
    }
  })();
}

function setStatus(el: HTMLElement, msg: string, isError: boolean) {
  el.textContent = msg;
  el.removeAttribute('hidden');
  el.classList.toggle('is-error', isError);
  el.classList.toggle('is-ok', !isError);
}
