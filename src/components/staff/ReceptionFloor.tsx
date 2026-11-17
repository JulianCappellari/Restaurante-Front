"use client";

import { getFloor, type FloorTable } from "@/actions/service/service-actions";
import { useRealtime } from "@/hooks/realtime/useRealtime";
import { useCallback, useEffect, useMemo, useState } from "react";

/* Mapa de salón en vivo: el color dice en qué momento está cada mesa. */
const STATE: Record<FloorTable["state"], { label: string; tone: string }> = {
  libre: { label: "Libre", tone: "bg-green-50 border-green-300 text-green-900" },
  reservada: { label: "Reservada", tone: "bg-sky-50 border-sky-300 text-sky-900" },
  pidiendo: { label: "Eligiendo", tone: "bg-amber-50 border-amber-300 text-amber-900" },
  esperando: { label: "Esperando platos", tone: "bg-orange-50 border-orange-300 text-orange-900" },
  comiendo: { label: "Comiendo", tone: "bg-[#eaf0fa] border-[#a9bfe6] text-[#17336d]" },
  cuenta: { label: "Pidió la cuenta", tone: "bg-violet-50 border-violet-300 text-violet-900" },
  "por-liberar": { label: "Por liberarse", tone: "bg-teal-50 border-teal-400 text-teal-900" },
  mantenimiento: { label: "Fuera de uso", tone: "bg-stone-100 border-stone-300 text-stone-600" },
};
const since = (minutes: number) => minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${Math.floor(minutes / 1440)} d`;
const ORDER: FloorTable["state"][] = ["por-liberar", "cuenta", "comiendo", "esperando", "pidiendo", "reservada", "libre", "mantenimiento"];

export default function ReceptionFloor() {
  const [tables, setTables] = useState<FloorTable[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setTables(await getFloor());
      setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo cargar el salón.");
    }
  }, []);

  const handlers = useMemo(() => ({ table_sessions_updated: () => { void load(); } }), [load]);
  useRealtime("reception", handlers);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const counts = useMemo(() => {
    const map = new Map<FloorTable["state"], number>();
    (tables ?? []).forEach((table) => map.set(table.state, (map.get(table.state) ?? 0) + 1));
    return map;
  }, [tables]);
  const zones = useMemo(() => [...new Set((tables ?? []).map((table) => table.zone ?? "Salón"))], [tables]);

  return (
    <section aria-labelledby="floor-title" className="staff-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="floor-title" className="text-xl font-bold text-stone-950">Salón en vivo</h2>
        <p className="text-xs text-stone-600">Se actualiza solo. Las mesas por liberarse ya están pagas.</p>
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
      {!tables ? !error && <p role="status" className="mt-3 text-sm text-stone-600">Cargando mesas…</p> : (
        <>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs" aria-label="Resumen">
            {ORDER.filter((state) => counts.get(state)).map((state) => (
              <li key={state} className={`rounded-full border px-2.5 py-1 font-semibold ${STATE[state].tone}`}>
                {STATE[state].label}: {counts.get(state)}
              </li>
            ))}
          </ul>
          {zones.map((zone) => (
            <div key={zone} className="mt-4">
              {zones.length > 1 && <h3 className="mb-2 text-sm font-bold text-stone-700">{zone}</h3>}
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                {tables.filter((table) => (table.zone ?? "Salón") === zone).map((table) => (
                  <li key={table.id} className={`rounded-xl border-2 p-2.5 ${STATE[table.state].tone}`}>
                    <p className="text-lg font-bold leading-none">Mesa {table.tableNum}</p>
                    <p className="mt-1 text-xs font-semibold">{STATE[table.state].label}</p>
                    <p className="mt-0.5 text-[0.7rem] opacity-80">
                      {table.minutes !== null ? `${since(table.minutes)} · ${table.partySize ?? "?"} pers.` : `${table.ability} lugares`}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
