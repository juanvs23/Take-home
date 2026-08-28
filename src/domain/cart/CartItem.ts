// dominio/cart — modelo del carrito

export interface CartItem {
  id: string;
  nombre: string;
  precio: number; // precio unitario (del tier seleccionado)
  cantidad: number; // entero >= 1
  tipo?: string; // pequeño/mediano/grande (opcional)
  imagen_url?: string;
}
