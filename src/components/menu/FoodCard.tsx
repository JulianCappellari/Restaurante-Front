"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpRight, Heart } from "lucide-react";
import type { IMenu } from "@/interfaces/menu.interface";
import { useFavoritesStore } from "@/store";
import { formatARS, parseCurrency } from "@/lib/format";
import { dishPhoto } from "@/lib/dish-photos";
import DishPhoto from "./DishPhoto";

const typeLabel: Record<IMenu["typeDish"], string> = {
  Entrada: "Entrada",
  "Plato Principal": "Principal",
  Postre: "Postre",
  Bebida: "Bebida",
  Ensalada: "Ensalada",
  Guarnicion: "Guarnición",
};

export default function FoodCard({ dish, index = 0, soldOut = false }: { dish: IMenu; index?: number; soldOut?: boolean }) {
  const favorite = useFavoritesStore((state) => state.isFavorite(dish.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const photo = dishPhoto(dish);

  return (
    <article
      data-flip-id={dish.id}
      className={`menu-card menu-card-in group relative flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white ${soldOut ? "opacity-70" : ""}`}
      style={{ "--i": Math.min(index, 8) } as CSSProperties}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cliente-sage">
        <div className="menu-card-media absolute inset-0">
          <DishPhoto src={photo} sizes="(min-width: 1024px) 380px, (min-width: 640px) 48vw, 95vw" />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-cliente-blue shadow-sm">
          {typeLabel[dish.typeDish] ?? dish.typeDish}
        </span>
        {soldOut && (
          <span className="absolute bottom-3 left-3 rounded-full bg-stone-900/85 px-3 py-1 text-xs font-semibold text-white">Agotado por hoy</span>
        )}
        <button
          type="button"
          onClick={() => toggleFavorite(dish)}
          aria-label={`Guardar ${dish.nameDish} en favoritos`}
          aria-pressed={favorite}
          className="customer-press absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-white/95 text-cliente-blue shadow-sm hover:bg-white"
        >
          <Heart aria-hidden="true" className={`size-5 transition-transform duration-200 ${favorite ? "fill-current scale-110" : ""}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-[1.6rem] leading-[1.08] text-cliente-ink">
          <Link
            href={`/product/${dish.id}`}
            aria-label={`Ver plato ${dish.nameDish}`}
            className="menu-card-link rounded-sm after:absolute after:inset-0 after:content-['']"
          >
            {dish.nameDish}
          </Link>
        </h3>
        {dish.description && <p className="line-clamp-2 text-sm leading-6 text-cliente-muted">{dish.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-cliente-line pt-4">
          <strong className="font-display text-2xl font-bold tabular-nums text-cliente-ink">{formatARS(parseCurrency(dish.price))}</strong>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-cliente-blue">
            Ver plato
            <span className="menu-card-arrow grid size-9 place-items-center rounded-full bg-cliente-blue text-white">
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}
