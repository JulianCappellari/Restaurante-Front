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

      getCartItems: () => {
        const { cart } = get();
        // Ensure we include selectedCustomizations in the returned items
        return cart.map(item => ({
          ...item,
          selectedCustomizations: item.selectedCustomizations || []
        }));
      },

      getCartSummary: () => {
        const { cart } = get();

        const subTotal = cart.reduce((sum, product) => {
          // Base price of the product
          let itemTotal = product.quantity * product.price;
          
          // Add customizations if they exist
          if (product.selectedCustomizations?.length) {
            const customizationsTotal = product.selectedCustomizations.reduce((customSum, customId) => {
              const customization = product.dishCustomizations?.find(c => c.id === customId);
              if (customization) {
                const price = typeof customization.additionalPrice === 'number' 
                  ? customization.additionalPrice 
                  : parseFloat(customization.additionalPrice || '0');
                return customSum + (product.quantity * price);
              }
              return customSum;
            }, 0);
            
            itemTotal += customizationsTotal;
          }
          
          return sum + itemTotal;
        }, 0);
        
        const taxes = subTotal * 0.21; // Assuming a 21% tax rate
        const total = subTotal + taxes;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

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

        // Check if the exact same product with the same customizations already exists in the cart
        const existingItemIndex = cart.findIndex(item => {
          // Compare IDs
          if (item.id !== product.id) return false;
          
          // Compare customizations if they exist
          const itemCustomizations = item.selectedCustomizations?.sort() || [];
          const productCustomizations = product.selectedCustomizations?.sort() || [];
          
          // If lengths are different, customizations don't match
          if (itemCustomizations.length !== productCustomizations.length) return false;
          
          // Check if all customizations match
          return itemCustomizations.every(
            (id, index) => id === productCustomizations[index]
          );
        });

        if (existingItemIndex === -1) {
          // If the product with these exact customizations is not in the cart, add it as a new item
          set({ cart: [...cart, { ...product }] });
        } else {
          // If the product with the same customizations exists, update its quantity
          const updatedCart = cart.map((item, idx) => {
            if (idx === existingItemIndex) {
              return {
                ...item,
                quantity: item.quantity + product.quantity,
              };
            }
            return item;
          });
          set({ cart: updatedCart });
        }
      },

      updateMenuQuantity: (product: IMenuCart, quantity: number) => {
        const { cart } = get();

        const updatedCart = cart.map((item) => {
          // Compare IDs and customizations to find the exact item
          const itemCustomizations = item.selectedCustomizations?.sort() || [];
          const productCustomizations = product.selectedCustomizations?.sort() || [];
          
          const sameCustomizations = 
            itemCustomizations.length === productCustomizations.length &&
            itemCustomizations.every((id, index) => id === productCustomizations[index]);
          
          if (item.id === product.id && sameCustomizations) {
            return { ...item, quantity };
          }
          return item;
        });

        set({ cart: updatedCart });
      },

      removeMenuFromCart: (product: IMenuCart) => {
        const { cart } = get();
        
        const updatedCart = cart.filter((item) => {
          // If IDs don't match, keep the item
          if (item.id !== product.id) return true;
          
          // If customizations don't match, keep the item
          const itemCustomizations = item.selectedCustomizations?.sort() || [];
          const productCustomizations = product.selectedCustomizations?.sort() || [];
          
          return !(
            itemCustomizations.length === productCustomizations.length &&
            itemCustomizations.every((id, index) => id === productCustomizations[index])
          );
        });
        
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
