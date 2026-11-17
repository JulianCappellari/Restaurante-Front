"use client";

import StaffHeader from "@/components/staff/StaffHeader";

import { getAllOrders } from "@/actions/orders/get-all-orders";
import { updateOrderState } from "@/actions/orders/put-order-state";
import { reportMissingIngredient, updateKitchenItemState } from "@/actions/advanced/advanced-actions";
import type { IOrder, OrderState } from "@/interfaces";
import { formatARS } from "@/lib/format";
import { genericStatusLabel, kitchenItemStateLabel, stationLabel } from "@/lib/labels";
import {
  getCustomizationDetails,
  getOrderItemName,
  orderServiceLabel,
  orderStateLabel,
  orderSummaryName,
  orderTableLabel,
} from "@/lib/order-utils";
import { AlertTriangle, Check, ClipboardList, Flame, Inbox, Loader2, PauseCircle, RefreshCcw, X } from "lucide-react";
import { fireNextCourse, getPrepForecast, reportItemShortage, type PrepForecast } from "@/actions/service/service-actions";
import RadarStrip from "./RadarStrip";

/** Campos de servicio que el backend agrega a cada plato. */
type KitchenItemExtras = {
  held?: boolean;
  course?: string | null;
  allergyAlert?: string | null;
  needsChange?: boolean;
  menu?: { typeDish?: string; prepMinutes?: number | null } | null;
};
const DEFAULT_PREP: Record<string, number> = {
  Entrada: 8, Ensalada: 6, "Plato Principal": 18, Guarnicion: 10, Postre: 5, Bebida: 1,
};
const prepOf = (item: KitchenItemExtras) =>
  Number(item.menu?.prepMinutes) > 0 ? Number(item.menu?.prepMinutes) : DEFAULT_PREP[item.menu?.typeDish ?? ""] ?? 10;
const extras = (item: unknown) => item as KitchenItemExtras;
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRealtime } from "@/hooks/realtime/useRealtime";

type Props = {
  initialOrders: IOrder[];
};

type Stage = "received" | "preparing" | "ready";

const stages: Array<{ state: Stage; icon: typeof Inbox; empty: string; tone: string }> = [
  { state: "received", icon: Inbox, empty: "Sin comandas nuevas.", tone: "amber" },
  { state: "preparing", icon: Flame, empty: "Nada en preparación.", tone: "blue" },
  { state: "ready", icon: Check, empty: "Nada listo para retirar.", tone: "green" },
];

const shortLabel: Record<Stage, string> = { received: "Nuevos", preparing: "Cocinando", ready: "Listos" };

const laneStyle: Record<string, string> = {
  amber: "border-amber-200 bg-amber-50/70",
  blue: "border-[#c7d6f0] bg-[#eaf0fa]/70",
  green: "border-green-200 bg-green-50/70",
};

const tabStyle: Record<string, string> = {
  amber: "data-[on=true]:bg-amber-500 data-[on=true]:text-white",
  blue: "data-[on=true]:bg-[#17336d] data-[on=true]:text-white",
  green: "data-[on=true]:bg-green-700 data-[on=true]:text-white",
};

function elapsedMinutes(date: string | Date | undefined, now: number) {
  if (!date) return 0;
  const started = new Date(date).getTime();
  return Number.isFinite(started) ? Math.max(0, Math.floor((now - started) / 60000)) : 0;
}

function formatElapsed(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  const days = Math.floor(minutes / (60 * 24));
  return `${days} ${days === 1 ? "día" : "días"}`;
}

function urgencyClass(minutes: number) {
  if (minutes >= 20) return "bg-red-600 text-white";
  if (minutes >= 10) return "bg-amber-400 text-amber-950";
  return "bg-stone-200 text-stone-800";
}

export default function KitchenBoard({ initialOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [loadingOrder, setLoadingOrder] = useState<number | null>(null);
  const [busyItem, setBusyItem] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("received");
  const [now, setNow] = useState(() => Date.now());
  const seenIds = useRef<Set<number> | null>(null);
  const [freshIds, setFreshIds] = useState<Set<number>>(() => new Set());
  const [station, setStation] = useState("all");
  const [prep, setPrep] = useState<PrepForecast | null>(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [prepError, setPrepError] = useState("");

  async function togglePrep() {
    if (prepOpen) return setPrepOpen(false);
    setPrepOpen(true);
    setPrepError("");
    try {
      setPrep(await getPrepForecast());
    } catch (problem) {
      setPrepError(problem instanceof Error ? problem.message : "No se pudo calcular la preparación.");
    }
  }

  async function fireSession(sessionId: number | null | undefined) {
    if (!sessionId) return;
    setError(null);
    try {
      const result = await fireNextCourse(sessionId);
      setMessage(result.released ? `Marchado: ${result.released} ${result.released === 1 ? "plato" : "platos"} del siguiente tiempo.` : "No había platos en espera.");
      refresh();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo marchar el siguiente tiempo.");
    }
  }

  const refresh = () => {
    startTransition(async () => {
      const fresh = await getAllOrders();
      setOrders(fresh);
    });
  };

  const realtimeHandlers = useMemo(
    () => ({
      order_created: () => refresh(),
      order_updated: () => refresh(),
      order_cancelled: () => refresh(),
      kitchen_item_updated: () => refresh(),
    }),
    []
  );
  useRealtime("chef", realtimeHandlers);

  useEffect(() => {
    const poll = window.setInterval(refresh, 15000);
    const clock = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, []);

  const activeOrders = useMemo(
    () => orders
      .filter((order) => order.state !== "delivered" && !order.cancelledAt)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [orders]
  );

  // Comandas que llegan mientras la pantalla está abierta: se resaltan 12 segundos.
  useEffect(() => {
    const ids = orders.map((order) => order.id);
    if (!seenIds.current) { seenIds.current = new Set(ids); return; }
    const added = ids.filter((id) => !seenIds.current?.has(id));
    ids.forEach((id) => seenIds.current?.add(id));
    if (!added.length) return;
    setFreshIds((current) => new Set([...current, ...added]));
    window.setTimeout(() => setFreshIds((current) => {
      const next = new Set(current);
      added.forEach((id) => next.delete(id));
      return next;
    }), 12000);
  }, [orders]);

  // La pestaña del navegador muestra cuántas comandas nuevas esperan.
  useEffect(() => {
    const waiting = activeOrders.filter((order) => order.state === "received").length;
    document.title = waiting ? `(${waiting}) Comandas de cocina` : "Comandas de cocina";
  }, [activeOrders]);

  const countFor = (state: Stage) => activeOrders.filter((order) => order.state === state).length;
  const stations = [...new Set(activeOrders.flatMap((order) => (order.items ?? []).map((item) => item.station || "kitchen")))];

  const nextState: Partial<Record<OrderState, OrderState>> = { received: "preparing", preparing: "ready" };

  const moveState = async (order: IOrder) => {
    const next = nextState[order.state];
    if (!next) return;
    if (next === "ready" && !order.items?.every((item) => ["ready", "delivered"].includes(item.state || "received"))) {
      setMessage("Para pasar el pedido a listo, marcá todos los platos listos o usá «Todo listo».");
      return;
    }
    setLoadingOrder(order.id);
    setError(null);
    try {
      await updateOrderState(order.id, next);
      setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, state: next } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el pedido.");
    } finally {
      setLoadingOrder(null);
    }
  };

  const moveItemState = async (itemId: number, state: "preparing" | "ready") => {
    setError(null);
    setBusyItem(itemId);
    try {
      await updateKitchenItemState(itemId, { state });
      if (state === "ready") setMessage("Plato marcado como listo.");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el plato.");
    } finally {
      setBusyItem(null);
    }
  };

  const markFullOrderReady = async (order: IOrder) => {
    setLoadingOrder(order.id);
    setError(null);
    try {
      await Promise.all(
        (order.items || [])
          .filter((item) => !["ready", "delivered"].includes(item.state || "received"))
          .map((item) => updateKitchenItemState(item.id, { state: "ready" }))
      );
      await updateOrderState(order.id, "ready");
      setMessage(`Pedido #${order.id} completo y listo.`);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar el pedido.");
    } finally {
      setLoadingOrder(null);
    }
  };

  const notifyMissing = async (orderId: number, itemId: number, itemName: string, menuId?: number) => {
    setError(null);
    if (!window.confirm(`¿No se puede preparar ${itemName}? Se avisará al salón para ofrecer un cambio y el plato se pausará en la carta.`)) return;
    try {
      const result = await reportItemShortage(itemId);
      await reportMissingIngredient({
        orderItemId: itemId, menuId, message: `Ingrediente faltante para ${itemName} del pedido #${orderId}`,
      }).catch(() => undefined);
      setMessage(`${itemName}: ${result.affected} ${result.affected === 1 ? "pedido afectado" : "pedidos afectados"}. El salón ofrece un cambio y el plato quedó pausado en la carta.`);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo informar el ingrediente faltante.");
    }
  };

  return (
    <div className="staff-shell kitchen-screen">
      <StaffHeader area="chef" title="Comandas de cocina" description="Pedidos por orden de llegada. Marcá cada plato cuando empiece y cuando salga.">
        <button type="button" onClick={refresh} disabled={isPending} className="staff-control">
          {isPending ? <Loader2 aria-hidden className="size-4 motion-safe:animate-spin" /> : <RefreshCcw aria-hidden className="size-4" />}
          {isPending ? "Actualizando…" : "Actualizar"}
        </button>
        <button type="button" onClick={togglePrep} aria-expanded={prepOpen} className="staff-control">
          <ClipboardList aria-hidden className="size-4" /> Preparación del día
        </button>
      </StaffHeader>

      <div className="mb-4"><RadarStrip role="chef" title="Atención en cocina" /></div>

      {prepOpen && (
        <section aria-labelledby="prep-title" className="staff-panel mb-5 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="prep-title" className="text-xl font-bold text-stone-950">Preparación sugerida para hoy</h2>
              {prep && <p className="text-sm text-stone-600">Según la demanda de {prep.basedOn}, con un 10 % de margen.</p>}
            </div>
            <button type="button" aria-label="Cerrar preparación" onClick={() => setPrepOpen(false)} className="staff-control"><X aria-hidden className="size-4" /></button>
          </div>
          {prepError && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{prepError}</p>}
          {!prep && !prepError && <p role="status" className="mt-3 text-sm text-stone-600">Calculando…</p>}
          {prep && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold text-stone-800">Porciones</h3>
                {prep.items.length === 0 ? <p className="mt-2 text-sm text-stone-600">Todavía no hay historial suficiente.</p> : (
                  <ul className="mt-2 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
                    {prep.items.map((item) => (
                      <li key={item.menuId} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span>{item.name}</span>
                        <span className="font-bold tabular-nums">{item.suggested} <span className="font-normal text-stone-500">(prom. {item.average})</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-800">Insumos necesarios</h3>
                {prep.ingredients.length === 0 ? <p className="mt-2 text-sm text-stone-600">Los platos sugeridos no tienen receta cargada.</p> : (
                  <ul className="mt-2 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
                    {prep.ingredients.map((row) => (
                      <li key={row.inventoryId} className={`flex items-center justify-between px-3 py-2 text-sm ${row.short ? "bg-red-50" : ""}`}>
                        <span>{row.name}</span>
                        <span className="tabular-nums">
                          {row.need} {row.unit} · hay {row.have}
                          {row.short && <strong className="ml-1 text-red-700">falta</strong>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {message && (
        <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">
          {message}
          <button type="button" onClick={() => setMessage(null)} className="min-h-11 px-2 underline">Cerrar</button>
        </div>
      )}
      {error && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" /> {error}
        </div>
      )}

      {/* Pantalla por estación: cada puesto ve solo lo suyo. */}
      {stations.length > 1 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Estación">
          {["all", ...stations].map((value) => (
            <button key={value} type="button" aria-pressed={station === value} onClick={() => setStation(value)}
              className={`customer-press min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${station === value ? "border-[#17336d] bg-[#17336d] text-white" : "border-stone-300 bg-white text-stone-700"}`}>
              {value === "all" ? "Todas las estaciones" : stationLabel[value] || value}
            </button>
          ))}
        </div>
      )}

      {/* Pestañas por estado: en celular y tablet se ve una columna a la vez. */}
      <div role="tablist" aria-label="Estados de comandas" className="sticky top-16 z-10 -mx-1 mb-4 grid grid-cols-3 gap-2 bg-[#f2f5f8]/95 px-1 py-2 backdrop-blur lg:hidden">
        {stages.map(({ state, icon: Icon, tone }) => (
          <button
            key={state}
            type="button"
            role="tab"
            aria-selected={stage === state}
            data-on={stage === state}
            onClick={() => setStage(state)}
            className={`customer-press flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border bg-white text-sm font-bold text-stone-800 ${tabStyle[tone]}`}
          >
            <span className="flex items-center gap-1.5"><Icon aria-hidden className="size-4" />{shortLabel[state]}</span>
            <span className="text-lg tabular-nums">{countFor(state)}</span>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        {stages.map(({ state, icon: Icon, empty, tone }) => {
          const columnOrders = activeOrders.filter((order) => order.state === state && (station === "all"
            || (order.items ?? []).some((item) => !extras(item).held && (item.station || "kitchen") === station)));
          return (
            <section
              key={state}
              data-stage={state}
              className={`${stage === state ? "block" : "hidden"} rounded-2xl border p-3 lg:block ${laneStyle[tone]}`}
            >
              <h2 className="mb-3 flex items-center gap-2 px-1 text-lg font-bold text-stone-900">
                <Icon aria-hidden className="size-5" />
                {state === "preparing" ? "En preparación" : orderStateLabel[state]}
                <span className="ml-auto rounded-lg bg-white px-2.5 py-0.5 text-sm tabular-nums ring-1 ring-stone-200">{columnOrders.length}</span>
              </h2>

              <div className="space-y-3">
                {columnOrders.map((order) => {
                  const minutes = elapsedMinutes(order.date, now);
                  const allItemsReady = order.items?.every((item) => item.state === "ready" || item.state === "delivered");
                  const canAdvanceOrder = order.state === "received" || (order.state === "preparing" && allItemsReady);
                  const table = orderTableLabel(order);
                  const fired = (order.items ?? []).filter((item) => !extras(item).held);
                  const held = (order.items ?? []).filter((item) => extras(item).held);
                  const visible = fired.filter((item) => station === "all" || (item.station || "kitchen") === station);
                  const readyCount = fired.filter((item) => ["ready", "delivered"].includes(item.state || "received")).length;
                  // Salida conjunta: el plato más largo marca el ritmo de los demás del mismo tiempo.
                  const pending = fired.filter((item) => (item.state || "received") === "received");
                  const longestByCourse = new Map<string, number>();
                  const pendingByCourse = new Map<string, number>();
                  pending.forEach((item) => {
                    const course = extras(item).course ?? "principal";
                    longestByCourse.set(course, Math.max(longestByCourse.get(course) ?? 0, prepOf(extras(item))));
                    pendingByCourse.set(course, (pendingByCourse.get(course) ?? 0) + 1);
                  });
                  return (
                    <article key={order.id} className={`kitchen-card rounded-xl border bg-white p-4 shadow-sm ${freshIds.has(order.id) ? "is-fresh border-amber-400 ring-4 ring-amber-300/70" : "border-stone-200"}`}>
                      <header className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-500">#{order.id} · {order.deliveryType === "delivery" ? "Envío" : "Salón"}{freshIds.has(order.id) && <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-amber-950">Nueva</span>}</p>
                          <h3 className="mt-0.5 truncate text-2xl leading-tight text-stone-950">{table || orderServiceLabel(order)}</h3>
                          <p className="mt-0.5 truncate text-sm text-stone-600">{orderSummaryName(order)}</p>
                        </div>
                        <div className={`shrink-0 rounded-lg px-2.5 py-1.5 text-center text-sm font-bold tabular-nums ${urgencyClass(minutes)}`}>
                          {formatElapsed(minutes)}
                          <span className="block text-[0.7rem] font-semibold opacity-80">desde que llegó</span>
                        </div>
                      </header>

                      {fired.length > 1 && (
                        <p className={`mt-3 text-xs font-semibold ${readyCount === fired.length ? "text-green-800" : "text-stone-600"}`}>
                          {readyCount === fired.length ? "Completo para salir" : `${readyCount} de ${fired.length} platos listos`}
                        </p>
                      )}
                      <ul className="mt-3 space-y-2">
                        {visible.map((item) => {
                          const customizations = getCustomizationDetails(item);
                          const itemState = item.state || "received";
                          const done = itemState === "ready" || itemState === "delivered";
                          const service = extras(item);
                          const startIn = itemState === "received"
                            ? Math.max(0, (longestByCourse.get(service.course ?? "principal") ?? 0) - prepOf(service))
                            : 0;
                          return (
                            <li key={item.id} className={`rounded-lg border p-3 ${done ? "border-green-200 bg-green-50/60" : "border-stone-200 bg-stone-50"}`}>
                              <div className="flex items-start gap-3">
                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-stone-950 text-base font-bold text-white tabular-nums">{item.quantity}</span>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-base font-bold leading-snug ${done ? "text-stone-500 line-through" : "text-stone-950"}`}>{getOrderItemName(item)}</p>
                                  <p className="mt-0.5 text-xs text-stone-600">
                                    {kitchenItemStateLabel[itemState] || "Recibido"} · {stationLabel[item.station || "kitchen"] || "Cocina"} · {genericStatusLabel[item.priority || order.priority || "normal"]}
                                  </p>
                                </div>
                                <span className="shrink-0 text-sm font-semibold text-stone-700 tabular-nums">{formatARS(Number(item.price) * item.quantity)}</span>
                              </div>

                              {customizations.length > 0 && (
                                <ul className="mt-2 flex flex-wrap gap-1.5">
                                  {customizations.map((detail) => (
                                    <li key={detail} className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-stone-800 ring-1 ring-stone-200">{detail}</li>
                                  ))}
                                </ul>
                              )}
                              {item.notes && (
                                <p className="mt-2 rounded-md bg-amber-100 px-2.5 py-1.5 text-sm font-semibold text-amber-950">Nota: {item.notes}</p>
                              )}
                              {service.allergyAlert && (
                                <p className="mt-2 flex items-start gap-1.5 rounded-md bg-red-600 px-2.5 py-1.5 text-sm font-bold text-white" role="note">
                                  <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" /> {service.allergyAlert}
                                </p>
                              )}
                              {!done && itemState === "received" && (pendingByCourse.get(service.course ?? "principal") ?? 0) > 1 && (
                                <p className="mt-2 text-xs font-semibold text-[#17336d]">
                                  {startIn >= 2 ? `Empezar en ${startIn} min para que salga junto con la mesa` : "Empezar ya: es el que más tarda"}
                                </p>
                              )}

                              {service.needsChange && !done && (
                                <p className="mt-2 rounded-md bg-amber-100 px-2.5 py-1.5 text-sm font-bold text-amber-950">
                                  Falta un ingrediente: esperando que la mesa elija un cambio. No preparar.
                                </p>
                              )}
                              {!done && !service.needsChange && (
                                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                                  {itemState === "received" || !item.state ? (
                                    <button type="button" disabled={busyItem === item.id} onClick={() => moveItemState(item.id, "preparing")}
                                      className="customer-press min-h-12 rounded-lg border-2 border-[#17336d] bg-white px-3 font-bold text-[#17336d] disabled:opacity-60">
                                      Empezar plato
                                    </button>
                                  ) : null}
                                  <button type="button" disabled={busyItem === item.id} onClick={() => moveItemState(item.id, "ready")}
                                    className={`customer-press min-h-12 rounded-lg bg-green-700 px-3 font-bold text-white disabled:opacity-60 ${itemState === "received" || !item.state ? "" : "col-span-2"}`}>
                                    {busyItem === item.id ? "Guardando…" : "Plato listo"}
                                  </button>
                                </div>
                              )}
                              {!done && !service.needsChange && (
                                <button type="button" onClick={() => notifyMissing(order.id, item.id, getOrderItemName(item), item.menuId || item.menu_id)}
                                  className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-amber-800 underline underline-offset-4">
                                  <AlertTriangle aria-hidden className="size-3.5" /> Falta un ingrediente
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      {held.length > 0 && (
                        <div className="mt-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3">
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-stone-700">
                            <PauseCircle aria-hidden className="size-4" /> En espera de marcha: {held.map((item) => `${item.quantity}× ${getOrderItemName(item)}`).join(", ")}
                          </p>
                          <button type="button" onClick={() => fireSession(order.tableSessionId)}
                            className="customer-press mt-2 min-h-11 rounded-lg border border-[#17336d] bg-white px-3 text-sm font-semibold text-[#17336d]">
                            Marchar ya
                          </button>
                        </div>
                      )}

                      {order.state !== "ready" && (
                        <div className="mt-4 grid gap-2">
                          {canAdvanceOrder && (
                            <button type="button" disabled={loadingOrder === order.id} onClick={() => moveState(order)}
                              className="customer-press min-h-12 w-full rounded-lg bg-[#17336d] px-4 font-bold text-white disabled:opacity-60">
                              {loadingOrder === order.id ? "Actualizando…" : order.state === "received" ? "Empezar pedido" : "Pedido listo para servir"}
                            </button>
                          )}
                          {!allItemsReady && (
                            <button type="button" disabled={loadingOrder === order.id} onClick={() => markFullOrderReady(order)}
                              className="customer-press min-h-11 w-full rounded-lg border border-green-300 bg-green-50 px-4 font-semibold text-green-800 disabled:opacity-60">
                              Todo listo (marcar todos los platos)
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}

                {columnOrders.length === 0 && (
                  <div className="rounded-xl border border-dashed border-stone-300 bg-white/70 p-5 text-center text-sm text-stone-600">
                    {empty}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
