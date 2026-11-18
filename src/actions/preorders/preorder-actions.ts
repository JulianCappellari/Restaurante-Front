"use server";

import { cookies } from "next/headers";

/* Acciones de servidor del pedido anticipado (/api/preorders del backend). */

export type PreOrderItemView = {
  id: number; menuId: number; name: string; typeDish: string | null; imageUrl: string | null;
  quantity: number; notes: string; price: number; available: boolean;
  customizations: Array<{ customizationId: number; isIncluded: boolean }>;
};

export type PreOrderView = {
  id: number;
  source: "booking" | "waitlist";
  bookingId: number | null;
  waitlistEntryId: number | null;
  alias: string;
  pacing: "together" | "courses";
  notes: string | null;
  allergies: string[];
  status: "draft" | "confirmed" | "converted" | "cancelled" | "expired";
  confirmedAt: string | null;
  conversionNote: string | null;
  convertedSessionId: number | null;
  items: PreOrderItemView[];
  total: number;
  canEdit: boolean;
  queue?: { name: string; status: string; position: number | null; minutes: number | null; freeNow: boolean } | null;
};

export type PreOrderInput = {
  alias?: string;
  pacing: "together" | "courses";
  confirm: boolean;
  notes?: string | null;
  items: Array<{ menuId: number; quantity: number; notes?: string }>;
};

export type UpcomingPreOrder = PreOrderView & { shift: "lunch" | "dinner"; people: number; tables: number[] };

async function request<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean; linkToken?: string } = {}): Promise<T> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("El servicio no está disponible.");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.linkToken) headers["X-PreOrder-Token"] = init.linkToken;
  if (init.auth !== false) {
    const token = (await cookies()).get("token")?.value;
    if (!token) throw new Error("Volvé a iniciar sesión.");
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${url.replace(/\/$/, "")}/preorders/${path}`, {
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
const linkOk = (token: string) => {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("Este enlace no es válido.");
};

export async function getBookingPreOrder(bookingId: number) {
  positive(bookingId, "Reserva inválida.");
  return request<PreOrderView | null>(`booking/${bookingId}`);
}
export async function saveBookingPreOrder(bookingId: number, input: PreOrderInput) {
  positive(bookingId, "Reserva inválida.");
  return request<PreOrderView>(`booking/${bookingId}`, { method: "PUT", body: input });
}
export async function cancelBookingPreOrder(bookingId: number) {
  positive(bookingId, "Reserva inválida.");
  return request<{ cancelled: boolean }>(`booking/${bookingId}`, { method: "DELETE" });
}

export async function getPublicPreOrder(token: string) {
  linkOk(token);
  return request<PreOrderView>("public", { auth: false, linkToken: token });
}
export async function savePublicPreOrder(token: string, input: PreOrderInput) {
  linkOk(token);
  return request<PreOrderView>("public", { method: "PUT", body: input, auth: false, linkToken: token });
}
export async function cancelPublicPreOrder(token: string) {
  linkOk(token);
  return request<{ cancelled: boolean }>("public", { method: "DELETE", auth: false, linkToken: token });
}

export async function createWaitlistPreOrderLink(entryId: number) {
  positive(entryId, "Registro inválido.");
  return request<{ token: string; path: string; url: string }>(`waitlist/${entryId}/link`, { method: "POST" });
}
export const listUpcomingPreOrders = async () => request<UpcomingPreOrder[]>("upcoming");
