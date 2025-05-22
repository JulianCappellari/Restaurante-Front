"use client";

import { useCartStore } from "@/store";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";

export const ProductosEnElCarrito = () => {
  const [cargado, setCargado] = useState(false);

  const productoEnElCarrito = useCartStore((state) => state.cart);
  const actualizarCantidadDeProductos = useCartStore(
    (state) => state.updateMenuQuantity
  );
  const eliminarProducto = useCartStore((state) => state.removeMenuFromCart);

  useEffect(() => {
    setCargado(true);
  }, []);

  if (!cargado) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="space-y-4">
      {productoEnElCarrito.map((producto) => (
        <div
          key={producto.id}
          className="grid grid-cols-4 items-center bg-white rounded-lg shadow px-4 py-3 gap-4"
        >
          {/* Columna 1: Imagen */}
          <div className="flex justify-center">
            <Image
              src={producto.imageUrl}
              alt={producto.nameDish}
              width={80}
              height={80}
              className="rounded object-cover"
            />
          </div>

          {/* Columna 2: Nombre + Precio */}
          <div>
            <Link
              href={`/product/${producto.id}`}
              className="font-semibold text-lg hover:underline"
            >
              {producto.nameDish}
            </Link>
            <p className="text-gray-600 mt-1">${producto.price}</p>
          </div>

          {/* Columna 3: Selector de cantidad */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                actualizarCantidadDeProductos(
                  producto,
                  Math.max(1, producto.quantity - 1)
                )
              }
              className="p-1 border rounded hover:bg-gray-100"
            >
              <Minus size={16} />
            </button>
            <span className="px-2">{producto.quantity}</span>
            <button
              onClick={() =>
                actualizarCantidadDeProductos(
                  producto,
                  producto.quantity + 1
                )
              }
              className="p-1 border rounded hover:bg-gray-100"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Columna 4: Subtotal + Botón de eliminar */}
          <div className="flex flex-col items-end gap-2">
            <p className="text-sm text-gray-700">
              Subtotal: ${producto.price * producto.quantity}
            </p>
            <button
              onClick={() => eliminarProducto(producto)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
