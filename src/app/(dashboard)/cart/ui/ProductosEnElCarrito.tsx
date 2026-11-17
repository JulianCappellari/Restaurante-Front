"use client";

import { useCartStore } from "@/store";
import DishPhoto from "@/components/menu/DishPhoto";
import { dishPhoto } from "@/lib/dish-photos";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

const parseCurrency = (value: number | string | undefined | null) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const clean = value.replace(/[^\d.,-]/g, "");
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");
  if (hasComma && hasDot) return Number.parseFloat(clean.replace(/\./g, "").replace(",", ".")) || 0;
  if (hasComma) return Number.parseFloat(clean.replace(",", ".")) || 0;
  return Number.parseFloat(clean) || 0;
};

export const ProductosEnElCarrito = () => {
  const [loaded, setLoaded] = useState(false);
  const cartProducts = useCartStore((state) => state.cart);
  const updateQuantity = useCartStore((state) => state.updateMenuQuantity);
  const removeProduct = useCartStore((state) => state.removeMenuFromCart);

  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="text-primario-600 motion-safe:animate-spin" size={32} />
      </div>
    );
  }

  if (cartProducts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-gray-500">Tu carrito esta vacio</p>
        <Link
          href="/menu"
          className="mt-3 inline-flex font-semibold text-primario-700 hover:text-primario-800"
        >
          Explorar menu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cartProducts.map((product) => {
        const selectedCustomizations = product.selectedCustomizations?.length
          ? product.dishCustomizations?.filter((customization) =>
              product.selectedCustomizations?.includes(customization.id)
            ) || []
          : [];
        const extras = selectedCustomizations.reduce(
          (sum, customization) => sum + parseCurrency(customization.additionalPrice),
          0
        );
        const unitPrice = parseCurrency(product.price) + extras;
        const subtotal = unitPrice * product.quantity;

        return (
          <article
            key={`${product.id}-${(product.selectedCustomizations || []).join("-")}`}
            className="grid grid-cols-[4.25rem_minmax(0,1fr)] items-start gap-3 border-b border-cliente-line pb-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-4"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
              <DishPhoto
                src={dishPhoto(product)}
                sizes="(min-width: 640px) 96px, 68px"
              />
            </div>

            <div className="min-w-0">
              <Link
                href={`/product/${product.id}`}
                className="text-lg font-bold text-gray-900 hover:text-primario-700"
              >
                {product.nameDish}
              </Link>

              {selectedCustomizations.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium text-gray-800">Personalizaciones</p>
                  <ul className="mt-1 space-y-1">
                    {selectedCustomizations.map((customization) => (
                      <li key={customization.id}>
                        {customization.name}
                        {parseCurrency(customization.additionalPrice) > 0 && (
                          <span className="ml-1 text-primario-700">
                            +{formatARS(parseCurrency(customization.additionalPrice))}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-3 font-semibold text-primario-700">
                {formatARS(unitPrice)} c/u
              </p>
            </div>

            <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
              <div className="flex items-center rounded-lg border border-gray-200">
                <button
                  onClick={() => updateQuantity(product, Math.max(1, product.quantity - 1))}
                  className="customer-press grid size-11 place-items-center text-cliente-ink hover:bg-cliente-mist disabled:opacity-40"
                  disabled={product.quantity <= 1}
                  type="button"
                  aria-label="Restar cantidad"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-10 px-2 text-center font-semibold text-gray-900">
                  {product.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(product, product.quantity + 1)}
                  className="customer-press grid size-11 place-items-center text-cliente-ink hover:bg-cliente-mist"
                  type="button"
                  aria-label="Sumar cantidad"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-gray-950">{formatARS(subtotal)}</p>
                <button
                  onClick={() => removeProduct(product)}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:text-red-700"
                  aria-label="Eliminar producto"
                  type="button"
                >
                  <Trash2 size={16} />
                  Quitar
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
