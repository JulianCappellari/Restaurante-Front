import StaffHeader from "@/components/staff/StaffHeader";
import { getAllBookings } from "@/actions/bookings/get-all-bookings";
import { getAllOrders } from "@/actions/orders/get-all-orders";
import { getAllTables } from "@/actions/tables/get-all-tables";
import { getActiveTableSessions } from "@/actions/table-sessions/table-session-actions";
import AvailabilityForm from "@/components/reservation/AvailabilityForm";
import DeliveryDispatchPanel from "@/components/staff/DeliveryDispatchPanel";
import ReceptionBookingActions from "@/components/staff/ReceptionBookingActions";
import ReceptionCashPanel from "@/components/staff/ReceptionCashPanel";
import ReceptionDining from "@/components/staff/ReceptionDining";
import ReceptionQuickBooking from "@/components/staff/ReceptionQuickBooking";
import ReceptionTableMapByDate from "@/components/staff/ReceptionTableMapByDate";
import ReceptionViews from "@/components/staff/ReceptionViews";
import { bookingStatusLabel } from "@/lib/labels";
import { CalendarClock, Phone, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const shiftLabel: Record<string, string> = {
  lunch: "Mediodía",
  dinner: "Noche",
};

const statusTone: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-[#eaf0fa] text-[#17336d]",
  checked_in: "bg-green-100 text-green-800",
};

const todayInArgentina = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export default async function ReceptionPage() {
  const [tables, bookings, orders, sessions] = await Promise.all([getAllTables(), getAllBookings(), getAllOrders(), getActiveTableSessions()]);

  const today = todayInArgentina();
  const bookingDay = (booking: { date?: string; bookingDate?: string }) => booking.date || booking.bookingDate?.slice(0, 10);
  const todays = bookings.filter((booking) => bookingDay(booking) === today);
  const pendingArrival = todays.filter((booking) => ["pending", "confirmed"].includes(booking.status)).length;
  const occupiedTableIds = new Set(sessions.map((session) => session.tableId));
  const freeTables = tables.filter((table) => table.status === "available" && !occupiedTableIds.has(table.id)).length;
  const deliveries = orders.filter((order) => order.deliveryType === "delivery" && order.state === "ready" && !order.cancelledAt).length;

  // Agenda: primero las que llegan antes en el turno; luego las ya ingresadas.
  const shiftOrder: Record<string, number> = { lunch: 0, dinner: 1 };
  const upcoming = bookings
    .filter((booking) => ["pending", "confirmed", "checked_in"].includes(booking.status))
    .sort((a, b) => (shiftOrder[a.shift ?? ""] ?? 2) - (shiftOrder[b.shift ?? ""] ?? 2))
    .slice(0, 8);

  const kpis = [
    { label: "Mesas libres", value: freeTables, hint: `de ${tables.length}` },
    { label: "Cuentas abiertas", value: sessions.length, hint: "en salón" },
    { label: "Reservas de hoy", value: todays.length, hint: "en agenda" },
    { label: "Por confirmar llegada", value: pendingArrival, hint: "pendientes o confirmadas" },
  ];

  const agenda = (
    <section className="staff-panel p-4 sm:p-5" aria-labelledby="agenda">
      <div className="flex items-center justify-between">
        <h2 id="agenda" className="text-xl font-bold text-gray-950">Agenda activa</h2>
        <CalendarClock aria-hidden className="h-5 w-5 text-primario-700" />
      </div>
      <div className="mt-4 space-y-3">
        {upcoming.map((booking) => {
          const customerName = booking.user
            ? `${booking.user.firstName} ${booking.user.lastName}`.trim() || booking.user.email
            : "Cliente sin datos cargados";
          const tableNames =
            (booking.assignedTables || []).map((table) => `Mesa ${table.tableNum}`).join(", ") || "Mesa pendiente";
          return (
            <article key={booking.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-500">
                    {booking.shift ? shiftLabel[booking.shift] : "Turno"} · {bookingDay(booking) ?? "-"}
                  </p>
                  <h3 className="mt-0.5 break-words text-lg font-bold text-stone-950">{customerName}</h3>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${statusTone[booking.status] ?? "bg-stone-200 text-stone-800"}`}>
                  {bookingStatusLabel[booking.status] || booking.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-700">
                <p className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {booking.numberPeople} {booking.numberPeople === 1 ? "persona" : "personas"}</p>
                {booking.user?.phone && <p className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {booking.user.phone}</p>}
                <p className="font-semibold text-stone-900">{tableNames}</p>
              </div>
              <ReceptionBookingActions bookingId={booking.id} />
            </article>
          );
        })}
        {upcoming.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600">
            No hay reservas activas cargadas.
          </div>
        )}
      </div>
    </section>
  );

  return (
    <div className="staff-shell reception-screen">
      <StaffHeader area="recepcion" title="Recepción y reservas" description="Recibí a los clientes, asigná mesas y compartí el QR de la carta." />

      <section aria-label="Resumen del día" className="reception-kpis grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="staff-panel p-4">
            <p className="text-sm font-semibold text-stone-600">{kpi.label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-[#17336d]">{kpi.value}</p>
            <p className="text-xs text-stone-500">{kpi.hint}</p>
          </div>
        ))}
      </section>

      <ReceptionViews
        counts={{ freeTables, pendingArrival, deliveries }}
        slots={{
          salon: (
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <ReceptionDining tables={tables} bookings={bookings} sessions={sessions} />
              <ReceptionTableMapByDate tables={tables} bookings={bookings} />
            </div>
          ),
          reservas: (
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <div className="min-w-0 space-y-5">
                <AvailabilityForm />
                <ReceptionQuickBooking />
              </div>
              {agenda}
            </div>
          ),
          caja: <div className="max-w-3xl"><ReceptionCashPanel /></div>,
          despacho: <DeliveryDispatchPanel initialOrders={orders} title="Delivery listo para despacho" />,
        }}
      />
    </div>
  );
}
