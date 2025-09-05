"use client";
import { useCartStore } from "@/store";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, Loader2 } from "lucide-react";

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
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-primario-500" size={32} />
      </div>
    );
  }

  if (productoEnElCarrito.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
        <Link
          href="/menu"
          className="inline-flex items-center text-primario-600 hover:text-primario-700 font-medium"
        >
          Explorar menú
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {productoEnElCarrito.map((producto) => {
        // Obtener las personalizaciones seleccionadas
        const customizacionesSeleccionadas = producto.selectedCustomizations?.length
          ? producto.dishCustomizations?.filter((c) =>
              producto.selectedCustomizations?.includes(c.id)
            ) || []
          : [];

        return (
          <div
            key={producto.id}
            className="grid grid-cols-12 items-start py-4 gap-4"
          >
            {/* Imagen */}
            <div className="col-span-2">
              <div className="relative aspect-square">
                <Image
                  src={producto.imageUrl}
                  alt={producto.nameDish}
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            </div>

            {/* Nombre, personalizaciones y precio */}
            <div className="col-span-5">
              <Link
                href={`/product/${producto.id}`}
                className="font-medium text-gray-800 hover:text-primario-600 hover:underline"
              >
                {producto.nameDish}
              </Link>

              {/* Mostrar personalizaciones */}
              {customizacionesSeleccionadas.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">Personalizaciones:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {customizacionesSeleccionadas.map((custom) => (
                      <li key={custom.id} className="flex items-start">
                        <span className="mr-1">•</span>
                        <span>
                          {custom.name}
                          {custom.additionalPrice > 0 && (
                            <span className="text-primario-500">
                              (+${custom.additionalPrice})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-primario-600 font-medium mt-2">
                ${Number(producto.price).toFixed(2)}
                {customizacionesSeleccionadas.some((c) => (c.additionalPrice || 0) > 0) && (
                  <span className="text-xs text-gray-500 ml-1">
                    +{" "}
                    {customizacionesSeleccionadas
                      .reduce((sum, c) => sum + (Number(c.additionalPrice) || 0), 0)
                      .toFixed(2)}
                  </span>
                )}
              </p>
            </div>

            {/* Selector de cantidad */}
            <div className="col-span-3">
              <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                <button
                  onClick={() =>
                    actualizarCantidadDeProductos(
                      producto,
                      Math.max(1, producto.quantity - 1)
                    )
                  }
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors"
                  disabled={producto.quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="px-3 text-gray-800">{producto.quantity}</span>
                <button
                  onClick={() =>
                    actualizarCantidadDeProductos(
                      producto,
                      producto.quantity + 1
                    )
                  }
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Subtotal y eliminar */}
            <div className="col-span-2 flex flex-col items-end">
              <p className="text-gray-800 font-medium">
                ${(
                  (Number(producto.price) +
                    (producto.selectedCustomizations?.length && producto.dishCustomizations
                      ? producto.dishCustomizations
                          .filter((c) => producto.selectedCustomizations?.includes(c.id))
                          .reduce((sum, c) => sum + (Number(c.additionalPrice) || 0), 0)
                      : 0)
                  ) * producto.quantity
                ).toFixed(2)}
              </p>
              <button
                onClick={() => eliminarProducto(producto)}
                className="text-gray-400 hover:text-red-500 mt-2 transition-colors"
                aria-label="Eliminar producto"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};