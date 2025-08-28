"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  AiOutlineShoppingCart,
  AiOutlineCheck,
  AiOutlinePlus,
  AiOutlineMinus,
} from "react-icons/ai";
import { IMenu, IMenuCart } from "@/interfaces";
import { useCartStore } from "@/store";

interface Props { menu: IMenu }

const parseCurrency = (v: number | string): number => {
  if (typeof v === "number") return v;
  const s = v.replace(/[^\d.,-]/g, "");
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
  if (hasComma) return parseFloat(s.replace(",", ".")) || 0;
  return parseFloat(s) || 0;
};

const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default function ProductDetails({ menu }: Props) {
  const addMenuToCart = useCartStore((s) => s.addMenuToCart);

  const { nameDish, price, imageUrl, dishCustomizations = [], description = "" } = menu;
  const imageSrc = imageUrl || "/Fondo-restaurante.jpg";

  const [quantity, setQuantity] = useState(1);
  const defaultIds = useMemo(
    () => dishCustomizations.filter((c) => c.isDefaultIncluded || c.isRequired).map((c) => c.id),
    [dishCustomizations]
  );
  const [selectedCustomizations, setSelectedCustomizations] = useState<number[]>(defaultIds);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => { setSelectedCustomizations(defaultIds) }, [defaultIds]);

  const toggleCustomization = (id: number, isRequired: boolean) => {
    if (isRequired) return;
    setSelectedCustomizations((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectedCustomizationsList = useMemo(
    () => dishCustomizations.filter((c) => selectedCustomizations.includes(c.id) || c.isRequired),
    [dishCustomizations, selectedCustomizations]
  );

  const totalPrice = useMemo(() => {
    const base = parseCurrency(price as any);
    const extras = selectedCustomizationsList.reduce((sum, c) => sum + parseCurrency(c.additionalPrice as any), 0);
    return (base + extras) * quantity;
  }, [price, selectedCustomizationsList, quantity]);

  const addToCart = () => {
    setIsAddingToCart(true);
    const menuCart: IMenuCart = {
      ...menu,
      quantity,
      selectedCustomizations: selectedCustomizations.length ? selectedCustomizations : undefined,
    };
    addMenuToCart(menuCart);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsAddingToCart(false);
      setQuantity(1);
      setSelectedCustomizations(defaultIds);
    }, 1600);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-6xl md:mt-10">
        <article className="overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-soft">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Imagen con altura garantizada */}
            <div className="relative min-h-[360px] lg:min-h-[560px]">
              <Image
                src={imageSrc}
                alt={nameDish}
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>

            {/* Detalle */}
            <div className="flex flex-col p-6 md:p-10 lg:p-12">
              {/* Título y precio SIEMPRE visibles */}
              <header>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{nameDish}</h1>
                <p className="mt-2 text-2xl font-bold text-amber-600">{formatARS(parseCurrency(price as any))}</p>
              </header>

              {description && (
                <p className="mt-6 leading-relaxed text-muted-foreground">{description}</p>
              )}

              {/* Personalizaciones */}
              {dishCustomizations.length > 0 && (
                <fieldset className="mt-8 mb-3">
                  <legend className="mb-4 text-lg font-semibold">Personaliza tu plato</legend>
                  <ul className="space-y-3">
                    {dishCustomizations.map((c) => {
                      const isSelected = selectedCustomizations.includes(c.id) || c.isRequired;
                      const disabled = !c.isRemovable && c.isDefaultIncluded;
                      const priceDelta = parseCurrency(c.additionalPrice as any);
                      return (
                        <li key={c.id}>
                          <label
                            className={[
                              "flex items-center justify-between rounded-lg border p-3 transition-colors",
                              disabled ? "bg-muted/60 text-muted-foreground cursor-not-allowed"
                                       : "bg-muted/30 hover:bg-muted cursor-pointer",
                            ].join(" ")}
                          >
                            <span className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 accent-amber-600"
                                checked={isSelected}
                                onChange={() => toggleCustomization(c.id, c.isRequired || false)}
                                disabled={disabled || c.isRequired}
                                aria-label={c.name}
                              />
                              <span>
                                <span className="font-medium">
                                  {c.name}
                                  {disabled && " (Incluido)"}{c.isRequired && " (Requerido)"}
                                </span>
                                {c.description && (
                                  <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                                )}
                              </span>
                            </span>

                            {priceDelta !== 0 && (
                              <span className={priceDelta > 0 ? "text-sm font-medium text-amber-600" : "text-sm font-medium text-green-600"}>
                                {priceDelta > 0 ? "+" : ""}{formatARS(Math.abs(priceDelta))}
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              )}

              {/* Cantidad + Total + CTA */}
              <div className="mt-auto border-t pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-muted-foreground">Cantidad:</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted/80 focus-visible:focus-ring"
                      disabled={quantity <= 1}
                      aria-label="Disminuir cantidad"
                    >
                      <AiOutlineMinus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted/80 focus-visible:focus-ring"
                      aria-label="Aumentar cantidad"
                    >
                      <AiOutlinePlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-between">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-amber-600">{formatARS(totalPrice)}</span>
                </div>

                <button
                  onClick={addToCart}
                  disabled={isAddingToCart}
                  className="btn-primary w-full justify-center text-base"
                  aria-busy={isAddingToCart}
                >
                  {isAddingToCart ? "Añadiendo…" : (<><AiOutlineShoppingCart className="mr-2" />Añadir al carrito</>)}
                </button>

                <div className="mt-4" aria-live="polite" aria-atomic="true">
                  {showSuccess && (
                    <div className="flex items-center rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">
                      <AiOutlineCheck className="mr-2 shrink-0" />
                      <span>¡Añadido al carrito correctamente!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* /Detalle */}
          </div>
        </article>
      </div>
    </div>
  );
}
