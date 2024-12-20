"use client";

import Image from "next/image";
import React, { useState } from "react";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { SelectorCantidad } from "@/components/menu/SelectorCantidad";
import { IMenu, IMenuCart } from "@/interfaces";
import { useCartStore } from "@/store";

interface Props {
  menu?: IMenu; // `menu` es opcional porque podría no estar disponible inicialmente.
  params: {
    id: string;
  };
}

const ProductDetails = ({ menu, params }: Props) => {
  const id = params.id; // Obteniendo el `id` directamente desde los parámetros de la URL.

  // Asegúrate de que `menu` está definido antes de desestructurarlo.
  if (!menu) {
    return <div>Cargando detalles del producto...</div>;
  } 

  const { nameDish, price, imageUrl, ingredients } = menu;

  const addMenuToCart = useCartStore((state) => state.addMenuToCart);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

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
      imageUrl,
      ingredients: selectedIngredients,
    };

    addMenuToCart(menuCart);
    console.log("Estado del carrito:", useCartStore.getState().cart);
    setQuantity(1);
    setSelectedIngredients([]);
  };

  return (
    <div className="min-h-[800px] flex items-center justify-center bg-gray-100">
      <div className="relative w-[800px] h-[400px] bg-white border-[2px] border-black rounded-xl overflow-hidden shadow-2xl flex">
        {/* Imagen del Producto */}
        <div className="relative w-1/3 h-full">
          <Image
            src={imageUrl}
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
              ${price.toFixed(2)}
            </p>
          </div>

          {/* Selector de Cantidad */}
          <div className="mt-2 flex items-center justify-center">
            <SelectorCantidad cantidad={quantity} cargarCantidad={setQuantity} />
          </div>

          {/* Selector de Ingredientes */}
          <div className="mt-2">
            <h4 className="text-sm font-semibold text-center">
              Selecciona Ingredientes:
            </h4>
            <div className="flex flex-col space-y-1 mt-1 justify-center items-center">
              {ingredients.map(({ description }) => (
                <label key={description} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIngredients.includes(description)}
                    onChange={() => handleIngredientChange(description)}
                    className="mr-2"
                  />
                  {description}
                </label>
              ))}
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
};

export default ProductDetails;
