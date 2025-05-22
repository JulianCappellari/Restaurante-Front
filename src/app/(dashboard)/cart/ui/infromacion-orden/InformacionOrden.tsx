"use client";

import { useCartStore } from "@/store";
// import { formatoMoneda } from "@/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const InformacionOrden = () => {
  const router = useRouter();

  const [cargado, setCargado] = useState(false);
  const subTotal = useCartStore((state) => state.getCartSummary().subTotal);
  const taxes = useCartStore((state) => state.getCartSummary().taxes);
  const total = useCartStore((state) => state.getCartSummary().total);
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setCargado(true);
  }, []);

  useEffect(() => {
    if (totalItems === 0 && cargado === true) {
      router.replace("/empty");
    }
  }, [totalItems, cargado, router]);

  if (!cargado) return <p>Cargando...</p>;

  return (
    <div className="grid grid-cols-2">
      <span>Nro Productos</span>
      <span className="text-right">
        {totalItems === 1 ? "1 articulo" : `${totalItems} articulos`}
      </span>

      <span>Subtotal</span>
      <span className="text-right">${subTotal}</span>

      <span>Impuestos (21%)</span>
      <span className="text-right">${taxes}</span>

      <span className="mt-5 text-2xl">Total</span>
      <span className="text-right mt-5 text-2xl">${total}</span>
    </div>
  );
};
