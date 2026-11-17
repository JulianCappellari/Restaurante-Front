"use client";

import { useMemo, useState } from "react";
import type { IOrder } from "@/interfaces";
import { Bike, ChevronDown, ClipboardList, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DishPhoto from "@/components/menu/DishPhoto";
import { useCartStore } from "@/store";
import { useRealtime } from "@/hooks/realtime/useRealtime";
import { formatARS } from "@/lib/format";
import { getCustomizationDetails, getOrderItemName, getOrderItemUnitPrice, orderSummaryName, orderTableLabel, toCartMenu } from "@/lib/order-utils";

const stages = {
  received: "Recibido",
  preparing: "En preparación",
  ready: "Listo",
  on_the_way: "En camino",
  delivered: "Entregado",
};

const orderDate = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeZone: "UTC" });
const orderDateTime = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires",
});

function formatOrderDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Fecha no disponible";
  return (/^\d{4}-\d{2}-\d{2}$/.test(value) ? orderDate : orderDateTime).format(date);
}

const inProgress = (order: IOrder) => !order.cancelledAt && order.state !== "delivered";

export default function OrdersClient({ orders, error }: { orders: IOrder[]; error: string | null }) {
  const [filter, setFilter] = useState<"all" | "current" | "history">("all");
  const [notice, setNotice] = useState<{ orderId: number; added: number; skipped: number } | null>(null);
  const router = useRouter();
  const refresh = useMemo(() => () => router.refresh(), [router]);
  const realtimeHandlers = useMemo(() => ({ order_updated: refresh, order_cancelled: refresh, order_refunded: refresh }), [refresh]);
  useRealtime("customer", realtimeHandlers);
  const addMenuToCart = useCartStore((state) => state.addMenuToCart);
  const count = orders.filter(inProgress).length;
  const filters = [
    { id: "all", label: "Todos", count: orders.length },
    { id: "current", label: "En curso", count },
    { id: "history", label: "Historial", count: orders.length - count },
  ] as const;
  const visible = orders.filter((order) => filter === "all" || (filter === "current" ? inProgress(order) : !inProgress(order)));

  function reorder(order: IOrder) {
    let added = 0;
    let skipped = 0;
    for (const item of order.items ?? []) {
      const product = toCartMenu(item);
      if (product && product.available !== false) {
        addMenuToCart(product);
        added += product.quantity;
      } else {
        skipped += item.quantity;
      }
    }
    setNotice({ orderId: order.id, added, skipped });
  }

  return (
    <div className="customer-shell py-6 sm:py-9">
      <header className="account-heading">
        <h1 data-split>Mis pedidos</h1>
        <p>Seguí tus pedidos en curso y consultá los anteriores.</p>
      </header>

      {error ? (
        <div className="account-empty" role="alert">
          <h2>{error}</h2>
          <button type="button" onClick={refresh} className="btn-outline customer-press mt-4 min-h-11">Volver a cargar</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="account-empty">
          <ClipboardList aria-hidden className="mb-3 size-7 text-cliente-blue" />
          <h2>Todavía no tenés pedidos</h2>
          <p>Los pedidos desde tu cuenta aparecen acá.</p>
          <Link href="/menu" className="btn-primary customer-press mt-4 min-h-11">Explorar la carta</Link>
        </div>
      ) : (
        <>
          <div aria-label="Filtrar pedidos" role="group" className="account-filters">
            {filters.map(({ id, label, count }) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                {label} <span>{count}</span>
              </button>
            ))}
          </div>
          {visible.length === 0 && (
            <div className="account-empty">
              <h2>{filter === "current" ? "No hay pedidos en curso" : "Todavía no hay pedidos en el historial"}</h2>
              <button type="button" onClick={() => setFilter("all")} className="btn-outline customer-press mt-4 min-h-11">Ver todos</button>
            </div>
          )}
          <div className="account-ledger">
            {visible.map((order) => {
              const delivery = order.deliveryType === "delivery";
              const status = order.cancelledAt ? "cancelled" : order.state;
              const label = order.cancelledAt ? "Cancelado" : stages[order.state] || "Estado pendiente";
              const itemCount = (order.items ?? []).reduce((total, item) => total + item.quantity, 0);
              const feedback = notice?.orderId === order.id ? notice : null;
              return (
                <article key={order.id} id={`pedido-${order.id}`} className="account-entry">
                  <div className="account-entry-top">
                    <div>
                      <p className="account-meta flex flex-wrap gap-x-2"><span>Pedido #{order.id}</span><span>{formatOrderDate(order.date)}</span></p>
                      <h2>{orderSummaryName(order)}</h2>
                    </div>
                    <span className="account-status" data-status={status}>{label}</span>
                  </div>
                  <div className="account-entry-foot">
                    <p className="account-meta flex items-center gap-2">
                      {delivery && <Bike aria-hidden className="size-4" />}
                      {delivery ? "Envío a domicilio" : (orderTableLabel(order) || "En el salón")}
                    </p>
                    <strong className="account-amount">{formatARS(order.total_amount)}</strong>
                  </div>
                  <details className="account-details">
                    <summary>Ver detalle{itemCount > 0 ? ` (${itemCount})` : ""}<ChevronDown aria-hidden className="size-4" /></summary>
                    {order.items?.length ? (
                      <ul className="divide-y divide-cliente-line">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex items-start gap-3 py-3">
                            <div className="relative size-11 shrink-0 overflow-hidden rounded-lg">
                              <DishPhoto src={item.imageUrl || item.menu?.imageUrl} sizes="44px" />
                            </div>
                            <div className="min-w-0 flex-1 break-words text-sm">
                              <p className="font-semibold">{item.quantity} × {getOrderItemName(item)}</p>
                              {getCustomizationDetails(item).map((option, index) => <p key={index} className="account-meta">{option}</p>)}
                              {item.notes && <p className="account-meta">{item.notes}</p>}
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums">{formatARS(getOrderItemUnitPrice(item) * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="account-meta py-3">El detalle de este pedido no está disponible.</p>}
                    <div className="flex flex-wrap items-center gap-3 pb-3">
                      <button type="button" className="btn-outline customer-press min-h-11" onClick={() => reorder(order)}>
                        <ShoppingBag aria-hidden className="size-4" /> Volver a pedir
                      </button>
                      {feedback?.added ? <Link href="/cart" className="inline-flex min-h-11 items-center text-sm font-semibold text-cliente-blue underline underline-offset-4">Ver carrito</Link> : null}
                    </div>
                    {feedback && <p className="account-meta pb-3" role="status">
                      {feedback.added > 0 ? `Agregamos ${feedback.added} ${feedback.added === 1 ? "unidad" : "unidades"} al carrito.` : "No pudimos agregar platos de este pedido."}
                      {feedback.added > 0 && feedback.skipped > 0 && " Algunos platos ya no están disponibles."}
                    </p>}
                  </details>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
