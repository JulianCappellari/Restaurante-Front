import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { getUserBookings } from "@/actions/bookings/get-user-bookings";
import { getAllmenu } from "@/actions/menu/get-all-menu";
import { getBookingPreOrder } from "@/actions/preorders/preorder-actions";
import { getMenuSignals } from "@/actions/service/service-actions";
import CustomerIntro from "@/components/dashboard/CustomerIntro";
import BookingPreOrder from "@/components/preorder/BookingPreOrder";
import { getUserFromToken } from "@/utils/getUserFromToken";

export const metadata: Metadata = { title: "Pedido anticipado | Restaurante App" };

export default async function BookingPreOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookingId = Number(id);
  const user = getUserFromToken((await cookies()).get("token")?.value);
  const bookings = user?.id ? await getUserBookings(Number(user.id)).catch(() => []) : [];
  const booking = bookings.find((item) => item.id === bookingId);

  if (!booking || !["pending", "confirmed"].includes(booking.status)) {
    return (
      <div className="customer-shell py-10">
        <h1 className="text-3xl">No podemos tomar un pedido para esta reserva</h1>
        <p className="mt-2 text-cliente-muted">Solo se puede dejar pedido en reservas pendientes o confirmadas que sean tuyas.</p>
        <Link href="/cuenta/reservas" className="btn-primary customer-press mt-5 inline-flex min-h-12 items-center">Volver a mis reservas</Link>
      </div>
    );
  }

  const [menu, signals, initial] = await Promise.all([
    getAllmenu(), getMenuSignals().catch(() => null), getBookingPreOrder(bookingId).catch(() => null),
  ]);
  const group = booking.numberPeople >= 5;
  return (
    <>
      <CustomerIntro title="Pedí antes de llegar" description="Dejá pedidas las bebidas y las entradas. Cocina empieza cuando te sentás: así llegás y ya está en camino."
        image={group ? "/fotos/24-reserva-grupo.webp" : "/fotos/32-celular-carta-anticipada.webp"} imageAlt={group ? "Mesa larga puesta para un grupo" : "Persona mirando la carta en el celular"} />
      <div className="customer-shell py-6 sm:py-9">
        <BookingPreOrder bookingId={bookingId} initial={initial} menu={menu} soldOut={signals?.soldOut ?? []}
          kitchen={signals?.kitchen ?? null} defaultAlias={String(user?.name ?? "").split(" ")[0] ?? ""} />
      </div>
    </>
  );
}
