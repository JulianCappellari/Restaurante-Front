// components/menu/FoodCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { FC } from "react";
import { AiOutlineHeart, AiOutlineShoppingCart } from "react-icons/ai";
import { IMenu } from "@/interfaces";

type FoodCardProps = Omit<IMenu, "nameDish" | "typeDish" | "available"> & {
  id: number;
  name: string;
  price: number | string;
  onAddToCart?: () => void;
  category?: string;
  description?: string;
  imageUrl?: string | null;
};

/* utils */
const parsePrice = (v: number | string): number => {
  if (typeof v === "number") return v;
  const clean = v.replace(/[^\d.,-]/g, "");
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");
  if (hasComma && hasDot)
    return parseFloat(clean.replace(/\./g, "").replace(",", ".")) || 0;
  if (hasComma) return parseFloat(clean.replace(",", ".")) || 0;
  return parseFloat(clean) || 0;
};



const FoodCard: FC<FoodCardProps> = ({
  id,
  name,
  price,
  imageUrl = null,
  description = "",
  onAddToCart,
}) => {
  const priceNumber = parsePrice(price);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // evita navegar si se hace click sobre la tarjeta
    onAddToCart ? onAddToCart() : (window.location.href = `/product/${id}`);
  };

  return (
    // reemplazá el <article> y el contenido por esto
    <article className="group relative w-full max-w-xs h-full flex flex-col rounded-2xl border bg-card text-card-foreground shadow-soft transition-shadow hover:shadow-lg">
      <div className="absolute left-2 top-2 z-20 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
        10% OFF
      </div>

      <button
        type="button"
        aria-label="Agregar a favoritos"
        className="absolute right-2 top-2 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-foreground shadow hover:bg-white"
        onClick={(e) => {
          e.preventDefault(); /* favoritos */
        }}
      >
        <AiOutlineHeart className="h-5 w-5" />
      </button>

      {/* imagen con ratio fijo */}
      <Link href={`/product/${id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
          <Image
            src={imageUrl || "/Fondo-restaurante.jpg"}
            alt={name}
            fill
            sizes="(min-width:1024px) 300px, (min-width:640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      </Link>

      {/* cuerpo que estira */}
      <div className="flex flex-col flex-1 p-4">
        <Link href={`/product/${id}`} className="block">
          {/* 2 líneas de alto fijo ≈ 3.5rem con text-lg */}
          <h3 className="text-lg leading-[1.75rem] font-semibold line-clamp-2 min-h-[3.5rem]">
            {name}
          </h3>
        </Link>

        {description && (
          // 2 líneas de alto fijo ≈ 2.5rem con text-sm
          <p className="mt-1 text-sm leading-5 text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {description}
          </p>
        )}

        {/* footer pegado abajo */}
        <div className="mt-auto flex items-center justify-between border-t pt-3">
          <span className="text-lg font-bold text-amber-600">
            {"$" + priceNumber}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-95 focus-visible:focus-ring"
          >
            <AiOutlineShoppingCart className="h-5 w-5" />
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
};

export default FoodCard;
