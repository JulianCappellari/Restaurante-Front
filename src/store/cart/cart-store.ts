import { IMenuCart } from "@/interfaces";
import { findPromotion, normalizeCouponCode, validatePromotion } from "@/lib/promotions";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const parseCurrency = (value: number | string | undefined | null): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const clean = value.replace(/[^\d.,-]/g, "");
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");

  if (hasComma && hasDot) {
    return Number.parseFloat(clean.replace(/\./g, "").replace(",", ".")) || 0;
  }

  if (hasComma) return Number.parseFloat(clean.replace(",", ".")) || 0;
  return Number.parseFloat(clean) || 0;
};

const normalizedCustomizations = (product: IMenuCart) =>
  [...(product.selectedCustomizations || [])].sort((a, b) => a - b);

const hasSameCustomizations = (a: IMenuCart, b: IMenuCart) => {
  const first = normalizedCustomizations(a);
  const second = normalizedCustomizations(b);

  return first.length === second.length && first.every((id, index) => id === second[index]);
};

interface CartState {
  cart: IMenuCart[];
  couponCode: string | null;
  getTotalItems: () => number;
  getCartItems: () => IMenuCart[];
  getCartSummary: () => {
    subTotal: number;
    discount: number;
    taxes: number;
    total: number;
    totalItems: number;
    couponCode: string | null;
    discountLabel: string | null;
  };
  addMenuToCart: (product: IMenuCart) => void;
  updateMenuQuantity: (product: IMenuCart, quantity: number) => void;
  removeMenuFromCart: (product: IMenuCart) => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  clearCoupon: () => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      couponCode: null,

      getTotalItems: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.quantity, 0);
      },

      getCartItems: () => {
        const { cart } = get();
        return cart.map((item) => ({
          ...item,
          selectedCustomizations: item.selectedCustomizations || [],
        }));
      },

      getCartSummary: () => {
        const { cart, couponCode } = get();

        const subTotal = cart.reduce((sum, product) => {
          const basePrice = parseCurrency(product.price);
          const extras = (product.selectedCustomizations || []).reduce((customSum, customId) => {
            const customization = product.dishCustomizations?.find((c) => c.id === customId);
            return customSum + parseCurrency(customization?.additionalPrice);
          }, 0);

          return sum + (basePrice + extras) * product.quantity;
        }, 0);

        const promotion = findPromotion(couponCode);
        const validPromotion =
          promotion && (!promotion.minSubtotal || subTotal >= promotion.minSubtotal)
            ? promotion
            : null;
        const discount = validPromotion
          ? (subTotal * validPromotion.discountPercent) / 100
          : 0;
        const taxableAmount = Math.max(0, subTotal - discount);
        const taxes = taxableAmount * 0.21;
        const total = taxableAmount + taxes;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        return {
          subTotal,
          discount,
          taxes,
          total,
          totalItems,
          couponCode: validPromotion?.code || null,
          discountLabel: validPromotion?.label || null,
        };
      },

      addMenuToCart: (product: IMenuCart) => {
        const { cart } = get();
        const safeProduct = { ...product, quantity: Math.max(1, product.quantity) };
        const existingItemIndex = cart.findIndex(
          (item) => item.id === safeProduct.id && hasSameCustomizations(item, safeProduct)
        );

        if (existingItemIndex === -1) {
          set({ cart: [...cart, safeProduct] });
          return;
        }

        set({
          cart: cart.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + safeProduct.quantity }
              : item
          ),
        });
      },

      updateMenuQuantity: (product: IMenuCart, quantity: number) => {
        const { cart } = get();
        const nextQuantity = Math.max(1, quantity);

        set({
          cart: cart.map((item) =>
            item.id === product.id && hasSameCustomizations(item, product)
              ? { ...item, quantity: nextQuantity }
              : item
          ),
        });
      },

      removeMenuFromCart: (product: IMenuCart) => {
        const { cart } = get();

        set({
          cart: cart.filter(
            (item) => !(item.id === product.id && hasSameCustomizations(item, product))
          ),
        });
      },

      applyCoupon: (code: string) => {
        const { getCartSummary } = get();
        const currentSummary = getCartSummary();
        const result = validatePromotion(code, currentSummary.subTotal);

        if (!result.ok) {
          set({ couponCode: null });
          return { ok: false, message: result.message };
        }

        set({ couponCode: normalizeCouponCode(code) });
        return { ok: true, message: `${result.promotion.label} aplicado.` };
      },

      clearCoupon: () => {
        set({ couponCode: null });
      },

      clearCart: () => {
        set({ cart: [], couponCode: null });
      },
    }),
    {
      name: "shopping-cart",
    }
  )
);
