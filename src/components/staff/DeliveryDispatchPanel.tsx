"use client";

import {
  assignDeliveryOrder,
  getOpsLookups,
  listOpsResource,
  updateDeliveryAssignmentStatus,
  updateOpsResource,
  type LookupOption,
  type OpsLookupMap,
} from "@/actions/advanced/advanced-actions";
import type { IOrder } from "@/interfaces";
import { formatARS } from "@/lib/format";
import { getOrderItemName, orderCustomerName, orderStateLabel } from "@/lib/order-utils";
import { Bike, CheckCircle, PackageCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DeliveryAssignment = {
  id?: number;
  orderId: number;
  courierId?: number | null;
  deliveryZoneId?: number | null;
  status: "pending" | "assigned" | "picked_up" | "delivered" | "failed";
  trackingCode?: string;
  cost?: number;
};

function findOption(options: LookupOption[] | undefined, value?: number | null) {
  if (!value) return null;
  return options?.find((option) => option.value === String(value)) || null;
}

export default function DeliveryDispatchPanel({
  initialOrders,
  title = "Pedidos delivery listos",
}: {
  initialOrders: IOrder[];
  title?: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [lookups, setLookups] = useState<OpsLookupMap>({});
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [courierByOrder, setCourierByOrder] = useState<Record<number, string>>({});
  const [zoneByOrder, setZoneByOrder] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState<number | null>(null);

  const deliveryOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.deliveryType === "delivery" &&
          !order.cancelledAt &&
          ["ready", "on_the_way"].includes(order.state)
      ),
    [orders]
  );

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    getOpsLookups().then(setLookups).catch(() => setLookups({}));
    listOpsResource<DeliveryAssignment>("deliveryAssignments")
      .then((rows) => setAssignments(rows))
      .catch(() => setAssignments([]));
  }, []);

  const assignmentFor = (orderId: number) => assignments.find((assignment) => Number(assignment.orderId) === orderId);

  const assign = async (order: IOrder) => {
    const courierId = Number(courierByOrder[order.id] || order.courierId || 0) || null;
    const deliveryZoneId = Number(zoneByOrder[order.id] || order.deliveryZoneId || 0) || null;
    setLoadingOrder(order.id);
    setMessage(null);
    try {
      const existing = assignmentFor(order.id);
      const payload = {
        orderId: order.id,
        courierId,
        deliveryZoneId,
        status: "assigned",
        trackingCode: order.trackingCode || `DEL-${order.id}-${Date.now()}`,
        cost: 0,
      };
      if (existing?.id) {
        const updated = await updateOpsResource<DeliveryAssignment>("deliveryAssignments", existing.id, payload);
        setAssignments((current) => current.map((item) => (item.id === existing.id ? updated : item)));
      } else {
        const created = await assignDeliveryOrder<DeliveryAssignment>(payload);
        setAssignments((current) => [created, ...current]);
      }
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? {
                ...item,
                state: "on_the_way",
                courierId,
                deliveryZoneId,
                trackingCode: payload.trackingCode,
                trackingStatus: "assigned",
              }
            : item
        )
      );
      setMessage(`Pedido #${order.id} asignado para delivery.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo asignar el delivery.");
    } finally {
      setLoadingOrder(null);
    }
  };

  const updateTracking = async (assignment: DeliveryAssignment, status: DeliveryAssignment["status"], orderId: number) => {
    if (!assignment.id) return;
    setLoadingOrder(orderId);
    try {
      const updated = await updateDeliveryAssignmentStatus<DeliveryAssignment>(assignment.id, status);
      setAssignments((current) => current.map((item) => (item.id === assignment.id ? updated : item)));
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                state: status === "delivered" ? "delivered" : status === "failed" ? "ready" : "on_the_way",
                trackingStatus: status,
              }
            : order
        )
      );
      setMessage(status === "delivered" ? "Entrega confirmada." : "Tracking actualizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar el envio.");
    } finally {
      setLoadingOrder(null);
    }
  };

  return (
    <section className="staff-panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-950">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Asigna zona, repartidor y confirma salida o entrega de pedidos preparados.
          </p>
        </div>
        <Bike className="h-5 w-5 text-primario-700" />
      </div>

      <div className="mt-5 space-y-3">
        {deliveryOrders.map((order) => {
          const assignment = assignmentFor(order.id);
          const courier = findOption(lookups.couriers, assignment?.courierId || order.courierId);
          const zone = findOption(lookups.deliveryZones, assignment?.deliveryZoneId || order.deliveryZoneId);
          return (
            <article key={order.id} className="rounded-lg border border-stone-100 bg-stone-50 p-4">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                <div>
                  <p className="font-bold text-gray-950">Pedido #{order.id} - {orderCustomerName(order)}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.items?.map((item) => `${item.quantity}x ${getOrderItemName(item)}`).join(" | ") || "Sin detalle"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white px-2 py-1 font-semibold text-gray-700 ring-1 ring-stone-200">
                      {orderStateLabel[order.state]}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 font-semibold text-gray-700 ring-1 ring-stone-200">
                      {formatARS(order.total_amount)}
                    </span>
                    {assignment && (
                      <span className="rounded-full bg-green-50 px-2 py-1 font-semibold text-green-700 ring-1 ring-green-100">
                        {assignment.status}
                      </span>
                    )}
                  </div>
                  {(courier || zone) && (
                    <p className="mt-2 text-xs text-gray-500">
                      {courier ? `Repartidor: ${courier.label}. ` : ""}
                      {zone ? `Zona: ${zone.label}.` : ""}
                    </p>
                  )}
                </div>

                <div className="grid min-w-[280px] gap-2">
                  <select
                    value={courierByOrder[order.id] || String(assignment?.courierId || order.courierId || "")}
                    onChange={(event) => setCourierByOrder((current) => ({ ...current, [order.id]: event.target.value }))}
                    className="rounded-lg border bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar repartidor</option>
                    {(lookups.couriers || []).map((option) => (
                      <option key={option.value} value={option.value}>{option.hint ? `${option.label} - ${option.hint}` : option.label}</option>
                    ))}
                  </select>
                  <select
                    value={zoneByOrder[order.id] || String(assignment?.deliveryZoneId || order.deliveryZoneId || "")}
                    onChange={(event) => setZoneByOrder((current) => ({ ...current, [order.id]: event.target.value }))}
                    className="rounded-lg border bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar zona</option>
                    {(lookups.deliveryZones || []).map((option) => (
                      <option key={option.value} value={option.value}>{option.hint ? `${option.label} - ${option.hint}` : option.label}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => assign(order)}
                      disabled={loadingOrder === order.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-primario-600 px-3 py-2 text-xs font-bold text-white disabled:bg-gray-300"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      Asignar y enviar
                    </button>
                    {assignment && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateTracking(assignment, "picked_up", order.id)}
                          className="rounded-lg border px-3 py-2 text-xs font-bold text-gray-700"
                        >
                          Retirado
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTracking(assignment, "delivered", order.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-3 py-2 text-xs font-bold text-green-700"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Entregado
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {deliveryOrders.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
            No hay pedidos delivery listos para enviar.
          </div>
        )}
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-gray-700">
          {message}
        </div>
      )}
    </section>
  );
}
