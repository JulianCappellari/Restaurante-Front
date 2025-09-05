"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AvailabilityResponse } from "@/interfaces/reservation.interface";
import { checkAvailabilityAction } from "@/actions/reservation/post-availability";
import { useReservaSelection } from "@/store/reservation/selection.store";

const schema = z.object({
  dateTime: z.string().min(1, "Fecha y hora requeridas"),
  people: z.coerce.number().int().min(1, "Mínimo 1").max(20, "Máximo 20"),
});
type FormValues = z.infer<typeof schema>;

// Helpers de fecha
const nowLocalForInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const fmt = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// Convierte "YYYY-MM-DDTHH:mm" (local) -> ISO con offset local
function toLocalOffsetISOString(local: string) {
  const [d, t] = local.split("T");
  const [Y, M, D] = d.split("-").map(Number);
  const [h, m] = t.split(":").map(Number);
  const dt = new Date();
  dt.setFullYear(Y, M - 1, D);
  dt.setHours(h, m, 0, 0);
  const tzMin = -dt.getTimezoneOffset();
  const sign = tzMin >= 0 ? "+" : "-";
  const abs = Math.abs(tzMin);
  const offH = String(Math.floor(abs / 60)).padStart(2, "0");
  const offM = String(abs % 60).padStart(2, "0");
  const YYYY = String(Y);
  const MM = String(M).padStart(2, "0");
  const DD = String(D).padStart(2, "0");
  const HH = String(dt.getHours()).padStart(2, "0");
  const MI = String(dt.getMinutes()).padStart(2, "0");
  return `${YYYY}-${MM}-${DD}T${HH}:${MI}:00${sign}${offH}:${offM}`;
}

// Reglas de horario del restaurante
const OPEN_LUNCH_START = 12; // 12:00
const OPEN_LUNCH_END_EXCLUSIVE = 16; // hasta 15:59
const OPEN_DINNER_START = 20; // 20:00
const OPEN_DINNER_END_EXCLUSIVE = 24; // hasta 23:59

function isWithinServiceHours(dateLocalString: string): boolean {
  // dateLocalString viene como "YYYY-MM-DDTHH:mm"
  const hour = Number(dateLocalString.slice(11, 13));
  return (
    (hour >= OPEN_LUNCH_START && hour < OPEN_LUNCH_END_EXCLUSIVE) ||
    (hour >= OPEN_DINNER_START && hour < OPEN_DINNER_END_EXCLUSIVE)
  );
}
function hoursMessage() {
  return "Horarios disponibles: 12:00–15:59 (mediodía) y 20:00–23:59 (noche).";
}

// Extrae ids de mesas
function extractTableIds(resp: any): number[] {
  if (Array.isArray(resp?.tables) && resp.tables.length) {
    const first = resp.tables[0];
    if (typeof first === "number") return resp.tables as number[];
    if (typeof first === "object" && first?.id) return (resp.tables as Array<{ id: number }>).map((t) => t.id);
  }
  if (resp?.breakdown) {
    const fours = Array.isArray(resp.breakdown.fours) ? resp.breakdown.fours : [];
    const twos = Array.isArray(resp.breakdown.twos) ? resp.breakdown.twos : [];
    return [...fours, ...twos].filter((n: any) => typeof n === "number");
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

  const [res, setRes] = useState<AvailabilityResponse | null>(null);
  const [err, setErr] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const people = watch("people");
  const dateTimeLocal = watch("dateTime");
  const minDateTime = useMemo(nowLocalForInput, []);

  const outOfHours = dateTimeLocal ? !isWithinServiceHours(dateTimeLocal) : false;

  const onSubmit = (v: FormValues) => {
    setErr(undefined);
    setRes(null);

    // Bloquea si está fuera de horario
    if (!isWithinServiceHours(v.dateTime)) {
      setErr(hoursMessage());
      setStatus("idle");
      return;
    }

    setStatus("checking");

    startTransition(async () => {
      try {
        const iso = toLocalOffsetISOString(v.dateTime);
        const data = await checkAvailabilityAction({ dateTime: iso, people: v.people });
        setRes(data);

        if (data.available) {
          const pickedIds = extractTableIds(data);
          set({ dateTime: iso, people: v.people, tableIds: pickedIds });
          setStatus("available");
        } else {
          set({ dateTime: iso, people: v.people, tableIds: [] });
          setStatus("unavailable");
        }
      } catch (e: any) {
        setErr(e?.message ?? "Error al consultar disponibilidad");
        setStatus("idle");
      }
    });
  };

  return (
    <section className="rounded-2xl border bg-card p-6 space-y-5">
      <header className="mb-2">
        <h3 className="text-lg font-semibold">Buscar disponibilidad</h3>
        <p className="text-sm text-muted-foreground">Elegí fecha y cantidad de personas.</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-3">
        {/* Fecha y hora */}
        <div>
          <label htmlFor="dateTime" className="mb-1 block text-sm font-medium">
            Fecha y hora
          </label>
          <input
            id="dateTime"
            type="datetime-local"
            min={minDateTime}
            step={60} // pasos de 1 minuto
            {...register("dateTime")}
            disabled={isPending}
            className={[
              "w-full rounded-xl border px-3 py-2 bg-white focus-visible:focus-ring",
              errors.dateTime || outOfHours ? "border-red-500" : "border-border",
            ].join(" ")}
            aria-invalid={errors.dateTime ? "true" : "false"}
          />
          {outOfHours && (
            <p className="mt-1 text-xs text-red-600">{hoursMessage()}</p>
          )}
          {errors.dateTime && (
            <p className="mt-1 text-xs text-red-600">{errors.dateTime.message}</p>
          )}
        </div>

        {/* Personas */}
        <div>
          <label htmlFor="people" className="mb-1 block text-sm font-medium">
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
              onChange: (e) => (e.target.value = e.target.value.replace(/\D/g, "")),
            })}
            onKeyDown={(e) => {
              const ok =
                ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key) ||
                /^\d$/.test(e.key);
              if (!ok) e.preventDefault();
            }}
            className={[
              "w-full rounded-xl border px-3 py-2 bg-white focus-visible:focus-ring",
              errors.people ? "border-red-500" : "border-border",
            ].join(" ")}
            placeholder="Ej: 2"
          />
          {errors.people && <p className="mt-1 text-xs text-red-600">{errors.people.message}</p>}
          <p className="mt-1 text-xs text-muted-foreground">Máximo 20 personas.</p>
        </div>

        {/* Acción */}
        <div className="flex items-center">
          <button
            type="submit"
            disabled={isPending || outOfHours}
            aria-busy={isPending}
            className="btn-primary w-full justify-center disabled:opacity-60"
            title={outOfHours ? hoursMessage() : undefined}
          >
            {isPending ? "Consultando…" : "Ver disponibilidad"}
          </button>
        </div>
      </form>

      {/* Estado */}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
      )}

      {res?.available && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Disponibilidad confirmada para <b>{people}</b> persona(s) el{" "}
          <b>{fmt(toLocalOffsetISOString(dateTimeLocal))}</b>. Se asignó la mejor combinación de mesas automáticamente.
        </div>
      )}

      {res && !res.available && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Sin disponibilidad para el horario seleccionado.
          {"message" in res && res.message ? <span className="block text-xs">{res.message}</span> : null}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                reset({ dateTime: nowLocalForInput(), people: 2 });
                setRes(null);
              }}
              className="btn-outline text-sm"
            >
              Probar otra fecha
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
