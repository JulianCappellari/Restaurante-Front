"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AiOutlineShoppingCart, AiOutlineCheck } from "react-icons/ai";
import { SelectorCantidad } from "@/components/menu/SelectorCantidad";
import { IMenu, IMenuCart } from "@/interfaces";
import { useCartStore } from "@/store";

interface Props {
  menu: IMenu;
}

export default function ProductDetails({ menu }: Props) {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
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

  const addToCart = async () => {
    setIsAddingToCart(true);
    
    const menuCart: IMenuCart = {
      id,
      nameDish,
      price,
      quantity,
      imageUrl: imageSrc,
      ingredients: selectedIngredients,
    };

    addMenuToCart(menuCart);
    
    // Simular un pequeño delay para mostrar feedback visual
    setTimeout(() => {
      setQuantity(1);
      setSelectedIngredients([]);
      setIsAddingToCart(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto md:mt-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
            {/* Imagen del Producto */}
            <div className="relative h-[400px] lg:h-full bg-gradient-to-br from-gray-900 to-gray-800">
              <Image
                src={imageSrc}
                alt={nameDish}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {nameDish}
                </h1>
                <p className="text-2xl lg:text-3xl font-bold text-primario-400">
                  ${Number(price).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Información del Producto */}
            <div className="p-8 lg:p-12 flex flex-col justify-between">
              <div className="space-y-8">
                {/* Selector de Cantidad */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Cantidad
                  </h3>
                  <div className="flex justify-center">
                    <SelectorCantidad
                      cantidad={quantity}
                      cargarCantidad={setQuantity}
                    />
                  </div>
                </div>

                {/* Selector de Ingredientes */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Personaliza tu plato
                  </h3>
                  <div className="space-y-3">
                    {Array.isArray(ingredients) && ingredients.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ingredients.map(({ description }) => (
                          <label 
                            key={description} 
                            className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-primario-300 transition-all duration-200 cursor-pointer group"
                          >
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={selectedIngredients.includes(description)}
                                onChange={() => handleIngredientChange(description)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                selectedIngredients.includes(description)
                                  ? 'bg-primario-500 border-primario-500'
                                  : 'border-gray-300 group-hover:border-primario-400'
                              }`}>
                                {selectedIngredients.includes(description) && (
                                  <AiOutlineCheck className="text-white text-xs" />
                                )}
                              </div>
                            </div>
                            <span className="ml-3 text-gray-700 font-medium">
                              {description}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">
                          Este plato no tiene ingredientes personalizables
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón para Agregar al Carrito */}
              <div className="pt-6">
                <button
                  className={`w-full flex items-center justify-center py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg ${
                    isAddingToCart
                      ? 'bg-green-500 text-white'
                      : 'bg-primario-500 hover:bg-primario-600 text-white hover:shadow-xl hover:scale-105'
                  }`}
                  onClick={addToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? (
                    <>
                      <AiOutlineCheck className="mr-2" size={20} />
                      ¡Agregado al carrito!
                    </>
                  ) : (
                    <>
                      <AiOutlineShoppingCart className="mr-2" size={20} />
                      Agregar al carrito - ${(Number(price) * quantity).toFixed(2)}
                    </>
                  )}
                </button>
                
                {selectedIngredients.length > 0 && (
                  <p className="text-sm text-gray-500 text-center mt-3">
                    {selectedIngredients.length} ingrediente{selectedIngredients.length !== 1 ? 's' : ''} seleccionado{selectedIngredients.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
