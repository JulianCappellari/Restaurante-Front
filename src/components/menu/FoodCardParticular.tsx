"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { SelectorCantidad } from "@/components/menu/SelectorCantidad";
import { IMenu, IMenuCart } from "@/interfaces";
import { useCartStore } from "@/store";

interface Props {
  menu: IMenu;
}

export default function ProductDetails({ menu }: Props) {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const addMenuToCart = useCartStore((state) => state.addMenuToCart);

  const { id, nameDish, price, imageUrl, ingredients } = menu;
  const imageSrc = imageUrl?.trim() || "/Fondo-restaurante.jpg";

  const handleIngredientChange = (ingredient: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((item) => item !== ingredient)
        : [...prev, ingredient]
    );
  };

  const addToCart = () => {
    const menuCart: IMenuCart = {
      id,
      nameDish,
      price,
      quantity,
      imageUrl: imageSrc,
      ingredients: selectedIngredients,
    };

    addMenuToCart(menuCart);
    setQuantity(1);
    setSelectedIngredients([]);
  };

  return (
    <div className="min-h-[800px] flex items-center justify-center bg-gray-100">
      <div className="relative w-[1400px] h-[700px] bg-white border-[2px] border-black rounded-xl overflow-hidden shadow-2xl flex">
        {/* Imagen del Producto */}
        <div className="relative w-1/3 h-full">
          <Image
            src={imageSrc}
            alt={nameDish}
            layout="fill"
            objectFit="cover"
            className="rounded-l-xl"
          />
        </div>

        {/* Información del Producto */}
        <div className="w-2/3 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 text-center">
              {nameDish}
            </h3>
            <p className="text-lg font-semibold text-gray-800 text-center mt-3">
              ${Number(price).toFixed(2)}
            </p>
          </div>

          {/* Selector de Cantidad */}
          <div className="mt-1 flex items-center justify-center">
            <SelectorCantidad
              cantidad={quantity}
              cargarCantidad={setQuantity}
            />
          </div>

          {/* Selector de Ingredientes */}
          <div className="mt-2">
            <h4 className="text-sm font-semibold text-center">
              Selecciona Ingredientes:
            </h4>
            <div className="flex flex-col space-y-1 mt-1 justify-center items-center">
              {Array.isArray(ingredients) && ingredients.length > 0 ? (
                ingredients.map(({ description }) => (
                  <label key={description} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedIngredients.includes(description)}
                      onChange={() => handleIngredientChange(description)}
                      className="mr-2"
                    />
                    {description}
                  </label>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500">
                  Este plato no tiene ingredientes personalizados.
                </p>
              )}
            </div>
          </div>

          {/* Botón para Agregar al Carrito */}
          <button
            className="flex items-center justify-center mt-4 bg-primario-500 hover:bg-primario-600 transition duration-200 rounded-full px-4 py-2 text-white font-medium shadow-lg"
            onClick={addToCart}
          >
            <AiOutlineShoppingCart size={16} />
            <span className="ml-2">Agregar al carrito</span>
          </button>
        </div>
      </div>
    </div>
  );
}
