"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ProductosEnElCarrito } from "./ui/ProductosEnElCarrito";
import { InformacionOrden } from "./ui/infromacion-orden/InformacionOrden";
import { useCartStore } from "@/store/cart/cart-store";
import { useRouter } from "next/navigation";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken";
import { useUserAddress } from "../../../hooks/useUserAddress";
import { ArrowLeft, Loader2, MapPin, ShoppingBag } from "lucide-react";
import { useCheckoutStore } from "@/store";
import CouponBox from "@/components/cart/CouponBox";
import { CheckoutSteps } from "./ui/CheckoutSteps";

const CartPage = () => {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const storedAddress = useCheckoutStore((state) => state.selectedAddress);
  const setSelectedAddress = useCheckoutStore((state) => state.setSelectedAddress);

  useEffect(() => {
    setUserId(getUserIdFromToken());
    setReady(true);
  }, []);

  const { addresses, loading, error: addressError, retry } = useUserAddress(userId);

  const selectedAddress = addresses.find((address) => address.id === storedAddress?.id);

  if (!ready) {
    return <div className="customer-shell py-10 text-cliente-muted" role="status">Cargando tu carrito…</div>;
  }

  if (totalItems === 0) {
    return (
      <div className="customer-shell py-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <BackToMenu />
          <div className="mt-5 rounded-2xl border border-cliente-line bg-white px-5 py-10 text-center sm:py-16">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primario-50 text-primario-700">
              <ShoppingBag className="h-9 w-9" />
            </div>
            <h1 className="mt-6 text-3xl font-bold text-gray-950">
              Tu carrito está vacío
            </h1>
            <p className="mx-auto mt-3 max-w-md text-gray-600">
              Agregá platos de la carta para elegir la dirección de envío y el medio de pago.
            </p>
            <Link
              href="/menu"
              className="btn-primary customer-press mt-6 min-h-12"
            >
              Ver la carta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-shell py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <BackToMenu />

        <CheckoutSteps step="cart" />
        <header className="mt-3 flex flex-col justify-between gap-4 border-b border-cliente-line pb-5 md:flex-row md:items-end">
          <div>
            <h1 data-split className="mt-2 text-4xl leading-tight text-cliente-ink sm:text-5xl">Tu carrito</h1>
            <p className="mt-2 text-gray-600">
              Revisá tus platos y elegí la dirección de envío antes de pasar al pago.
            </p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
            {totalItems} {totalItems === 1 ? "unidad" : "unidades"}
          </span>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_390px]">
          <section data-reveal="up" className="rounded-2xl border border-cliente-line bg-white p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Productos seleccionados</h2>
            </div>
            <ProductosEnElCarrito />
          </section>

          <aside data-stagger className="min-w-0 space-y-5">
            <section className="rounded-2xl border border-cliente-line bg-white p-5 sm:p-6">
              <h2 className="text-xl font-bold text-gray-900">Resumen del pedido</h2>
              <div className="mt-4">
                <InformacionOrden />
              </div>
            </section>

            <section className="rounded-2xl border border-cliente-line bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primario-700" />
                <h3 className="text-lg font-bold text-gray-900">
                  Dirección de envío
                </h3>
              </div>

              {loading ? (
                <div role="status" className="flex items-center gap-2 py-4 text-sm text-cliente-muted">
                  <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" /> Buscando tus direcciones…
                </div>
              ) : addressError ? (
                <div className="rounded-xl bg-cliente-mist p-3 text-sm text-cliente-ink">
                  <p role="alert">No pudimos cargar tus direcciones.</p>
                  <button type="button" className="min-h-11 font-semibold underline underline-offset-4" onClick={retry}>Volver a cargar direcciones</button>
                </div>
              ) : addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition ${
                        selectedAddress?.id === address.id
                          ? "border-primario-500 bg-primario-50"
                          : "border-gray-200 hover:border-primario-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress?.id === address.id}
                        onChange={() => setSelectedAddress(address)}
                        className="mt-1 accent-cliente-blue"
                      />
                      <span>
                        <span className="block font-semibold break-words text-gray-900">
                          {address.street} {address.streetNumber}
                        </span>
                        <span className="mt-1 block text-sm text-gray-600">
                          {address.city}, {address.province}, CP {address.postalCode}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-stone-50 p-4 text-sm text-gray-600">
                  <p>{userId ? "Agregá una dirección desde tu cuenta antes de confirmar el envío." : "Iniciá sesión para elegir una dirección de envío."}</p>
                  <Link href={userId ? "/cuenta/direccion" : "/auth/login?redirect=/cart"} className="mt-2 inline-flex min-h-11 items-center font-semibold text-primario-700 underline underline-offset-2">
                    {userId ? "Ir a direcciones" : "Iniciar sesión"}
                  </Link>
                </div>
              )}
            </section>

            <CouponBox />

            {userId ? (
              <button
                type="button"
                onClick={() => router.push("/cart/payment-method")}
                disabled={loading || !selectedAddress}
                className="btn-primary customer-press min-h-12 w-full"
              >
                Continuar al pago
              </button>
            ) : (
              <Link href="/auth/login?redirect=/cart" className="btn-primary customer-press flex min-h-12 w-full items-center justify-center">
                Iniciá sesión para continuar
              </Link>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

function BackToMenu() {
  return (
    <Link
      href="/menu"
      className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-cliente-blue hover:underline"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a la carta
    </Link>
  );
}

export default CartPage;
