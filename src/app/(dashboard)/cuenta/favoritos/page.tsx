"use client";

import { useFavoritesStore } from "@/store";
import DishPhoto from "@/components/menu/DishPhoto";
import { dishPhoto } from "@/lib/dish-photos";
import Link from "next/link";
import { formatARS } from "@/lib/format";
import { Heart, ShoppingBag } from "lucide-react";

export default function FavoritesPage() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const removeFavorite = useFavoritesStore((state) => state.removeFavorite);

  return (
    <div className="customer-shell py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header>
          <h1 data-split className="mt-2 text-4xl leading-tight text-cliente-ink sm:text-5xl">Mis favoritos</h1>
          <p className="mt-2 text-gray-600">
            Tus platos guardados para pedirlos más rápido.
          </p>
        </header>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {favorites.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <div className="relative aspect-[4/3]">
                <DishPhoto src={dishPhoto(item)} sizes="(min-width: 1280px) 380px, (min-width: 768px) 48vw, 95vw" />
              </div>
              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-950">{item.nameDish}</h2>
                <p className="mt-1 text-sm text-gray-500">{item.typeDish}</p>
                <p className="mt-3 text-lg font-bold text-primario-700">{formatARS(item.price)}</p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/product/${item.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primario-600 px-4 py-2 font-semibold text-white hover:bg-primario-700"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Pedir
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFavorite(item.id)}
                    className="rounded-lg border px-3 text-primario-700 hover:bg-primario-50"
                    aria-label="Quitar favorito"
                  >
                    <Heart className="h-4 w-4 fill-primario-600" />
                  </button>
                </div>
              </div>
            </article>
          ))}

          {favorites.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed bg-white p-10 text-center">
              <Heart className="mx-auto h-12 w-12 text-gray-400" />
              <h2 className="mt-4 text-2xl font-bold text-gray-950">Todavía no tenés favoritos</h2>
              <p className="mt-2 text-gray-600">Guardá platos de la carta para encontrarlos más rápido.</p>
              <Link href="/menu" className="mt-6 inline-flex rounded-lg bg-primario-600 px-5 py-3 font-semibold text-white">
                Ver la carta
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
