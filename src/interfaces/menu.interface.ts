

export interface IMenu {
    id: number;
    nameDish: string;
    price: number;
    available: boolean;
    imageUrl: string;
    ingredients: Ingredients[]
}
interface Ingredients  {
    description: string;
}

export interface IMenuCart {
    id: number;
    nameDish: string;
    price: number;
    quantity: number;
    imageUrl: string;
    ingredients?: string[];
}