"use server";

import { cookies } from "next/headers";

export type WaiterWork = {
  calls: Array<{
    id: number; tableId: number; tableNum: number; requestedAt: string; reason?: string; assisted?: boolean; minutesWaiting?: number;
    sessionId?: number; takenBy?: string | null; summary?: { lines: string[]; pending: number; ready: number; served: number } | null;
  }>;
  dishes: Array<{ id: number; tableId: number; tableNum: number; orderId: number; quantity: number; name: string; minutesReady?: number }>;
  delayed?: Array<{ id: number; orderId: number; tableNum: number; name: string; minutesLate: number }>;
  payments?: Array<{ id: number; sessionId: number; tableNum?: number; amount: number; tip: number; method: string; mode: string; minutesWaiting: number; covers?: string[]; requestedBy?: string | null }>;
  substitutions?: Array<{
    id: number; status: "needed" | "offered"; orderItemId: number; quantity: number; tableNum: number | null; dish: string;
    owners: string[]; guestConfirms: boolean; minutes: number; proposed: { id: number; name: string; priceDiff: number } | null;
    alternatives: Array<{ id: number; name: string; priceDiff: number }>;
  }>;
};

async function diningStaffRequest<T>(path: string, method = "GET"): Promise<T> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  const token = (await cookies()).get("token")?.value;
  if (!url || !token) throw new Error("Volvé a iniciar sesión para gestionar las mesas.");
  const response = await fetch(`${url.replace(/\/$/, "")}/dining/${path}`, {
    method, headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "No se pudo actualizar el servicio de mesa.");
  return payload;
}

export async function issueTableCode(sessionId: number) {
  if (!Number.isSafeInteger(sessionId) || sessionId < 1) throw new Error("Abrí la mesa antes de generar el QR.");
  return diningStaffRequest<{ code: string }>(`sessions/${sessionId}/code`, "POST");
}

export async function getWaiterWork() {
  return diningStaffRequest<WaiterWork>("work");
}

/** Relevo: el mozo toma el aviso y el cliente ve quién va a su mesa. */
export async function takeCall(callId: number) {
  if (!Number.isSafeInteger(callId) || callId < 1) throw new Error("Llamado inválido.");
  return diningStaffRequest<{ acknowledged: boolean }>(`calls/${callId}/ack`, "PUT");
}

export async function markCallAttended(callId: number) {
  if (!Number.isSafeInteger(callId) || callId < 1) throw new Error("Llamado inválido.");
  return diningStaffRequest<{ attended: boolean }>(`calls/${callId}/attended`, "PUT");
}
