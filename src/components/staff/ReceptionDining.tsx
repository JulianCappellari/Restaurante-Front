"use client";

import { createTableSession } from "@/actions/table-sessions/table-session-actions";
import { useRealtime } from "@/hooks/realtime/useRealtime";
import type { Booking, Table, TableSession } from "@/interfaces/reservation.interface";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import TableDiningCode from "./TableDiningCode";

type Props = { tables: Table[]; bookings: Booking[]; sessions: TableSession[] };

export default function ReceptionDining({ tables, bookings, sessions }: Props) {
  const router = useRouter();
  const handlers = useMemo(() => ({ table_sessions_updated: () => router.refresh() }), [router]);
  useRealtime("reception", handlers);
  const [tableId, setTableId] = useState(0);
  const [size, setSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
  const currentBookings = bookings.filter((booking) =>
    booking.status === "checked_in" && (booking.date || booking.bookingDate?.slice(0, 10)) === today
  );
  const forTable = (id: number) => currentBookings.find((booking) =>
    booking.assignedTables?.some((table) => table.id === id)
  );
  const active = new Map(sessions.map((session) => [session.tableId, session]));
  const selected = tables.find((table) => table.id === tableId);
  const booking = forTable(tableId);
  const session = active.get(tableId);
  const partySize = size ?? booking?.numberPeople ?? Math.min(selected?.ability ?? 2, 2);
  const options = tables.filter((table) => table.status === "available" || active.has(table.id) || forTable(table.id));

  async function open(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || loading || session) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const created = await createTableSession({ tableId, bookingId: booking?.id ?? null, partySize });
      const result = created.preOrder;
      if (result?.converted) {
        setNotice(`Pedido anticipado enviado a cocina: ${result.sentItems} ${result.sentItems === 1 ? "plato" : "platos"}.${result.skipped.length ? ` Sin stock: ${result.skipped.join(", ")}.` : ""}`);
      } else if (result?.error) {
        setNotice(result.error);
      }
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo abrir la mesa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="staff-panel p-4 sm:p-5" aria-labelledby="reception-dining">
      <h2 id="reception-dining" className="text-xl font-bold text-stone-950">Abrir mesa y compartir menú</h2>
      <form onSubmit={open} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="grid min-w-36 flex-1 gap-1 text-sm font-semibold text-stone-900">
          <label htmlFor="reception-table">Mesa</label>
          <select id="reception-table" value={tableId} disabled={loading} onChange={(event) => {
            setTableId(Number(event.target.value));
            setSize(null);
            setError("");
          }} className="min-h-11 rounded-lg border border-stone-300 bg-white px-3">
            <option value={0}>Elegí una mesa</option>
            {options.map((table) => <option key={table.id} value={table.id}>Mesa {table.tableNum}</option>)}
          </select>
        </div>
        <label className="grid w-24 gap-1 text-sm font-semibold text-stone-900">
          Personas
          <input type="number" min={1} max={booking ? 20 : selected?.ability || 20} value={session?.partySize ?? partySize}
            disabled={!selected || Boolean(session) || loading} onChange={(event) => setSize(Number(event.target.value) || 1)}
            className="min-h-11 rounded-lg border border-stone-300 px-3" />
        </label>
        {!session && <button type="submit" disabled={!selected || loading} className="min-h-11 rounded-lg bg-primario-700 px-4 text-sm font-semibold text-white disabled:opacity-55">
          {loading ? "Abriendo…" : "Abrir mesa"}
        </button>}
      </form>
      {error && <p role="alert" className="mt-2 text-sm text-primario-900">{error}</p>}
      {notice && <p role="status" className="mt-2 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-950">{notice}</p>}
      {selected && session && <TableDiningCode key={`${session.id}-${tableId}`} sessionId={session.id} tableNum={selected.tableNum} />}
    </section>
  );
}
