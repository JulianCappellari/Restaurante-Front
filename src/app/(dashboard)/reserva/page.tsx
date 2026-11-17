import AvailabilityForm from "@/components/reservation/AvailabilityForm";
import BookingConfirm from "@/components/reservation/BookingConfirm";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { cookies } from "next/headers";
import CustomerIntro from "@/components/dashboard/CustomerIntro";

type InitialAuth = {
  isLoggedIn: boolean;
  userId: number | null;
  email: string | null;
};

export default async function ReservationPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = getUserFromToken(token);
  const payloadId = payload?.id;

  const initialAuth: InitialAuth = {
    isLoggedIn: Boolean(token && payload),
    userId:
      typeof payloadId === "number"
        ? payloadId
        : payloadId && !Number.isNaN(Number(payloadId))
        ? Number(payloadId)
        : null,
    email: payload?.email ?? null,
  };

  return (
    <>
      <CustomerIntro title="Reservá una mesa" description="Elegí cuándo querés venir y para cuántas personas. Después confirmá la reserva desde tu cuenta." image="/fotos/05-salon-reservas.webp" imageAlt="Salón del restaurante preparado para recibir reservas" />
      <div className="customer-shell py-7 sm:py-10">
        <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div data-reveal="left"><AvailabilityForm /></div>
          <div data-reveal="right"><BookingConfirm initialAuth={initialAuth} /></div>
        </div>
      </div>
    </>
  );
}
