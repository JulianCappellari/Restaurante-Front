"use client";

import type { Booking, Table } from "@/interfaces/reservation.interface";
import TableMap from "./TableMap";
import { useState } from "react";

const todayInArgentina = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export default function ReceptionTableMapByDate({
  tables,
  bookings,
}: {
  tables: Table[];
  bookings: Booking[];
}) {
  const [date, setDate] = useState(todayInArgentina());

  return (
    <div className="space-y-3">
      <label className="staff-panel block p-4">
        <span className="mb-1 block text-sm font-semibold text-gray-700">Ver mapa por fecha</span>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="min-h-11 w-full rounded-lg border px-3 py-2 text-sm sm:w-64"
        />
      </label>
      <TableMap tables={tables} bookings={bookings} selectable date={date} />
    </div>
  );
}
