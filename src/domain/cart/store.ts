// dominio/cart — store reactivo mínimo (vanilla, sin framework ni DOM)
import type { CartItem } from './CartItem';
import { addItem, removeItem, setQty, totalCents, fromCents } from './cart';

type Listener = (items: CartItem[], total: number) => void;

export interface CartStore {
  getItems: () => CartItem[];
  getTotal: () => number;
  add: (item: Omit<CartItem, 'cantidad'> & { cantidad?: number }) => void;
  remove: (index: number) => void;
  setQty: (index: number, qty: number) => void;
  clear: () => void;
  subscribe: (listener: Listener) => () => void;
}

/** Crea un store de carrito con persistencia opcional en localStorage. */
export function createCartStore(storage?: { get: () => string | null; set: (s: string) => void }): CartStore {
  let items: CartItem[] = [];
  const listeners = new Set<Listener>();

  const emit = () => listeners.forEach((l) => l(items, fromCents(totalCents(items))));

  const load = () => {
    if (!storage) return;
    const raw = storage.get();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) items = parsed;
    } catch {
      // datos corruptos → ignorar
    }
  };

  const save = () => {
    if (storage) storage.set(JSON.stringify(items));
  };

  load();

  return {
    getItems: () => items,
    getTotal: () => fromCents(totalCents(items)),
    add: (item) => {
      items = addItem(items, item);
      save();
      emit();
    },
    remove: (index) => {
      items = removeItem(items, index);
      save();
      emit();
    },
    setQty: (index, qty) => {
      items = setQty(items, index, qty);
      save();
      emit();
    },
    clear: () => {
      items = [];
      save();
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      listener(items, fromCents(totalCents(items)));
      return () => listeners.delete(listener);
    },
  };
}
