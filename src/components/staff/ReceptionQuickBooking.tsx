"use client";

import { createBooking } from "@/actions/reservation/create-booking";
import { useReservaSelection } from "@/store/reservation/selection.store";
import { CheckCircle, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("es-AR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

type BookingCreateResult = {
  id?: number;
  data?: { id?: number };
};

export default function ReceptionQuickBooking() {
  const router = useRouter();
  const { dateTime, people, tableIds, status, clear } = useReservaSelection();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const uniqueTableIds = useMemo(() => [...new Set(tableIds)], [tableIds]);
  const canCreate = status === "available" && dateTime && people && uniqueTableIds.length > 0 && customerName.trim();

  const submit = async () => {
    if (!canCreate) {
      setMessage("Busca disponibilidad y carga al menos el nombre del cliente.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await createBooking({
        dateTime,
        numberPeople: people,
        tableIds: uniqueTableIds,
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
        },
      });
      const normalized = result as BookingCreateResult;
      const id = normalized.data?.id || normalized.id;
      setMessage(`Reserva #${id || ""} confirmada para ${customerName}.`);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      clear();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="staff-panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-950">Tomar datos de reserva</h2>
          <p className="mt-1 text-sm text-gray-600">
            Para reservas cargadas por recepcion: cliente, telefono/email, fecha, hora, personas y mesas asignadas.
          </p>
        </div>
        <UserRound className="h-5 w-5 text-primario-700" />
      </div>

      <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-gray-700">
        <b>Seleccion actual:</b> {formatDateTime(dateTime)} - {people || "-"} persona(s) -{" "}
        {uniqueTableIds.length ? `${uniqueTableIds.length} mesa(s)` : "sin mesas asignadas"}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-700">Nombre y apellido</span>
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Ej: Sofia Perez"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-700">Telefono</span>
          <input
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Ej: 11 5555-5555"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-700">Email opcional</span>
          <input
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="cliente@email.com"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!canCreate || loading}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primario-600 px-4 py-2 text-sm font-bold text-white disabled:bg-gray-300"
      >
        <CheckCircle className="h-4 w-4" />
        {loading ? "Creando reserva..." : "Confirmar reserva de recepcion"}
      </button>

      {message && (
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-gray-700">
          {message}
        </div>
      )}
    </section>
  );
}
