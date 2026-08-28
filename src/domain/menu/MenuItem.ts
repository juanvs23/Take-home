// dominio/menu — modelo del menú de productos

export interface PriceTier {
  nombre: 'pequeña' | 'mediana' | 'grande';
  precio: number; // en centavos o decimal según se decida
}

export interface MenuItem {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number; // precio base (pequeña)
  tipos?: PriceTier[]; // si tiene tamaños escalonados
  categoria: string;
  imagen_url?: string;
  disponible: boolean;
}

