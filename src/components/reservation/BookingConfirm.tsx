"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReservaSelection } from "@/store/reservation/selection.store";
import { createBooking } from "@/actions/reservation/create-booking";
import { useUserInfo } from "@/hooks/useUserInfo";
import {
  CalendarDaysIcon,
  UsersIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

/* =========================
   Tipos
   ========================= */
type InitialAuth = {
  isLoggedIn: boolean;
  userId: number | null;
  email: string | null;
};

type ApiTable = { tableNum?: number; id?: number; ability?: number; capacity?: number };

type ApiResponse =
  | {
      data: { id: number; status?: string; tables?: ApiTable[]; assignedTables?: ApiTable[] };
    }
  | {
      id: number;
      status?: string;
      tables?: ApiTable[];
      assignedTables?: ApiTable[];
    };

/* =========================
   Helpers
   ========================= */
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

function normalizeBookingResponse(result: unknown): {
  id: number;
  status: string;
  tables: { tableNum: number; ability: number }[];
} {
  const r = result as ApiResponse;
  const base = "data" in r ? r.data : r;
  if (!base?.id) throw new Error("Respuesta de reserva sin ID");

  const rawTables = (base.tables ?? base.assignedTables ?? []) as ApiTable[];
  const tables = rawTables.map((t) => ({
    tableNum: t.tableNum ?? t.id ?? 0,
    ability: t.ability ?? t.capacity ?? 0,
  }));

  return { id: base.id, status: base.status || "confirmed", tables };
}

function getInitials(name?: string, fallbackEmail?: string) {
  const n = (name ?? "").trim();
  if (n) {
    return n
      .split(" ")
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("");
  }
  return fallbackEmail?.[0]?.toUpperCase() ?? "U";
}

/* =========================
   Componente
   ========================= */
export default function BookingConfirm({ initialAuth }: { initialAuth: InitialAuth }) {
  const router = useRouter();
  const { dateTime, people, tableIds, status, clear } = useReservaSelection();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    id: number;
    status: string;
    tables: { tableNum: number; ability: number }[];
  } | null>(null);

  // limpiar feedback cuando cambia el flujo
  useEffect(() => {
    if (status === "checking" || status === "unavailable") {
      setIsBookingConfirmed(false);
      setBookingDetails(null);
      setError(null);
    }
  }, [status]);

  const canRender = status === "available";
  const hasSuccess = isBookingConfirmed && !!bookingDetails;

  const uniqueTableIds = useMemo(() => {
    const seen = new Set<number>();
    return tableIds.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
  }, [tableIds]);

  const disabled = !dateTime || !people || uniqueTableIds.length === 0;

  // usuario
  const emailFallback = initialAuth.email;
  const { userInfo } = useUserInfo(emailFallback || null);
  const initials = useMemo(
    () => getInitials(`${userInfo?.firstName ?? ""} ${userInfo?.lastName ?? ""}`, emailFallback ?? undefined),
    [userInfo, emailFallback]
  );

  const handleConfirm = useCallback(async () => {
    // 🔒 evita dobles envíos luego del éxito
    if (hasSuccess) return;

    if (!userInfo?.id || !dateTime || !people || uniqueTableIds.length === 0) {
      setError("Faltan datos necesarios para completar la reserva.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        userId: userInfo.id,
        dateTime: new Date(dateTime).toISOString(),
        numberPeople: people,
        tableIds: uniqueTableIds,
      };

      const result = await createBooking(payload);
      const normalized = normalizeBookingResponse(result);

      setIsBookingConfirmed(true);
      setBookingDetails(normalized);
    } catch (err: unknown) {
      let msg = "Error al crear la reserva.";
      if (err instanceof Error) msg = err.message;
      else if (typeof err === "string") msg = err;

      if (msg.includes("401") || msg.includes("No autenticado")) {
        msg = "Tu sesión ha expirado. Por favor, volvé a iniciar sesión.";
      } else if (msg.includes("400")) {
        msg = "Datos de reserva inválidos. Verificá la información e intentá nuevamente.";
      } else if (msg.includes("500")) {
        msg = "Error interno del servidor. Intentá nuevamente más tarde.";
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [hasSuccess, userInfo?.id, dateTime, people, uniqueTableIds]);

  if (!canRender) return null;

  if (!initialAuth.isLoggedIn) {
    return (
      <section className="rounded-2xl border bg-card p-6">
        <h3 className="text-lg font-semibold">Iniciá sesión para confirmar</h3>
        <p className="mt-1 text-sm text-muted-foreground">Necesitás una cuenta para completar la reserva.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => router.push("/auth/login?redirect=/reserva")} className="btn-primary">
            Iniciar sesión
          </button>
          <Link href="/auth/register?redirect=/reserva" className="btn-outline text-center">
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
            {`${userInfo?.firstName ?? ""} ${userInfo?.lastName ?? ""}`.trim() || "Usuario"}
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
            <dd className="justify-self-end font-medium sm:justify-self-start">{fmt(dateTime)}</dd>
          </div>

          <div className="grid grid-cols-[auto,1fr] items-center gap-2">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <UsersIcon className="h-5 w-5" />
              Personas
            </dt>
            <dd className="justify-self-end font-medium sm:justify-self-start">{people ?? "-"}</dd>
          </div>
        </dl>
      </div>

      <div aria-live="polite" aria-atomic="true" className="space-y-3">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {hasSuccess && bookingDetails && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircleIcon className="h-5 w-5" />
              <h3 className="font-semibold">Reserva confirmada</h3>
            </div>
            <div className="mt-2 space-y-2 text-sm">
              <p>
                <b>Número de reserva:</b> #{bookingDetails.id}
              </p>
              <p>
                <b>Estado:</b> {bookingDetails.status === "confirmed" ? "Confirmada" : bookingDetails.status}
              </p>
              <div>
                <b>Mesas asignadas:</b>
                <ul className="mt-1 space-y-1">
                  {bookingDetails.tables.map((t, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <TableCellsIcon className="h-4 w-4 text-gray-500" />
                      Mesa {t.tableNum} (Hasta {t.ability} personas)
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="btn-outline text-sm"
                  onClick={() => {
                    setIsBookingConfirmed(false);
                    setBookingDetails(null);
                    setError(null);
                    clear(); // vuelve a 'idle' para iniciar otra búsqueda
                  }}
                >
                  Hacer otra reserva
                </button>
                <Link href="/mis-reservas" className="btn-secondary text-sm text-center">
                  Ver mis reservas
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón principal:
          - Oculto cuando ya hubo éxito (hasSuccess)
          - Deshabilitado mientras envía o si faltan datos */}
      {!hasSuccess && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || disabled}
            aria-busy={isSubmitting}
            className="btn-primary w-full justify-center sm:w-auto"
          >
            {isSubmitting ? "Procesando…" : "Confirmar reserva"}
          </button>
        </div>
      )}
    </section>
  );
}
