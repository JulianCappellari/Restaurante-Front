"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AvailabilityResponse } from "@/interfaces/reservation.interface";
import { checkAvailabilityAction } from "@/actions/reservation/post-availability";
import { useReservaSelection } from "@/store/reservation/selection.store";

type AvailabilityWithLegacyBreakdown = Omit<AvailabilityResponse, "tables"> & {
  tables?: Array<number | { id: number }>;
  breakdown?: {
    fours?: number[];
    twos?: number[];
  };
};

const schema = z.object({
  dateTime: z.string().min(1, "Fecha y hora requeridas"),
  people: z.coerce.number().int().min(1, "Minimo 1").max(20, "Maximo 20"),
});

type FormValues = z.infer<typeof schema>;

const nowLocalForInput = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function toLocalOffsetISOString(local: string) {
  const [datePart, timePart] = local.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, 0, 0);
  const timezoneMinutes = -date.getTimezoneOffset();
  const sign = timezoneMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(timezoneMinutes);
  const offsetHours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const offsetMinutes = String(absolute % 60).padStart(2, "0");
  const formattedMonth = String(month).padStart(2, "0");
  const formattedDay = String(day).padStart(2, "0");
  const formattedHour = String(date.getHours()).padStart(2, "0");
  const formattedMinute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${formattedMonth}-${formattedDay}T${formattedHour}:${formattedMinute}:00${sign}${offsetHours}:${offsetMinutes}`;
}

const OPEN_LUNCH_START = 12;
const OPEN_LUNCH_END_EXCLUSIVE = 16;
const OPEN_DINNER_START = 20;
const OPEN_DINNER_END_EXCLUSIVE = 24;

function isWithinServiceHours(dateLocalString: string): boolean {
  const hour = Number(dateLocalString.slice(11, 13));
  return (
    (hour >= OPEN_LUNCH_START && hour < OPEN_LUNCH_END_EXCLUSIVE) ||
    (hour >= OPEN_DINNER_START && hour < OPEN_DINNER_END_EXCLUSIVE)
  );
}

function hoursMessage() {
  return "Horarios disponibles: 12:00-15:59 (mediodia) y 20:00-23:59 (noche).";
}

function extractTableIds(resp: AvailabilityWithLegacyBreakdown): number[] {
  if (Array.isArray(resp.tables) && resp.tables.length) {
    const first = resp.tables[0];
    if (typeof first === "number") {
      return resp.tables.filter((table): table is number => typeof table === "number");
    }
    if (typeof first === "object" && first?.id) {
      return (resp.tables as Array<{ id: number }>).map((table) => table.id);
    }
  }

  if (resp.breakdown) {
    const fours = Array.isArray(resp.breakdown.fours) ? resp.breakdown.fours : [];
    const twos = Array.isArray(resp.breakdown.twos) ? resp.breakdown.twos : [];
    return [...fours, ...twos].filter((table): table is number => typeof table === "number");
  }

  return [];
}

export default function AvailabilityForm() {
  const { set, setStatus } = useReservaSelection();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { dateTime: nowLocalForInput(), people: 2 },
  });

  const [response, setResponse] = useState<AvailabilityResponse | null>(null);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const people = watch("people");
  const dateTimeLocal = watch("dateTime");
  const minDateTime = useMemo(nowLocalForInput, []);
  const outOfHours = dateTimeLocal ? !isWithinServiceHours(dateTimeLocal) : false;

  const onSubmit = (values: FormValues) => {
    setError(undefined);
    setResponse(null);

    if (!isWithinServiceHours(values.dateTime)) {
      setError(hoursMessage());
      setStatus("idle");
      return;
    }

    setStatus("checking");

    startTransition(async () => {
      try {
        const iso = toLocalOffsetISOString(values.dateTime);
        const data = await checkAvailabilityAction({ dateTime: iso, people: values.people });
        setResponse(data);

        if (data.available) {
          const pickedIds = extractTableIds(data);
          set({ dateTime: iso, people: values.people, tableIds: pickedIds });
          setStatus("available");
        } else {
          set({ dateTime: iso, people: values.people, tableIds: [] });
          setStatus("unavailable");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al consultar disponibilidad");
        setStatus("idle");
      }
    });
  };

  return (
    <section className="reservation-availability space-y-5 rounded-xl border bg-white p-5 sm:p-6">
      <header>
        <h3 className="text-xl font-bold text-gray-950">Buscar disponibilidad</h3>
        <p className="mt-1 text-sm text-gray-600">Elegí fecha y cantidad de personas.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-3">
        <div className="min-w-0">
          <label htmlFor="dateTime" className="mb-1 block text-sm font-medium text-gray-700">
            Fecha y hora
          </label>
          <input
            id="dateTime"
            type="datetime-local"
            min={minDateTime}
            step={60}
            {...register("dateTime")}
            disabled={isPending}
            className={`min-h-11 min-w-0 w-full rounded-lg border px-3 py-2 focus-visible:focus-ring ${
              errors.dateTime || outOfHours ? "border-red-500" : "border-gray-200"
            }`}
            aria-invalid={errors.dateTime ? "true" : "false"}
          />
          {outOfHours && <p className="mt-1 text-xs text-red-600">{hoursMessage()}</p>}
          {errors.dateTime && <p className="mt-1 text-xs text-red-600">{errors.dateTime.message}</p>}
        </div>

        <div>
          <label htmlFor="people" className="mb-1 block text-sm font-medium text-gray-700">
            Personas
          </label>
          <input
            id="people"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            disabled={isPending}
            {...register("people", {
              onChange: (event) => {
                event.target.value = event.target.value.replace(/\D/g, "");
              },
            })}
            className={`w-full rounded-lg border px-3 py-2 focus-visible:focus-ring ${
              errors.people ? "border-red-500" : "border-gray-200"
            }`}
            placeholder="Ej: 2"
          />
          {errors.people && <p className="mt-1 text-xs text-red-600">{errors.people.message}</p>}
          <p className="mt-1 text-xs text-gray-500">Hasta 20 personas.</p>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending || outOfHours}
            aria-busy={isPending}
            className="btn-primary w-full justify-center rounded-lg disabled:opacity-60"
            title={outOfHours ? hoursMessage() : undefined}
          >
            {isPending ? "Consultando..." : "Ver disponibilidad"}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {response?.available && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Disponibilidad confirmada para <b>{people}</b> persona(s) el{" "}
          <b>{formatDateTime(toLocalOffsetISOString(dateTimeLocal))}</b>. Se asigno la mejor
          combinacion de mesas automaticamente.
        </div>
      )}

      {response && !response.available && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Sin disponibilidad para el horario seleccionado.
          {response.message ? <span className="block text-xs">{response.message}</span> : null}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                reset({ dateTime: nowLocalForInput(), people: 2 });
                setResponse(null);
              }}
              className="btn-outline rounded-lg text-sm"
            >
              Probar otra fecha
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
