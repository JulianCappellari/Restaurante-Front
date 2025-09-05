"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReservaSelection } from "@/store/reservation/selection.store";
import { createBookingAction } from "@/actions/reservation/createBooking";
import { useUserInfo } from "@/hooks/useUserInfo";
import {
  CalendarDaysIcon,
  UsersIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

type BookingResponse = {
  booking: { id: number; status: string };
  tables: Array<{ id: number; tableNum: number }>;
};

type InitialAuth = {
  isLoggedIn: boolean;
  userId: number | null;
  email: string | null;
};

const fmt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("es-AR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export default function BookingConfirm({
  initialAuth,
}: {
  initialAuth: InitialAuth;
}) {
  const router = useRouter();
  const { dateTime, people, tableIds, clear, status } = useReservaSelection();

  const [resp, setResp] = useState<BookingResponse | null>(null);
  const [err, setErr] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const canRender = status === "available";

  const uniqueTableIds = useMemo(() => {
    const seen = new Set<number>();
    return tableIds.filter((id) =>
      seen.has(id) ? false : (seen.add(id), true)
    );
  }, [tableIds]);

  const disabled = !dateTime || !people || uniqueTableIds.length === 0;

  // Datos de usuario: prioriza hook por email, sino props
  const emailFallback = initialAuth.email;
  const { userInfo } = useUserInfo(emailFallback || null);

  const initials = useMemo(() => {
    const name = `${userInfo?.firstName ?? ""} ${
      userInfo?.lastName ?? ""
    }`.trim();
    if (name)
      return name
        .split(" ")
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join("");
    if (emailFallback) return emailFallback[0]?.toUpperCase() ?? "U";
    return "U";
  }, [userInfo, emailFallback]);

  const handleBooking = () => {
    if (disabled) return;
    if (!initialAuth.isLoggedIn) {
      setErr("Iniciá sesión para continuar.");
      return;
    }

    setErr(undefined);
    setResp(null);

    const payload = {
      userId: userInfo?.id ?? initialAuth.userId ?? undefined,
      bookingDate: dateTime!,
      numberPeople: people!,
      tableIds: uniqueTableIds,
    };

    startTransition(async () => {
      try {
        const r = await createBookingAction(payload);
        setResp(r);
        clear();
      } catch (e: any) {
        setErr(e?.message || "Error al crear la reserva.");
      }
    });
  };

  const handleLogin = () => router.push("/auth/login?redirect=/reserva");

  if (!canRender) return null;

  if (!initialAuth.isLoggedIn) {
    return (
      <section className="rounded-2xl border bg-card p-6">
        <h3 className="text-lg font-semibold">Iniciá sesión para confirmar</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Necesitás una cuenta para completar la reserva.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button onClick={handleLogin} className="btn-primary">
            Iniciar sesión
          </button>
          <Link
            href="/auth/register?redirect=/reserva"
            className="btn-outline text-center"
          >
            Crear cuenta
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-6 space-y-5">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Confirmar reserva</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
          <CheckCircleIcon className="h-4 w-4" />
          Sesión activa
        </span>
      </header>

      <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {`${userInfo?.firstName ?? ""} ${
              userInfo?.lastName ?? ""
            }`.trim() || "Usuario"}
          </p>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <EnvelopeIcon className="h-4 w-4" />
            {userInfo?.email ?? emailFallback ?? "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h4 className="mb-3 font-medium">Resumen</h4>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="grid grid-cols-[auto,1fr] items-center gap-2">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <CalendarDaysIcon className="h-5 w-5" />
              Fecha y hora
            </dt>
            <dd className="justify-self-end font-medium sm:justify-self-start">
              {fmt(dateTime)}
            </dd>
          </div>

          <div className="grid grid-cols-[auto,1fr] items-center gap-2">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <UsersIcon className="h-5 w-5" />
              Personas
            </dt>
            <dd className="justify-self-end font-medium sm:justify-self-start">
              {people ?? "-"}
            </dd>
          </div>
        </dl>
      </div>

      <div aria-live="polite" aria-atomic="true" className="space-y-3">
        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}
        {resp && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <p>
              <b>Reserva:</b> #{resp.booking.id} • {resp.booking.status}
            </p>
            <p>
              <b>Mesas:</b>{" "}
              {resp.tables.map((t) => `#${t.tableNum}`).join(", ")}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleBooking}
          disabled={isPending || disabled}
          aria-busy={isPending}
          className="btn-primary w-full justify-center sm:w-auto"
        >
          {isPending ? "Procesando…" : "Confirmar reserva"}
        </button>
      </div>
    </section>
  );
}
