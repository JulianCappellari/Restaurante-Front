export interface IDishCustomization {
  id: number;
  name: string;
  additionalPrice: number;
  isActive: boolean;
  isDefaultIncluded: boolean;
  menuId: number;
  description?: string;
  isRemovable?: boolean;
  isRequired?: boolean;
}

export interface IMenu {
  id: number;
  nameDish: string;
  price: number | string;
  available: boolean;
  imageUrl: string | null;
  typeDish: 'Entrada' | 'Plato Principal' | 'Postre' | 'Bebida' | 'Ensalada' | 'Guarnicion';
  customizations?: IDishCustomization[];
  dishCustomizations?: IDishCustomization[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMenuCart extends IMenu {
  quantity: number;
  selectedCustomizations?: number[];
}