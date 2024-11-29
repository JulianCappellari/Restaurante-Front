"use client";
import React, { useState } from "react";
import FoodCard from "@/components/menu/FoodCard";

// Definición de datos del menú
const menuItems = [
  {
    id: 1,
    name: "Ensalada César",
    price: "$5.00",
    category: "entrada",
    image: "/ensalada.jpg",
  },
  {
    id: 2,
    name: "Pizza Margherita",
    price: "$10.00",
    category: "principal",
    image: "/pizza.jpg",
  },
  {
    id: 3,
    name: "Tarta de Chocolate",
    price: "$4.00",
    category: "postre",
    image: "/tarta.jpg",
  },
  // Agrega más elementos según sea necesario
];

const MenuPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Función para manejar el cambio de categoría
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Filtrar elementos del menú según la categoría seleccionada
  const filteredMenuItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  return (
    <div className="w-full h-full">
      <h1 className="text-3xl font-bold text-center mt-6">Nuestro menú</h1>

      {/* Filtros de categoría */}
      <div className="flex justify-center space-x-4 mt-4">
        <button
          onClick={() => handleCategoryChange("all")}
          className="bg-primario-200 p-2 rounded"
        >
          Todos
        </button>
        <button
          onClick={() => handleCategoryChange("entrada")}
          className="bg-primario-200 p-2 rounded"
        >
          Entradas
        </button>
        <button
          onClick={() => handleCategoryChange("principal")}
          className="bg-primario-200 p-2 rounded"
        >
          Platos Principales
        </button>
        <button
          onClick={() => handleCategoryChange("postre")}
          className="bg-primario-200 p-2 rounded"
        >
          Postres
        </button>
      </div>

      <div className="flex flex-wrap m-8 gap-4 justify-center items-center ">
        {filteredMenuItems.map((item) => (
          <div key={item.id} className="flex justify-center items-center">
            <FoodCard
              id={item.id}
              name={item.name}
              price={item.price}
              image={item.image}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;
