"use client";

import {
  getServiceMetrics, setMenuService, setTableZone, type ServiceMetrics,
} from "@/actions/service/service-actions";
import type { IMenu } from "@/interfaces";
import type { Table } from "@/interfaces/reservation.interface";
import { formatARS } from "@/lib/format";
import { useCallback, useEffect, useState } from "react";

const ALLERGENS = [
  ["gluten", "Gluten"], ["lactosa", "Lactosa"], ["huevo", "Huevo"], ["frutos_secos", "Frutos secos"], ["mani", "Maní"],
  ["soja", "Soja"], ["pescado", "Pescado"], ["mariscos", "Mariscos"], ["sesamo", "Sésamo"], ["carne", "Carne"],
] as const;
const CHANNEL: Record<string, string> = {
  salon: "Salón (mozo)", qr: "Mesa por QR", online: "Retiro online", delivery: "Delivery propio", pedidosya: "PedidosYa", rappi: "Rappi",
};

type MenuWithService = IMenu & { allergens?: string | string[] | null; prepMinutes?: number | null };
const parseAllergens = (value: MenuWithService["allergens"]): string[] => {
  if (Array.isArray(value)) return value;
  try { return value ? JSON.parse(value) : []; } catch { return []; }
};
const minutes = (value: number | null | undefined) => (value === null || value === undefined ? "Sin datos" : `${value} min`);

export default function ServiceInsights({ menu, tables }: { menu: IMenu[]; tables: Table[] }) {
  const [days, setDays] = useState(30);
  const [metrics, setMetrics] = useState<ServiceMetrics | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [drafts, setDrafts] = useState<Record<number, { allergens: string[]; prep: string }>>(() =>
    Object.fromEntries((menu as MenuWithService[]).map((dish) => [dish.id, {
      allergens: parseAllergens(dish.allergens), prep: dish.prepMinutes ? String(dish.prepMinutes) : "",
    }])));
  const [zones, setZones] = useState<Record<number, string>>(() =>
    Object.fromEntries(tables.map((table) => [table.id, (table as Table & { zone?: string | null }).zone ?? ""])));
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMetrics(await getServiceMetrics(days));
      setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudieron calcular las métricas.");
    }
  }, [days]);
  useEffect(() => { void load(); }, [load]);

  async function saveDish(id: number) {
    const draft = drafts[id];
    setSaving(`dish-${id}`);
    setNotice("");
    try {
      await setMenuService(id, draft.allergens, draft.prep ? Number(draft.prep) : null);
      setNotice("Plato actualizado.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo guardar el plato.");
    } finally {
      setSaving(null);
    }
  }

  async function saveZone(id: number) {
    setSaving(`table-${id}`);
    setNotice("");
    try {
      await setTableZone(id, zones[id] ?? "");
      setNotice("Sector guardado.");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo guardar el sector.");
    } finally {
      setSaving(null);
    }
  }

  const totalRevenue = metrics?.channels.reduce((sum, channel) => sum + channel.revenue, 0) ?? 0;

  return (
    <div className="space-y-5">
      <section className="staff-panel p-4 sm:p-6" aria-labelledby="servicio-titulo">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="servicio-titulo" className="text-xl font-bold text-gray-950">Tiempos del servicio</h2>
            <p className="text-sm text-stone-600">Cuánto tarda cada paso, de que se sientan a que pagan.</p>
          </div>
          <div className="flex gap-2" role="group" aria-label="Período">
            {[7, 30, 90].map((value) => (
              <button key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)}
                className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${days === value ? "border-[#17336d] bg-[#17336d] text-white" : "border-stone-300 bg-white"}`}>
                {value} días
              </button>
            ))}
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm font-semibold text-green-800">{notice}</p>}
        {!metrics ? !error && <p role="status" className="mt-4 text-sm text-stone-600">Calculando…</p> : (
          <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6">
            {([
              ["Sentarse → pedir", metrics.averages.seatToOrder],
              ["Pedido → listo", metrics.averages.orderToReady],
              ["Listo → en la mesa", metrics.averages.readyToServed],
              ["Pedir cuenta → pagado", metrics.averages.billToPaid],
              ["Llamado → atención", metrics.averages.callToAttention ?? null],
              ["Permanencia", metrics.averages.stay],
            ] as const).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-stone-50 p-3">
                <dt className="text-sm text-stone-600">{label}</dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-[#17336d]">{minutes(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {metrics?.pilot && metrics.previous && (
        <section className="staff-panel overflow-x-auto p-4 sm:p-6" aria-labelledby="piloto-titulo">
          <h2 id="piloto-titulo" className="text-xl font-bold text-gray-950">Piloto: los tres tiempos clave</h2>
          <p className="text-sm text-stone-600">
            Compará el período actual con el anterior (línea de base) y las mesas que pidieron por QR con las que pidieron con el mozo.
            Para un piloto, medí primero un período sin las funciones nuevas.
          </p>
          <table className="mt-3 w-full min-w-[36rem] text-left text-sm">
            <thead className="text-stone-600">
              <tr><th className="py-2">Tiempo</th><th>Período anterior</th><th>Este período</th><th>Mesas con QR</th><th>Mesas con mozo</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {([
                ["Llegada → primer pedido", metrics.previous.seatToOrder, metrics.pilot.seatToOrder, metrics.pilot.qr.seatToOrder, metrics.pilot.mozo.seatToOrder],
                ["Plato listo → servido", metrics.previous.readyToServed, metrics.pilot.readyToServed, metrics.pilot.qr.readyToServed, metrics.pilot.mozo.readyToServed],
                ["Llamado → atención", metrics.previous.callToAttention, metrics.pilot.callToAttention, null, null],
              ] as const).map(([label, before, now, qr, mozo]) => (
                <tr key={label}>
                  <td className="py-2 font-semibold">{label}</td>
                  <td className="tabular-nums">{minutes(before)}</td>
                  <td className={`tabular-nums font-semibold ${before !== null && now !== null ? (now < before ? "text-green-800" : now > before ? "text-red-700" : "") : ""}`}>{minutes(now)}</td>
                  <td className="tabular-nums">{label === "Llamado → atención" ? "—" : minutes(qr)}</td>
                  <td className="tabular-nums">{label === "Llamado → atención" ? "—" : minutes(mozo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-stone-500">
            Mesas: {metrics.pilot.sessions} este período ({metrics.pilot.qr.sessions} con QR, {metrics.pilot.mozo.sessions} con mozo) · {metrics.previous.sessions} el período anterior.
          </p>
        </section>
      )}

      {metrics && (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className="staff-panel overflow-x-auto p-4 sm:p-6" aria-labelledby="platos-servicio">
            <h2 id="platos-servicio" className="text-xl font-bold text-gray-950">Platos: venta, cocina, opinión y ganancia</h2>
            <p className="text-sm text-stone-600">Margen bajo: menos de {metrics.minMargin} % sobre el precio, con el costo de la receta.</p>
            <table className="mt-3 w-full min-w-[40rem] text-left text-sm">
              <thead className="text-stone-600">
                <tr><th className="py-2">Plato</th><th>Vendidos</th><th>Cocina</th><th>Opinión</th><th>Costo</th><th>Margen</th></tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {metrics.dishes.map((dish) => (
                  <tr key={dish.menuId}>
                    <td className="py-2 font-semibold">{dish.name}</td>
                    <td className="tabular-nums">{dish.units}</td>
                    <td className="tabular-nums">{minutes(dish.orderToReady)}</td>
                    <td className="tabular-nums">{dish.likes || dish.dislikes ? `👍 ${dish.likes} · 👎 ${dish.dislikes}` : "—"}</td>
                    <td className="tabular-nums">{dish.cost === null ? "Sin receta" : formatARS(dish.cost)}</td>
                    <td className={`tabular-nums font-semibold ${dish.lowMargin ? "text-red-700" : ""}`}>
                      {dish.margin === null ? "—" : `${dish.margin} %`}{dish.lowMargin && " ⚠"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="space-y-5">
            <section className="staff-panel p-4 sm:p-6" aria-labelledby="mozos-servicio">
              <h2 id="mozos-servicio" className="text-xl font-bold text-gray-950">Mozos</h2>
              {metrics.waiters.length === 0 ? <p className="mt-2 text-sm text-stone-600">Sin mesas en el período.</p> : (
                <ul className="mt-3 divide-y divide-stone-200 text-sm">
                  {metrics.waiters.map((waiter) => (
                    <li key={waiter.waiterId} className="flex items-center justify-between py-2">
                      <span className="font-semibold">{waiter.name}</span>
                      <span className="text-stone-600">{waiter.tables} mesas · plato a la mesa en {minutes(waiter.readyToServed)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="staff-panel p-4 sm:p-6" aria-labelledby="canales-servicio">
              <h2 id="canales-servicio" className="text-xl font-bold text-gray-950">Canales de venta</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {metrics.channels.map((channel) => (
                  <li key={channel.channel}>
                    <div className="flex justify-between"><span className="font-semibold">{CHANNEL[channel.channel] ?? channel.channel}</span>
                      <span className="tabular-nums">{formatARS(channel.revenue)} · {channel.orders} pedidos</span></div>
                    <div className="mt-1 h-2 rounded-full bg-stone-100">
                      <div className="h-2 rounded-full bg-[#17336d]" style={{ width: `${totalRevenue ? Math.round((channel.revenue / totalRevenue) * 100) : 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-stone-500">PedidosYa y Rappi aparecen cuando se conecten sus integraciones.</p>
            </section>
          </div>
        </div>
      )}

      <section className="staff-panel p-4 sm:p-6" aria-labelledby="alergenos-titulo">
        <h2 id="alergenos-titulo" className="text-xl font-bold text-gray-950">Alérgenos y tiempo de cada plato</h2>
        <p className="text-sm text-stone-600">La mesa avisa a quien tiene restricciones y cocina coordina la salida con estos tiempos.</p>
        <ul className="mt-4 space-y-3">
          {menu.map((dish) => {
            const draft = drafts[dish.id] ?? { allergens: [], prep: "" };
            return (
              <li key={dish.id} className="rounded-xl border border-stone-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{dish.nameDish}</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">Minutos
                      <input type="number" min={1} max={240} value={draft.prep} placeholder="auto"
                        onChange={(event) => setDrafts({ ...drafts, [dish.id]: { ...draft, prep: event.target.value } })}
                        className="min-h-11 w-20 rounded-lg border border-stone-300 px-2" />
                    </label>
                    <button type="button" disabled={saving !== null} onClick={() => saveDish(dish.id)} className="staff-control">
                      {saving === `dish-${dish.id}` ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ALLERGENS.map(([key, label]) => {
                    const active = draft.allergens.includes(key);
                    return (
                      <button key={key} type="button" aria-pressed={active}
                        onClick={() => setDrafts({ ...drafts, [dish.id]: { ...draft, allergens: active ? draft.allergens.filter((item) => item !== key) : [...draft.allergens, key] } })}
                        className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${active ? "border-amber-500 bg-amber-100 text-amber-950" : "border-stone-300 bg-white text-stone-600"}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="staff-panel p-4 sm:p-6" aria-labelledby="sectores-titulo">
        <h2 id="sectores-titulo" className="text-xl font-bold text-gray-950">Sectores del salón</h2>
        <p className="text-sm text-stone-600">Cada mozo filtra sus mesas por sector desde el celular.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <li key={table.id} className="flex items-center gap-2 rounded-xl border border-stone-200 p-2">
              <span className="w-20 font-semibold">Mesa {table.tableNum}</span>
              <input value={zones[table.id] ?? ""} placeholder="Ej.: Terraza" maxLength={40}
                aria-label={`Sector de la mesa ${table.tableNum}`}
                onChange={(event) => setZones({ ...zones, [table.id]: event.target.value })}
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-stone-300 px-2" />
              <button type="button" disabled={saving !== null} onClick={() => saveZone(table.id)} className="staff-control">
                {saving === `table-${table.id}` ? "…" : "Guardar"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
