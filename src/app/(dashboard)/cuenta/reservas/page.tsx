import { getUserBookings } from "@/actions/bookings/get-user-bookings";
import { getBookingPreOrder } from "@/actions/preorders/preorder-actions";
import { buildMailUrl, buildWhatsAppUrl } from "@/lib/notifications";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { cookies } from "next/headers";
import Link from "next/link";
import { CalendarDays, Mail, MessageCircle, Users } from "lucide-react";
import MyBookingActions from "@/components/reservation/MyBookingActions";
import AccountReload from "@/components/cuenta/AccountReload";
import type { Booking } from "@/interfaces/reservation.interface";

const shifts = { lunch: "Mediodía", dinner: "Noche" };
const statuses: Record<Booking["status"], string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  no_show: "No asististe",
  checked_in: "En el salón",
  completed: "Completada",
};
const dateKey = (booking: Booking) => (booking.date || booking.bookingDate || "").slice(0, 10);
const displayDate = new Intl.DateTimeFormat("es-AR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
});

export default async function MyBookingsPage() {
  const user = getUserFromToken((await cookies()).get("token")?.value);
  let bookings: Booking[] = [];
  let failed = false;
  if (user?.id) {
    try {
      bookings = await getUserBookings(Number(user.id));
    } catch {
      failed = true;
    }
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
  const upcoming = bookings.filter((booking) => booking.status === "checked_in" ||
    (["pending", "confirmed"].includes(booking.status) && (!dateKey(booking) || dateKey(booking) >= today)));
  const upcomingIds = new Set(upcoming.map(({ id }) => id));
  // Pedido anticipado de las próximas reservas pendientes o confirmadas.
  const preOrders = new Map<number, number>();
  await Promise.all(upcoming.filter((booking) => ["pending", "confirmed"].includes(booking.status)).map(async (booking) => {
    const view = await getBookingPreOrder(booking.id).catch(() => null);
    if (view && view.items.length && view.status !== "cancelled") preOrders.set(booking.id, view.items.reduce((sum, item) => sum + item.quantity, 0));
  }));
  const past = bookings.filter(({ id }) => !upcomingIds.has(id));
  const byDate = (a: Booking, b: Booking) => dateKey(a).localeCompare(dateKey(b)) || a.id - b.id;

  return (
    <div className="customer-shell py-6 sm:py-9">
      <header className="account-heading">
        <div>
          <h1 data-split>Mis reservas</h1>
          <p>Revisá cuándo venís, el turno y la mesa asignada.</p>
        </div>
        <Link href="/reserva" className="btn-primary customer-press min-h-11">Nueva reserva</Link>
      </header>

      {failed ? (
        <div className="account-empty">
          <h2 role="alert">No pudimos cargar tus reservas</h2>
          <AccountReload />
        </div>
      ) : bookings.length === 0 ? (
        <div className="account-empty">
          <CalendarDays aria-hidden className="mb-3 size-7 text-cliente-blue" />
          <h2>Todavía no tenés reservas</h2>
          <p>Cuando reserves una mesa, vas a poder consultar los datos de tu visita acá.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-7">
          {[
            { id: "proximas", title: "Próximas visitas", records: upcoming.sort(byDate) },
            { id: "historial", title: "Historial de reservas", records: past.sort((a, b) => byDate(b, a)) },
          ].map(({ id, title, records }) => records.length > 0 && (
            <section key={id} aria-labelledby={id}>
              <h2 id={id} className="text-2xl">{title}</h2>
              <div className="account-ledger">
                {records.map((booking) => {
                  const date = dateKey(booking);
                  const parsed = new Date(`${date}T12:00:00Z`);
                  const dateLabel = Number.isFinite(parsed.getTime()) ? displayDate.format(parsed) : "Fecha pendiente";
                  const shift = booking.shift ? shifts[booking.shift] : "Turno sin confirmar";
                  const tableNames = booking.assignedTables?.map((table) => `Mesa ${table.tableNum}`).join(", ") || "Mesa pendiente de asignación";
                  const status = statuses[booking.status] || booking.status;
                  const notification = {
                    type: "reserva" as const,
                    recipientName: user?.email || undefined,
                    email: user?.email || undefined,
                    reference: `Reserva #${booking.id}`,
                    details: `${dateLabel}. ${shift}. ${tableNames}. Estado: ${status}.`,
                  };

                  return (
                    <article className="account-entry" key={booking.id}>
                      <div className="account-entry-top">
                        <div>
                          <p className="account-meta">Reserva #{booking.id}</p>
                          <h3 className="mt-1 text-xl first-letter:uppercase">{dateLabel}</h3>
                        </div>
                        <span className="account-status" data-status={booking.status}>{status}</span>
                      </div>
                      <div className="account-entry-foot">
                        <p className="account-meta flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>{shift}</span>
                          <span className="inline-flex items-center gap-1.5"><Users aria-hidden className="size-4" />
                            {booking.numberPeople} {booking.numberPeople === 1 ? "persona" : "personas"}
                          </span>
                        </p>
                        <p className="account-meta">{tableNames}</p>
                      </div>
                      {["pending", "confirmed"].includes(booking.status) && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {preOrders.has(booking.id) && (
                            <span className="account-status" data-status="confirmed">Pedido listo · {preOrders.get(booking.id)} {preOrders.get(booking.id) === 1 ? "plato" : "platos"}</span>
                          )}
                          <Link href={`/cuenta/reservas/${booking.id}/pedido`} className="customer-press inline-flex min-h-11 items-center rounded-xl border border-cliente-blue px-4 text-sm font-semibold text-cliente-blue">
                            {preOrders.has(booking.id) ? "Ver mi pedido anticipado" : "Dejar pedido para cuando llegue"}
                          </Link>
                        </div>
                      )}
                      <MyBookingActions bookingId={booking.id} currentDate={date} currentShift={booking.shift}
                        canManage={booking.status !== "cancelled" && booking.status !== "completed"} />
                      <div aria-label="Compartir reserva" role="group" className="mt-2 flex flex-wrap gap-x-4 text-sm text-cliente-blue">
                        <a href={buildWhatsAppUrl(notification)} target="_blank" rel="noreferrer"
                          className="inline-flex min-h-11 items-center gap-2 font-semibold underline-offset-4 hover:underline">
                          <MessageCircle aria-hidden className="size-4" /> WhatsApp
                        </a>
                        <a href={buildMailUrl(notification)}
                          className="inline-flex min-h-11 items-center gap-2 font-semibold underline-offset-4 hover:underline">
                          <Mail aria-hidden className="size-4" /> Correo
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
