"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ProductosEnElCarrito } from "./ui/ProductosEnElCarrito";
import { InformacionOrden } from "./ui/infromacion-orden/InformacionOrden";

import useAuthStore from "@/store/auth/useAuthStore";
import { useRouter } from "next/navigation";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken";
import { useUserAddress } from "../../../hooks/useUserAddress";

const cartPage = () => {
  const router = useRouter();

  const isAuthenticated = useAuthStore((store) => store.isAuthenticated);
  const [userId, setUserId] = useState<number | null>(null);

  const habdleCheckout = () => {
    if (isAuthenticated) {
      router.push("/checkout/direccion");
    } else {
      router.push("/login");
    }
  };

  useEffect(() => {
    const id = getUserIdFromToken();
    setUserId(id);
  }, []);

  const { addresses, loading } = useUserAddress(userId);

  return (
    <div className="flex justify-center items-center mb-72 px-10 sm:px-0">
      <div className="flex flex-col w-[1000px] ">
        <h1 className="antialiased text-4xl font-semibold my-7">Carrito</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {/* Carrito */}
          <div className="flex flex-col mt-1">
            <span className="text-xl"> Agregar mas items</span>
            <Link href={"/menu"} className="mb-5 underline">
              Continua comprando
            </Link>
            <ProductosEnElCarrito />
          </div>

          {/* Checkout - resumen de la compra */}
          <div>
            <div className="bg-white rounded-xl shadow-xl p-7 h-fit">
              <h2 className="text-2xl mb-2">Resumen de orden</h2>

              <InformacionOrden />
            </div>
            <div className="my-4">
              <h3 className="font-semibold mb-2">Tus direcciones:</h3>
              {loading ? (
                <p>Cargando direcciones...</p>
              ) : addresses.length > 0 ? (
                addresses.map((address) => (
                  <div key={address.id} className="text-sm border p-3 rounded mb-2">
                    {address.street} {address.streetNumber}, {address.city}, {address.province}, CP {address.postalCode}
                  </div>
                ))
              ) : (
                <p>No tenés direcciones guardadas.</p>
              )}
            </div>
            <div className="mt-5 w-full mb-2">
              <button
                onClick={habdleCheckout}
                className="flex btn-primary justify-center w-full"
              >
                Pagar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default cartPage;
