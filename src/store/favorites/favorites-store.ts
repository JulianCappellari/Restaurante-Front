import type { IMenu } from "@/interfaces";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavoriteState = {
  favorites: IMenu[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (menu: IMenu) => void;
  removeFavorite: (id: number) => void;
};

export const useFavoritesStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isFavorite: (id) => get().favorites.some((item) => item.id === id),
      toggleFavorite: (menu) => {
        const exists = get().isFavorite(menu.id);
        set({
          favorites: exists
            ? get().favorites.filter((item) => item.id !== menu.id)
            : [...get().favorites, menu],
        });
      },
      removeFavorite: (id) => {
        set({ favorites: get().favorites.filter((item) => item.id !== id) });
      },
    }),
    { name: "favorite-menu-items" }
  )
);
