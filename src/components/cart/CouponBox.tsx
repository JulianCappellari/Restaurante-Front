"use client";

import { useShallow } from "zustand/react/shallow";

import { promotions } from "@/lib/promotions";
import { useCartStore } from "@/store";
import { TicketPercent, X } from "lucide-react";
import { useState } from "react";

export default function CouponBox() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const clearCoupon = useCartStore((state) => state.clearCoupon);
  const summary = useCartStore(useShallow((state) => state.getCartSummary()));

  const handleApply = () => {
    const result = applyCoupon(code);
    setMessage(result.message);
  };

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <TicketPercent className="h-5 w-5 text-primario-700" />
        <h3 className="text-lg font-bold text-gray-900">Cupones y combos</h3>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
          placeholder="Ej: BIENVENIDO10"
        />
        <button
          type="button"
          onClick={handleApply}
          className="rounded-lg bg-primario-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primario-700"
        >
          Aplicar
        </button>
      </div>

      {summary.couponCode && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <span>
            {summary.discountLabel} ({summary.couponCode})
          </span>
          <button type="button" onClick={clearCoupon} aria-label="Quitar cupon">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {message && !summary.couponCode && (
        <p className="mt-2 text-sm text-amber-700">{message}</p>
      )}

      <div className="mt-4 space-y-2 text-xs text-gray-500">
        {promotions.map((promotion) => (
          <p key={promotion.code}>
            <b>{promotion.code}</b>: {promotion.description}
          </p>
        ))}
      </div>
    </section>
  );
}
