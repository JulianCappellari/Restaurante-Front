import { IMenuCart } from "@/interfaces";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartState {
  cart: IMenuCart[];

  // Getters
  getTotalItems: () => number;

  getCartSummary: () => {
    subTotal: number;
    taxes: number;
    total: number;
    totalItems: number;
  };

  // Methods to modify the cart
  addMenuToCart: (product: IMenuCart) => void;
  updateMenuQuantity: (product: IMenuCart, quantity: number) => void;
  removeMenuFromCart: (product: IMenuCart) => void;

  clearCart: () => void;
}

// Store with Zustand
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // The `get` function allows access to the current Zustand state

      cart: [],

      // Getters

      getTotalItems: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.quantity, 0);
      },

      getCartSummary: () => {
        const { cart } = get();

        const subTotal = cart.reduce(
          (sum, product) => product.quantity * product.price + sum,
          0
        );
        const taxes = subTotal * 0.21; // Assuming a 21% tax rate
        const total = subTotal + taxes;
        const totalItems = cart.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        return {
          subTotal,
          taxes,
          total,
          totalItems,
        };
      },

      // Methods to modify the cart

      addMenuToCart: (product: IMenuCart) => {
        const { cart } = get();

        // Check if the product already exists in the cart with the same size
        const isProductInCart = cart.some(
          (item) => item.id === product.id 
        );

        if (!isProductInCart) {
          // If the product is not in the cart, add it
          set({ cart: [...cart, product] });
          return;
        }

        // If the product exists, update its quantity
        const updatedCart = cart.map((item) => {
          if (item.id === product.id ) {
            return {
              ...item,
              quantity: item.quantity + product.quantity,
            };
          }
          return item;
        });

        set({ cart: updatedCart });
      },

      updateMenuQuantity: (product: IMenuCart, quantity: number) => {
        const { cart } = get();

        const updatedCart = cart.map((item) => {
          if (item.id === product.id ) {
            return { ...item, quantity };
          }
          return item;
        });

        set({ cart: updatedCart });
      },

      removeMenuFromCart: (product: IMenuCart) => {
        const { cart } = get();

        const updatedCart = cart.filter(
          (item) => item.id !== product.id 
        );

        set({ cart: updatedCart });
      },

      clearCart: () => {
        set({ cart: [] });
      },
    }),
    {
      name: "shopping-cart", // Local storage key for persistence
    }
  )
);
