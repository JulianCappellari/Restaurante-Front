import { IAddress } from "@/interfaces";
import { create } from "zustand";
import { persist } from "zustand/middleware";


interface CheckoutState {
    selectedAddress: IAddress | null;
    setSelectedAddress: (address: IAddress | null) => void;

    clearSelectedAddress: () => void;

}


export const useCheckoutStore = create<CheckoutState>(
    persist(
        (set) => ({
            selectedAddress: null,
            setSelectedAddress: (address: IAddress | null) => set({ selectedAddress: address }),
            clearSelectedAddress: () => set({ selectedAddress: null }),
        }),
        {
            name: "checkout-store"
        }
    )
);