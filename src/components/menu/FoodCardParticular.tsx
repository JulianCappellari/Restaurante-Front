"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DishPhoto from "./DishPhoto";
import { dishPhoto } from "@/lib/dish-photos";
import {
  AiOutlineShoppingCart,
  AiOutlineCheck,
  AiOutlinePlus,
  AiOutlineMinus,
} from "react-icons/ai";
import { ArrowLeft, Heart } from "lucide-react";
import { IDishCustomization, IMenu, IMenuCart } from "@/interfaces";
import { useCartStore, useFavoritesStore } from "@/store";

interface Props {
  menu: IMenu;
}

const parseCurrency = (value: number | string | undefined | null): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const clean = value.replace(/[^\d.,-]/g, "");
  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");

  if (hasComma && hasDot) return Number.parseFloat(clean.replace(/\./g, "").replace(",", ".")) || 0;
  if (hasComma) return Number.parseFloat(clean.replace(",", ".")) || 0;
  return Number.parseFloat(clean) || 0;
};

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductDetails({ menu }: Props) {
  const addMenuToCart = useCartStore((state) => state.addMenuToCart);
  const isFavorite = useFavoritesStore((state) => state.isFavorite(menu.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const customizations: IDishCustomization[] = useMemo(
    () => menu.dishCustomizations || menu.customizations || [],
    [menu.customizations, menu.dishCustomizations]
  );

  const [quantity, setQuantity] = useState(1);
  const defaultIds = useMemo(
    () => customizations.filter((c) => c.isDefaultIncluded || c.isRequired).map((c) => c.id),
    [customizations]
  );
  const [selectedCustomizations, setSelectedCustomizations] = useState<number[]>(defaultIds);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setSelectedCustomizations(defaultIds);
  }, [defaultIds]);

  const toggleCustomization = (id: number, isRequired: boolean) => {
    if (isRequired) return;
    setSelectedCustomizations((prev) =>
      prev.includes(id) ? prev.filter((currentId) => currentId !== id) : [...prev, id]
    );
  };

  const selectedCustomizationsList = useMemo(
    () => customizations.filter((c) => selectedCustomizations.includes(c.id) || c.isRequired),
    [customizations, selectedCustomizations]
  );

  const unitPrice = useMemo(() => {
    const base = parseCurrency(menu.price);
    const extras = selectedCustomizationsList.reduce(
      (sum, c) => sum + parseCurrency(c.additionalPrice),
      0
    );
    return base + extras;
  }, [menu.price, selectedCustomizationsList]);

  const totalPrice = unitPrice * quantity;

  const addToCart = () => {
    if (!menu.available) return;
    const menuCart: IMenuCart = {
      ...menu,
      dishCustomizations: customizations,
      quantity,
      selectedCustomizations: selectedCustomizations.length ? selectedCustomizations : undefined,
    };
    addMenuToCart(menuCart);
    setShowSuccess(true);
    setQuantity(1);
    setSelectedCustomizations(defaultIds);
  };

  return (
    <div className="customer-shell py-6 sm:py-10">
        <Link
          href="/menu"
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cliente-blue hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la carta
        </Link>

        <article className="grid items-start gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <div data-reveal="scale" className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-cliente-line lg:sticky lg:top-28 lg:aspect-[4/5]">
              <div data-zoom className="absolute inset-0">
                <DishPhoto src={dishPhoto(menu)} sizes="(max-width:1023px) 95vw, 560px" priority />
              </div>
            </div>

            <div data-reveal="right" className="flex min-w-0 flex-col rounded-2xl border border-cliente-line bg-white p-5 sm:p-8">
              <header>
                <h1 data-split className="break-words text-4xl leading-none text-cliente-ink sm:text-5xl">
                  {menu.nameDish}
                </h1>
                <p className="mt-2 text-sm text-cliente-muted">{menu.typeDish === "Guarnicion" ? "Guarnición" : menu.typeDish}</p>
                <p className="mt-3 text-2xl font-bold text-primario-700">
                  {formatARS(parseCurrency(menu.price))}
                </p>
                <button
                  type="button"
                  onClick={() => toggleFavorite(menu)}
                  aria-pressed={isFavorite}
                  className="btn-outline customer-press mt-3 min-h-11"
                >
                  <Heart className={`h-4 w-4 text-primario-700 ${isFavorite ? "fill-primario-600" : ""}`} />
                  {isFavorite ? "En favoritos" : "Guardar favorito"}
                </button>
              </header>

              {menu.description && (
                <p className="mt-6 leading-7 text-gray-600">{menu.description}</p>
              )}

              {customizations.length > 0 && (
                <fieldset className="mt-8">
                  <legend className="mb-4 text-lg font-semibold text-gray-900">
                    Personalizá tu plato
                  </legend>
                  <ul className="space-y-3">
                    {customizations.map((customization) => {
                      const isSelected =
                        selectedCustomizations.includes(customization.id) ||
                        customization.isRequired;
                      const disabled =
                        (!customization.isRemovable && customization.isDefaultIncluded) ||
                        customization.isRequired;
                      const priceDelta = parseCurrency(customization.additionalPrice);

                      return (
                        <li key={customization.id}>
                          <label
                            className={[
                              "flex items-start justify-between gap-4 rounded-lg border p-4 transition",
                              disabled
                                ? "cursor-not-allowed bg-gray-50 text-gray-500"
                                : "cursor-pointer bg-white hover:border-primario-300 hover:bg-primario-50/40",
                              isSelected ? "border-primario-500" : "border-gray-200",
                            ].join(" ")}
                          >
                            <span className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 accent-primario-600"
                                checked={isSelected}
                                onChange={() =>
                                  toggleCustomization(customization.id, customization.isRequired || false)
                                }
                                disabled={disabled}
                                aria-label={customization.name}
                              />
                              <span>
                                <span className="font-medium text-gray-900">
                                  {customization.name}
                                  {customization.isRequired && " (requerido)"}
                                </span>
                                {customization.description && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    {customization.description}
                                  </p>
                                )}
                              </span>
                            </span>

                            {priceDelta !== 0 && (
                              <span className="whitespace-nowrap text-sm font-semibold text-primario-700">
                                {priceDelta > 0 ? "+" : ""}
                                {formatARS(priceDelta)}
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              )}

              <div className="mt-6 border-t border-cliente-line pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-gray-600">Cantidad</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      type="button"
                      className="customer-press grid size-11 place-items-center rounded-lg bg-cliente-mist disabled:opacity-40"
                      disabled={quantity <= 1}
                      aria-label="Disminuir cantidad"
                    >
                      <AiOutlineMinus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      type="button"
                      className="customer-press grid size-11 place-items-center rounded-lg bg-cliente-mist"
                      aria-label="Aumentar cantidad"
                    >
                      <AiOutlinePlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primario-700">
                    {formatARS(totalPrice)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!menu.available}
                  className="btn-primary customer-press min-h-12 w-full justify-center rounded-lg text-base"
                >
                  <AiOutlineShoppingCart aria-hidden="true" />
                  {menu.available ? "Agregar al carrito" : "Plato no disponible"}
                </button>

                <div className="mt-4" aria-live="polite" aria-atomic="true">
                  {showSuccess && (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-cliente-sage p-3 text-sm text-cliente-ink">
                      <AiOutlineCheck className="mr-2 shrink-0" />
                      <span>Producto agregado al carrito.</span>
                      <Link href="/cart" className="ml-auto inline-flex min-h-9 items-center font-semibold underline">Ver carrito</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </article>
    </div>
  );
}
