"use client";
import { useCartStore } from "@/store";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export const InformacionOrden = () => {
  const [cargado, setCargado] = useState(false);
  const subTotal = useCartStore((state) => state.getCartSummary().subTotal);
  const taxes = useCartStore((state) => state.getCartSummary().taxes);
  const total = useCartStore((state) => state.getCartSummary().total);
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setCargado(true);
  }, []);

  if (!cargado) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-primario-500" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between py-2 border-b border-gray-200">
        <span className="text-gray-600">Productos</span>
        <span className="font-medium text-gray-800">
          {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
        </span>
      </div>

      <div className="flex justify-between py-2 border-b border-gray-200">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium text-gray-800">${subTotal.toFixed(2)}</span>
      </div>

      <div className="flex justify-between py-2 border-b border-gray-200">
        <span className="text-gray-600">Impuestos (21%)</span>
        <span className="font-medium text-gray-800">${taxes.toFixed(2)}</span>
      </div>

      <div className="flex justify-between pt-4">
        <span className="text-lg font-semibold text-gray-900">Total</span>
        <span className="text-lg font-bold text-primario-600">
          ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
};