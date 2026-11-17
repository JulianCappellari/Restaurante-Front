"use client";

import type { Booking, Table } from "@/interfaces/reservation.interface";
import { useReservaSelection } from "@/store/reservation/selection.store";
import { tableStatusLabel } from "@/lib/labels";
import { Armchair, CalendarCheck } from "lucide-react";

type Props = {
  tables: Table[];
  bookings?: Booking[];
  selectable?: boolean;
  date?: string;
};

const statusClass: Record<Table["status"], string> = {
  available: "border-green-200 bg-green-50 text-green-800",
  reserved: "border-amber-200 bg-amber-50 text-amber-800",
  occupied: "border-red-200 bg-red-50 text-red-800",
  maintenance: "border-gray-200 bg-gray-100 text-gray-500",
};

const todayInArgentina = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export default function TableMap({ tables, bookings = [], selectable = false, date }: Props) {
  const { tableIds, toggleTable } = useReservaSelection();
  const visibleDate = date || todayInArgentina();
  const sameDateBookings = bookings.filter((booking) => (booking.date || booking.bookingDate?.slice(0, 10)) === visibleDate);
  const checkedInTables = new Set(
    sameDateBookings
      .filter((booking) => booking.status === "checked_in")
      .flatMap((booking) => booking.assignedTables?.map((table) => table.id) || [])
  );
  const reservedToday = new Set(
    sameDateBookings
      .filter((booking) => ["pending", "confirmed"].includes(booking.status))
      .flatMap((booking) => booking.assignedTables?.map((table) => table.id) || [])
  );

  return (
    <section className="staff-panel p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-950">Mapa visual de mesas</h2>
          <p className="mt-1 text-sm text-gray-600">
            Verde libre, amarillo reservado para {visibleDate}, rojo ocupado y gris mantenimiento.
          </p>
        </div>
        <CalendarCheck className="h-6 w-6 text-primario-700" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tables.map((table) => {
          const selected = tableIds.includes(table.id);
          const baseStatus =
            table.status === "reserved" && !reservedToday.has(table.id) ? "available" : table.status;
          const derivedStatus = checkedInTables.has(table.id)
            ? "occupied"
            : reservedToday.has(table.id) && baseStatus === "available"
            ? "reserved"
            : baseStatus;
          return (
            <button
              key={table.id}
              type="button"
              disabled={!selectable || derivedStatus === "maintenance"}
              onClick={() => selectable && toggleTable(table.id)}
              className={[
                "rounded-lg border p-4 text-left transition",
                statusClass[derivedStatus],
                selected ? "ring-2 ring-primario-500" : "",
                selectable ? "hover:-translate-y-0.5 hover:shadow-sm" : "cursor-default",
              ].join(" ")}
            >
              <span className="flex items-center justify-between">
                <span className="font-bold">Mesa {table.tableNum}</span>
                <Armchair className="h-5 w-5" />
              </span>
              <span className="mt-2 block text-sm">Capacidad {table.ability}</span>
              <span className="mt-1 block text-xs uppercase tracking-wide">
                {tableStatusLabel[derivedStatus]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
