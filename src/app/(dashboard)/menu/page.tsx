"use client";
import React, { useState, useEffect } from "react";
import FoodCard from "@/components/menu/FoodCard";
import { Fade } from "react-awesome-reveal";
import { getAllmenu } from "@/actions/menu/get-all-menu";
import { IMenu } from "@/interfaces";

// Mapeo de tipos de plato a categorías
const typeToCategory = {
  Entrada: "entrada",
  "Plato Principal": "principal",
  Postre: "postre",
  Bebida: "bebida",
  Ensalada: "entrada",
  Guarnicion: "acompanamiento",
} as const;

type DishType = keyof typeof typeToCategory;

const categories = [
  { id: "all", name: "Todo" },
  { id: "entrada", name: "Entradas" },
  { id: "principal", name: "Platos Principales" },
  { id: "postre", name: "Postres" },
  { id: "bebida", name: "Bebidas" },
  { id: "acompanamiento", name: "Acompañamientos" },
];

const MenuPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [menuItems, setMenuItems] = useState<IMenu[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar los datos del menú
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        console.log("Fetching menu data...");
        const data = await getAllmenu();
        console.log("Menu data received:", data);

        if (!Array.isArray(data)) {
          throw new Error("La respuesta del servidor no es un arreglo válido");
        }

        // Filtrar solo los ítems disponibles
        const availableItems = data.filter((item) => item.available);
        console.log("Available items:", availableItems);

        setMenuItems(availableItems);
      } catch (err) {
        console.error("Error al cargar el menú:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar el menú";
        setError(`No se pudo cargar el menú: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Función para manejar el cambio de categoría
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Desplazamiento suave al inicio de la sección de productos
    setTimeout(() => {
      const element = document.getElementById("menu-items");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Filtrar elementos del menú según la categoría seleccionada
  const filteredMenuItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => {
          const dishType = item.typeDish as DishType;
          return typeToCategory[dishType] === selectedCategory;
        });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 max-w-md mx-auto bg-red-50 rounded-lg">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nuestro Menú
          </h1>
          <div className="w-24 h-1 bg-amber-500 mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre nuestra exquisita selección de platos preparados con los
            mejores ingredientes
          </p>
        </div>

        {/* Filtros de categoría */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 px-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category.id
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-200"
                  : "bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-700 border border-gray-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        {/* Grid de productos */}
        <div
          id="menu-items"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch px-4"
        >
          <Fade cascade damping={0.1} triggerOnce>
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <div key={item.id} className="h-full">
                  <FoodCard
                    id={item.id}
                    name={item.nameDish}
                    price={item.price}
                    imageUrl={item.imageUrl}
                    description={item.description}
                    category={
                      typeToCategory[
                        item.typeDish as keyof typeof typeToCategory
                      ]
                    }
                    customizations={item.customizations?.map((c) => ({
                      id: c.id,
                      menuId: item.id,
                      name: c.name,
                      description: c.description || "",
                      isRemovable: c.isRemovable ?? true,
                      additionalPrice: c.additionalPrice,
                      isDefaultIncluded: c.isDefaultIncluded ?? false,
                      isRequired: c.isRequired ?? false,
                      isActive: c.isActive ?? true,
                    }))}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  No hay elementos disponibles en esta categoría.
                </p>
              </div>
            )}
          </Fade>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
