"use server";

import axios from "axios";
import { cookies } from "next/headers";

const headers = async () => {
  const token = (await cookies()).get("token")?.value;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export type LookupKey =
  | "cashRegisters"
  | "combos"
  | "coupons"
  | "couriers"
  | "deliveryZones"
  | "inventory"
  | "menu"
  | "orderItems"
  | "orders"
  | "purchaseOrders"
  | "suppliers"
  | "tableSessions"
  | "tables"
  | "users";

export type LookupOption = {
  value: string;
  label: string;
  hint?: string;
};

export type OpsLookupMap = Partial<Record<LookupKey, LookupOption[]>>;

const readableAxiosError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return new Error(error.response?.data?.error || error.response?.data?.message || error.message || fallback);
  }
  return error instanceof Error ? error : new Error(fallback);
};

const option = (value: unknown, label: unknown, hint?: unknown): LookupOption => ({
  value: String(value ?? ""),
  label: String(label ?? value ?? ""),
  hint: hint === null || hint === undefined || hint === "" ? undefined : String(hint),
});

const fullName = (row: Record<string, unknown>) =>
  [row.firstName, row.lastName].filter(Boolean).join(" ").trim() || row.email || row.name || row.id;

export async function listOpsResource<T = unknown>(resource: string): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) return [];
  try {
    const response = await axios.get<T[]>(`${url}/ops/${resource}`, { headers: await headers() });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.message || "No se pudieron cargar los registros");
    }
    throw error;
  }
}

export async function getOpsLookups(): Promise<OpsLookupMap> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) return {};

  const authHeaders = await headers();
  const fetchJson = async <T = Record<string, unknown>>(path: string): Promise<T[]> => {
    try {
      const response = await axios.get<T[]>(`${url}${path}`, { headers: authHeaders });
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  };

  const [
    menu,
    inventory,
    tables,
    users,
    orders,
    orderItems,
    tableSessions,
    combos,
    suppliers,
    purchaseOrders,
    deliveryZones,
    couriers,
    cashRegisters,
    coupons,
  ] = await Promise.all([
    fetchJson("/menu"),
    fetchJson("/inventarios"),
    fetchJson("/tables"),
    fetchJson("/users"),
    fetchJson("/orders"),
    fetchJson("/order-items"),
    fetchJson("/table-sessions/active"),
    fetchJson("/ops/combos"),
    fetchJson("/ops/suppliers"),
    fetchJson("/ops/purchaseOrders"),
    fetchJson("/ops/deliveryZones"),
    fetchJson("/ops/couriers"),
    fetchJson("/ops/cashRegisters"),
    fetchJson("/ops/coupons"),
  ]);

  return {
    menu: menu.map((row) => option(row.id, row.nameDish, `${row.typeDish || "Plato"} - $${row.price || 0}`)),
    inventory: inventory.map((row) => option(row.id, row.name, `Stock ${row.amount ?? "-"} ${row.unit || ""}`.trim())),
    tables: tables.map((row) => option(row.id, `Mesa ${row.tableNum}`, `${row.ability || "-"} personas`)),
    users: users.map((row) => option(row.id, fullName(row), `${row.role || "Usuario"} - ${row.email || ""}`.trim())),
    orders: orders.map((row) => {
      const customer = row.customer as Record<string, unknown> | undefined;
      const customerName = customer ? fullName(customer) : row.customerId ? `Cliente #${row.customerId}` : "Sin cliente";
      return option(row.id, `Pedido #${row.id} - ${customerName}`, row.total_amount ? `$${row.total_amount}` : row.state);
    }),
    orderItems: orderItems.map((row) => {
      const menuRow = row.menu as Record<string, unknown> | undefined;
      const menuName = menuRow?.nameDish || row.menuName || `Plato #${row.menu_id || row.menuId || ""}`;
      return option(row.id, `${menuName}`, `Pedido #${row.order_id || row.orderId || "-"} - x${row.quantity || 1}`);
    }),
    tableSessions: tableSessions.map((row) => option(row.id, `Sesion mesa #${row.id}`, row.tableId ? `Mesa ${row.tableId}` : row.status)),
    combos: combos.map((row) => option(row.id, row.name, row.price ? `$${row.price}` : row.description)),
    suppliers: suppliers.map((row) => option(row.id, row.name, row.phone || row.email)),
    purchaseOrders: purchaseOrders.map((row) => option(row.id, `Orden de compra #${row.id}`, row.total ? `$${row.total}` : row.status)),
    deliveryZones: deliveryZones.map((row) => option(row.id, row.name, row.cost ? `$${row.cost}` : row.active ? "Activa" : "Inactiva")),
    couriers: couriers.map((row) => option(row.id, row.name, `${row.vehicle || "Repartidor"} - ${row.status || ""}`.trim())),
    cashRegisters: cashRegisters.map((row) => option(row.id, `Caja #${row.id}`, row.status || row.openingAmount)),
    coupons: coupons.map((row) => option(row.id, row.code, row.description || `${row.value || 0}`)),
  };
}

export async function createOpsResource<T = unknown>(resource: string, payload: Record<string, unknown>): Promise<T> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  try {
    const response = await axios.post<T>(`${url}/ops/${resource}`, payload, { headers: await headers() });
    return response.data;
  } catch (error) {
    throw readableAxiosError(error, "No se pudo crear el registro");
  }
}

export async function updateOpsResource<T = unknown>(resource: string, id: number, payload: Record<string, unknown>): Promise<T> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  try {
    const response = await axios.put<T>(`${url}/ops/${resource}/${id}`, payload, { headers: await headers() });
    return response.data;
  } catch (error) {
    throw readableAxiosError(error, "No se pudo actualizar el registro");
  }
}

export async function deleteOpsResource(resource: string, id: number): Promise<{ ok: boolean }> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  try {
    const response = await axios.delete<{ ok: boolean }>(`${url}/ops/${resource}/${id}`, { headers: await headers() });
    return response.data;
  } catch (error) {
    throw readableAxiosError(error, "No se pudo eliminar el registro");
  }
}

export async function updateKitchenItemState(itemId: number, payload: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  try {
    const response = await axios.put(`${url}/kitchen/order-items/${itemId}/state`, payload, { headers: await headers() });
    return response.data;
  } catch (error) {
    throw readableAxiosError(error, "No se pudo actualizar el plato");
  }
}

export async function reportMissingIngredient(payload: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  const response = await axios.post(`${url}/kitchen/missing-ingredients`, payload, { headers: await headers() });
  return response.data;
}

export async function createIntegrationIntent(provider: string, payload: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  const response = await axios.post(`${url}/integrations/${provider}/intent`, payload, { headers: await headers() });
  return response.data;
}

export async function assignDeliveryOrder<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  try {
    const response = await axios.post<T>(`${url}/delivery/assignments`, payload, { headers: await headers() });
    return response.data;
  } catch (error) {
    throw readableAxiosError(error, "No se pudo asignar el delivery");
  }
}

export async function updateDeliveryAssignmentStatus<T = unknown>(
  assignmentId: number,
  status: "pending" | "assigned" | "picked_up" | "delivered" | "failed"
): Promise<T> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  try {
    const response = await axios.put<T>(
      `${url}/delivery/assignments/${assignmentId}/status`,
      { status },
      { headers: await headers() }
    );
    return response.data;
  } catch (error) {
    throw readableAxiosError(error, "No se pudo actualizar el estado del delivery");
  }
}

export async function getAdvancedReport(period: "day" | "week" | "month" = "day") {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) return null;
  const response = await axios.get(`${url}/reports/advanced?period=${period}`, { headers: await headers() });
  return response.data;
}

export async function closeCashRegister(registerId: number, payload: Record<string, unknown>) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  try {
    const response = await axios.post(`${url}/finance/cash-registers/${registerId}/close`, payload, {
      headers: await headers(),
    });
    return response.data;
  } catch (error) {
    throw readableAxiosError(error, "No se pudo cerrar la caja");
  }
}
