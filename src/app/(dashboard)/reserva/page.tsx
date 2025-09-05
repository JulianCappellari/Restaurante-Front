// app/reserva/page.tsx
import AvailabilityForm from "@/components/reservation/AvailabilityForm";
import BookingConfirm from "@/components/reservation/BookingConfirm";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type InitialAuth = {
  isLoggedIn: boolean;
  userId: number | null;
  email: string | null;
};

export default async function ReservationPage() {
  const token = cookies().get("token")?.value;
  let initialAuth: InitialAuth = { isLoggedIn: false, userId: null, email: null };

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      initialAuth = {
        isLoggedIn: true,
        userId:
          typeof payload.id === "number"
            ? payload.id
            : payload.sub && !Number.isNaN(Number(payload.sub))
            ? Number(payload.sub)
            : null,
        email: payload.email ?? null,
      };
    } catch {
      // token inválido o expirado -> se mantiene logged out
    }
  }

  return (
    <div className="min-h-[800px] bg-background">
      <div className="container py-10">
        <header className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Reservas</h2>
          <p className="mt-1 text-muted-foreground">Verificá disponibilidad y confirmá tu mesa.</p>
        </header>

        <div className="mx-auto grid max-w-5xl gap-6 lg:flex-cols-2">
          <AvailabilityForm />
          <BookingConfirm initialAuth={initialAuth} />
        </div>
      </div>
    </div>
  );
}
