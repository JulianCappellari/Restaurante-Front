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

// "YYYY-MM-DDTHH:mm" -> ISO con offset local
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

function autoPickTableIds(res: AvailabilityResponse, people: number): number[] {
  const suggestions = [...(res.suggestions ?? [])]
    .map((s) => ({ ...s, over: Math.max(0, s.fits - people) }))
    .sort((a, b) => (a.over === b.over ? a.tableIds.length - b.tableIds.length : a.over - b.over));
  if (suggestions.length) return suggestions[0].tableIds;
  if (res.tables?.length) return [res.tables[0].id];
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
  const minDateTime = useMemo(nowLocalForInput, []);

  const onSubmit = (v: FormValues) => {
    setErr(undefined);
    setRes(null);
    setStatus("checking");

    startTransition(async () => {
      try {
        const iso = toLocalOffsetISOString(v.dateTime);
        const data = await checkAvailabilityAction({ dateTime: iso, people: v.people });
        setRes(data);

        if (data.available) {
          const picked = autoPickTableIds(data, v.people);
          set({ dateTime: iso, people: v.people, tableIds: picked });
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
            disabled={isPending}
            {...register("dateTime")}
            className={[
              "w-full rounded-xl border px-3 py-2 bg-white focus-visible:focus-ring",
              errors.dateTime ? "border-red-500" : "border-border",
            ].join(" ")}
          />
          {errors.dateTime && (
            <p className="mt-1 text-xs text-red-600">{errors.dateTime.message}</p>
          )}
        </div>

        {/* Personas: solo números */}
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
          {errors.people && (
            <p className="mt-1 text-xs text-red-600">{errors.people.message}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Máximo 20 personas.</p>
        </div>

        {/* Acción */}
        <div className="flex items-center">
          <button
            type="submit"
            disabled={isPending}
            aria-busy={isPending}
            className="btn-primary w-full justify-center"
          >
            {isPending ? "Consultando…" : "Ver disponibilidad"}
          </button>
        </div>
      </form>

      {/* Estado */}
      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {res?.available && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Disponibilidad confirmada para <b>{people}</b> persona(s) el{" "}
          <b>{fmt(toLocalOffsetISOString(watch("dateTime")))}</b>. Se asignó la mejor combinación
          de mesas automáticamente.
        </div>
      )}

      {res && !res.available && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Sin disponibilidad para el horario seleccionado.
          {"message" in res && res.message ? (
            <span className="block text-xs">{res.message}</span>
          ) : null}
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
