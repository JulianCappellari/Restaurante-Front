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

export interface IMenuIngredient {
  id: number;
  menuId: number;
  inventoryId: number;
  quantity: number | string;
  unit: string;
  costPerUnit?: number | string;
  inventory?: {
    id: number;
    name: string;
    amount: number | string;
    unit: string;
    minimumThreshold?: number | string;
  } | null;
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
  ingredients?: IMenuIngredient[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMenuCart extends IMenu {
  quantity: number;
  selectedCustomizations?: number[];
}
