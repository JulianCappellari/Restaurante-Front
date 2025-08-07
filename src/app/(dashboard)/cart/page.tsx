"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ProductosEnElCarrito } from "./ui/ProductosEnElCarrito";
import { InformacionOrden } from "./ui/infromacion-orden/InformacionOrden";
import useAuthStore from "@/store/auth/useAuthStore";
import { useCartStore } from "@/store/cart/cart-store";
import { useRouter } from "next/navigation";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken";
import { useUserAddress } from "../../../hooks/useUserAddress";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { useCheckoutStore } from "@/store";

const CartPage = () => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((store) => store.isAuthenticated);
  const [userId, setUserId] = useState<number | null>(null);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { selectedAddress, setSelectedAddress } = useCheckoutStore();

  const handleCheckout = () => {
    if (isAuthenticated) {
      router.push("/cart/payment-method");
    } else {
      router.push("/auth/login");
    }
  };

  useEffect(() => {
    const id = getUserIdFromToken();
    setUserId(id);
  }, []);

  const { addresses, loading } = useUserAddress(userId);

  // Si el carrito está vacío, mostrar estado vacío
  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <Link
              href="/menu"
              className="flex items-center text-primario-600 hover:text-primario-700 transition-colors"
            >
              <ArrowLeft className="mr-2" size={20} />
              Volver al menú
            </Link>
          </div>

          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Tu carrito está vacío
                </h1>
                <p className="text-gray-600 mb-8">
                  Agregá algunos productos deliciosos para comenzar tu pedido
                </p>
              </div>

              <Link
                href="/menu"
                className="inline-flex items-center px-6 py-3 bg-primario-500 hover:bg-primario-600 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Explorar menú
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <Link
            href="/menu"
            className="flex items-center text-primario-600 hover:text-primario-700 transition-colors"
          >
            <ArrowLeft className="mr-2" size={20} />
            Volver al menú
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          Tu Carrito
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Productos en el carrito */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Productos seleccionados
              </h2>
              <span className="text-sm text-gray-500">
                {ProductosEnElCarrito.length} items
              </span>
            </div>

            <ProductosEnElCarrito />
          </div>

          {/* Resumen de compra */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Resumen de tu pedido
              </h2>
              <InformacionOrden />
            </div>

            {/* Direcciones guardadas */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center mb-4">
                <MapPin className="text-primario-500 mr-2" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">
                  Tus direcciones guardadas
                </h3>
              </div>

              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-primario-500" />
                </div>
              ) : addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors
                        ${
                          selectedAddress?.id === address.id
                            ? "border-primario-500 bg-primario-50"
                            : "border-gray-200"
                        }
                      `}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress?.id === address.id}
                        onChange={() => setSelectedAddress(address)}
                        className="mr-2"
                      />
                      <span className="font-medium">
                        {address.street} {address.streetNumber}
                      </span>
                      <span className="block text-sm text-gray-600">
                        {address.city}, {address.province}, CP{" "}
                        {address.postalCode}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-2">
                  No tenés direcciones guardadas. Podés agregar una en el
                  checkout.
                </p>
              )}
            </div>

            {/* Botón de pago */}
            <button
              onClick={handleCheckout}
              disabled={!selectedAddress}
              className={`w-full py-3 px-6 rounded-lg font-medium text-lg transition-colors shadow-md
                  ${
                    !selectedAddress
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-primario-500 hover:bg-primario-600 text-white hover:shadow-lg"
                  }
                `}
            >
              Continuar al pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
