"use server";

import { cookies } from "next/headers";

/* Acciones de servidor para las funciones de servicio de punta a punta (/api/service del backend). */

async function serviceRequest<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("El servicio no está disponible.");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.auth !== false) {
    const token = (await cookies()).get("token")?.value;
    if (!token) throw new Error("Volvé a iniciar sesión.");
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${url.replace(/\/$/, "")}/${path}`, {
    method: init.method ?? "GET", headers, cache: "no-store", signal: AbortSignal.timeout(12_000),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "No se pudo completar la operación.");
  return payload as T;
}

const positive = (value: number, message: string) => {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(message);
};

export type FloorTable = {
  id: number; tableNum: number; ability: number; zone: string | null;
  state: "libre" | "reservada" | "mantenimiento" | "pidiendo" | "esperando" | "comiendo" | "cuenta" | "por-liberar";
  sessionId: number | null; minutes: number | null; partySize: number | null; total: number | null; paid: number | null;
};

export type MenuSignals = {
  soldOut: number[];
  pairings: Record<string, number[]>;
  dishes: Record<string, { allergens: string[]; prepMinutes: number; course: string }>;
};

export type ServiceMetrics = {
  days: number; minMargin: number;
  averages: { seatToOrder: number | null; orderToReady: number | null; readyToServed: number | null; billToPaid: number | null; stay: number | null; callToAttention?: number | null };
  pilot?: PilotAverages;
  previous?: PilotAverages;
  waiters: Array<{ waiterId: number; name: string; tables: number; readyToServed: number | null }>;
  dishes: Array<{ menuId: number; name: string; units: number; orderToReady: number | null; likes: number; dislikes: number; price: number; cost: number | null; margin: number | null; lowMargin: boolean }>;
  channels: Array<{ channel: string; orders: number; revenue: number }>;
};

type PilotGroup = { sessions: number; seatToOrder: number | null; readyToServed: number | null };
export type PilotAverages = PilotGroup & { callToAttention: number | null; qr: PilotGroup; mozo: PilotGroup };

export type PrepForecast = {
  weekday: number; basedOn: string;
  items: Array<{ menuId: number; name: string; average: number; suggested: number }>;
  ingredients: Array<{ inventoryId: number; name: string; unit: string; need: number; have: number; short: boolean }>;
};

export type WaitlistEntry = {
  id: number; name: string; phone: string | null; people: number; date: string; shift: "lunch" | "dinner";
  status: "waiting" | "notified" | "converted" | "cancelled"; createdAt?: string;
};

export const getFloor = async () => serviceRequest<FloorTable[]>("service/floor");
export const getMenuSignals = async () => serviceRequest<MenuSignals>("service/menu-signals", { auth: false });
export const getServiceMetrics = async (days = 30) => serviceRequest<ServiceMetrics>(`service/metrics?days=${Math.max(1, Math.min(365, Math.round(days)))}`);
export const getPrepForecast = async () => serviceRequest<PrepForecast>("service/prep-forecast");
type UsualDishes = { visits: number; dishes: Array<{ menuId: number; nameDish: string; price: number; imageUrl: string | null; times: number }> };
/** Platos más pedidos por el cliente con sesión. Sin sesión (o con otro rol) devuelve una lista vacía. */
export async function getUsualDishes(): Promise<UsualDishes> {
  if (!(await cookies()).get("token")?.value) return { visits: 0, dishes: [] };
  try {
    return await serviceRequest<UsualDishes>("service/usual");
  } catch {
    return { visits: 0, dishes: [] };
  }
}
export const getWaitlistEstimate = async (people: number) =>
  serviceRequest<{ minutes: number | null; averageStay: number; freeNow: boolean }>(`service/waitlist-estimate?people=${Math.max(1, Math.min(30, Math.round(people)))}`);

export async function confirmTablePayment(id: number) {
  positive(id, "Pago inválido.");
  return serviceRequest<{ confirmed: boolean; tableClosed: boolean }>(`service/payment-requests/${id}/confirm`, { method: "POST" });
}
export async function cancelTablePayment(id: number) {
  positive(id, "Pago inválido.");
  return serviceRequest<{ cancelled: boolean }>(`service/payment-requests/${id}/cancel`, { method: "POST" });
}
export async function fireNextCourse(sessionId: number) {
  positive(sessionId, "Mesa inválida.");
  return serviceRequest<{ released: number; course: string | null }>(`service/sessions/${sessionId}/fire`, { method: "POST" });
}
export async function setTableZone(tableId: number, zone: string) {
  positive(tableId, "Mesa inválida.");
  return serviceRequest<{ id: number; zone: string | null }>(`service/tables/${tableId}/zone`, { method: "PUT", body: { zone } });
}
export async function setMenuService(menuId: number, allergens: string[], prepMinutes: number | null) {
  positive(menuId, "Plato inválido.");
  return serviceRequest<{ id: number; allergens: string[]; prepMinutes: number | null }>(`service/menu/${menuId}/service`, { method: "PUT", body: { allergens, prepMinutes } });
}

export const listWaitlist = async () => serviceRequest<WaitlistEntry[]>("ops/waitlist");
export async function addWaitlistEntry(input: { name: string; phone: string; people: number; shift: "lunch" | "dinner"; date: string }) {
  const name = input.name.trim();
  if (!name) throw new Error("Ingresá el nombre.");
  if (!Number.isInteger(input.people) || input.people < 1 || input.people > 30) throw new Error("Cantidad de personas inválida.");
  return serviceRequest<WaitlistEntry>("ops/waitlist", { method: "POST", body: { ...input, name, phone: input.phone.trim() || null, status: "waiting" } });
}
export async function updateWaitlistStatus(id: number, status: WaitlistEntry["status"]) {
  positive(id, "Registro inválido.");
  return serviceRequest<WaitlistEntry>(`ops/waitlist/${id}`, { method: "PUT", body: { status } });
}

/* ───────── Mesa mixta, relevo, radar, faltantes y carga online ───────── */

export type LedgerBucket = {
  key: string; guestId: number | null; alias: string; me: boolean; addedByWaiter: boolean;
  owed: number; covered: number; reserved: number; outstanding: number; available: number; credit: number;
  items: Array<{ orderItemId: number; name: string; quantity: number; amount: number; sharedWith: number; state: string }>;
};
export type SessionLedger = {
  totals: { owed: number; covered: number; reserved: number; outstanding: number; available: number; credit: number };
  people: number; buckets: LedgerBucket[]; pending: Array<{ id: number; amount: number; method: string }>;
};
export type RadarIssue = {
  type: "sin-pedido" | "llamado-sin-tomar" | "plato-sin-retirar" | "comanda-sin-empezar" | "plato-demorado" | "cobro-pendiente" | "cambio-pendiente";
  role: "waiter" | "chef"; tableNum: number | null; minutes: number; text: string;
};
export type OnlineControl = { paused: boolean; maxActive: number; active: number };
export type OnlineEta = { minMinutes: number; maxMinutes: number; busy: boolean; busiestStation: string | null; paused: boolean; full: boolean };

export async function getSessionLedger(sessionId: number) {
  positive(sessionId, "Mesa inválida.");
  return serviceRequest<SessionLedger>(`service/sessions/${sessionId}/ledger`);
}
export async function addSessionGuest(sessionId: number, alias: string) {
  positive(sessionId, "Mesa inválida.");
  return serviceRequest<{ id: number; alias: string }>(`service/sessions/${sessionId}/guests`, { method: "POST", body: { alias } });
}
export async function settleSession(sessionId: number, input: { guestIds: number[]; includeTable: boolean; method: "cash" | "card" | "mp"; tipAmount?: number }) {
  positive(sessionId, "Mesa inválida.");
  return serviceRequest<{ confirmed: boolean; tableClosed: boolean }>(`service/sessions/${sessionId}/settle`, { method: "POST", body: input });
}
export async function getRadar(role?: "waiter" | "chef" | "manager") {
  return serviceRequest<{ issues: RadarIssue[]; total: number }>(`service/radar${role ? `?role=${role}` : ""}`);
}
export async function reportItemShortage(orderItemId: number) {
  positive(orderItemId, "Plato inválido.");
  return serviceRequest<{ affected: number; created: number; pausedMenuId: number }>(`service/order-items/${orderItemId}/shortage`, { method: "POST" });
}
export async function offerSubstitution(id: number, menuId: number) {
  positive(id, "Cambio inválido."); positive(menuId, "Plato inválido.");
  return serviceRequest(`service/substitutions/${id}/offer`, { method: "POST", body: { menuId } });
}
export async function resolveSubstitution(id: number, accept: boolean) {
  positive(id, "Cambio inválido.");
  return serviceRequest(`service/substitutions/${id}/resolve`, { method: "POST", body: { accept } });
}
export const getOnlineControl = async () => serviceRequest<OnlineControl>("service/online-control");
export async function setOnlineControl(input: { paused?: boolean; maxActive?: number }) {
  return serviceRequest<OnlineControl>("service/online-control", { method: "PUT", body: input });
}
export async function getOnlineEta(menuIds: number[], delivery: boolean) {
  const ids = menuIds.filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, 30).join(",");
  return serviceRequest<OnlineEta>(`service/online-eta?menuIds=${ids}&delivery=${delivery ? 1 : 0}`, { auth: false });
}
