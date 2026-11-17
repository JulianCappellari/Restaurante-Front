"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

type MenuItemProps = {
  title: string;
  description: string;
  price: number;
  image: string;
  featured?: boolean;
  category?: string;
  className?: string;
};

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export default function MenuDestacado({
  title,
  description,
  price,
  image = "/Fondo-restaurante.jpg",
  featured = false,
  category,
  className,
}: MenuItemProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(category ? `/menu#${category.toLowerCase()}` : "/menu");
  };

  return (
    <button
      className={cn(
        "group w-full max-w-sm overflow-hidden rounded-lg border bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg",
        className
      )}
      onClick={handleClick}
      type="button"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {featured && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow">
            Destacado
          </span>
        )}
      </div>

      <div className="p-5">
        {category && (
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primario-700">
            {category}
          </span>
        )}
        <h3 className="mt-2 line-clamp-2 min-h-[3.5rem] text-xl font-bold text-gray-950">
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-gray-600">
          {description}
        </p>
        <div className="mt-5 flex items-center justify-between border-t pt-4">
          <span className="text-lg font-bold text-primario-700">
            {formatARS(price)}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700 group-hover:text-primario-700">
            Ver mas
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
}
