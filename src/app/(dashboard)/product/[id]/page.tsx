"use client";

import Image from "next/image";
import React, { useState } from "react";
import { AiOutlineHeart, AiOutlineShoppingCart } from "react-icons/ai";

interface Props {
  params: {
    id: string;
  };
}

const ProductDetails = ({ params }: Props) => {
  const { id } = params;

  const [quantity, setQuantity] = useState(1);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  const handleIngredientChange = (ingredient: string) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(ingredient)) {
        return prev.filter((item) => item !== ingredient);
      } else {
        return [...prev, ingredient];
      }
    });
  };

  return (
    <div className="min-h-[800px] flex items-center justify-center bg-gray-100 ">
      <div className="relative w-[800px] h-[400px] bg-white border-[2px] border-black rounded-xl overflow-hidden shadow-2xl flex">
        {/* Image Placeholder */}
        <div className="relative w-1/3 h-full">
          <Image
            src={"/Fondo-restaurante.jpg"}
            alt={"Product Image"}
            layout="fill"
            objectFit="cover"
            className="rounded-l-xl"
          />
        </div>

        {/* Product Information */}
        <div className="w-2/3 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 text-center">
              Cheese Burger
            </h3>
            <p className="text-sm text-center text-gray-600 mt-1">
              Delicious cheese burger with fresh ingredients.
            </p>
            <p className="text-lg font-semibold text-gray-800 text-center mt-3">
              $7.99
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="mt-2 flex items-center justify-center">
            <label htmlFor="quantity" className="mr-2 text-sm">
              Cantidad:
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min="1"
              className="border border-gray-300 p-2 rounded w-16 text-center"
            />
          </div>

          {/* Ingredients Selector */}
          <div className="mt-2">
            <h4 className="text-sm font-semibold text-center">
              Selecciona Ingredientes:
            </h4>
            <div className="flex flex-col space-y-1 mt-1 justify-center items-center">
              {["Queso", "Tomate", "Lechuga"].map((ingredient) => (
                <label key={ingredient} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIngredients.includes(ingredient)}
                    onChange={() => handleIngredientChange(ingredient)}
                    className="mr-2"
                  />
                  {ingredient}
                </label>
              ))}
            </div>
          </div>

          <button className="flex items-center justify-center mt-4 bg-primario-500 hover:bg-primario-600 transition duration-200 rounded-full px-4 py-2 text-white font-medium shadow-lg">
            <AiOutlineShoppingCart size={16} />
            <span className="ml-2">Agregar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
