"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReceptionBookingActions({ bookingId }: { bookingId: number }) {
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const send = async (path: string, body: Record<string, unknown> = {}) => {
    const api = process.env.NEXT_PUBLIC_API_URL2;
    const token = Cookies.get("token");
    if (!api || !token) return;
    const response = await fetch(`${api}/bookings/${bookingId}/${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    setMessage(response.ok ? "Reserva actualizada." : "No se pudo actualizar.");
    if (response.ok) router.refresh();
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => send("check-in")} className="staff-control text-green-800">
          Check-in
        </button>
        <button type="button" onClick={() => send("no-show")} className="staff-control text-red-800">
          No asistió
        </button>
        <button type="button" onClick={() => send("status", { status: "completed" })} className="staff-control">
          Completar
        </button>
      </div>
      {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
    </div>
  );
}
