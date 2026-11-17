"use client";

import { useShallow } from "zustand/react/shallow";

import { useCartStore } from "@/store";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export const InformacionOrden = () => {
  const [loaded, setLoaded] = useState(false);
  const summary = useCartStore(useShallow((state) => state.getCartSummary()));

  useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-primario-600" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryRow
        label="Productos"
        value={`${summary.totalItems} ${summary.totalItems === 1 ? "articulo" : "articulos"}`}
      />
      <SummaryRow label="Subtotal" value={formatARS(summary.subTotal)} />
      {summary.discount > 0 && (
        <SummaryRow
          label={`Descuento${summary.discountLabel ? ` (${summary.discountLabel})` : ""}`}
          value={`-${formatARS(summary.discount)}`}
        />
      )}
      <SummaryRow label="IVA (21%)" value={formatARS(summary.taxes)} />

      <div className="flex justify-between border-t pt-4">
        <span className="text-lg font-semibold text-gray-950">Total</span>
        <span className="text-lg font-bold text-primario-700">
          {formatARS(summary.total)}
        </span>
      </div>
    </div>
  );
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
