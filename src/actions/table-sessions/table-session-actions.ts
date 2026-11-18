"use server";

import axios from "axios";
import { cookies } from "next/headers";
import type { TableSession } from "@/interfaces/reservation.interface";

const authHeaders = async () => {
  const token = (await cookies()).get("token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const readableAxiosError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return new Error(error.response?.data?.message || error.response?.data?.error || error.message || fallback);
  }
  return error instanceof Error ? error : new Error(fallback);
};

export type PreOrderConversion = { converted: boolean; orderId: number | null; sentItems: number; skipped: string[]; error?: string };

export async function createTableSession(payload: {
  tableId: number;
  partySize: number;
  bookingId?: number | null;
  waitlistEntryId?: number | null;
  waiterId?: number | null;
  notes?: string | null;
}) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  try {
    const response = await axios.post<TableSession & { preOrder?: PreOrderConversion | null }>(`${url}/table-sessions`, payload, {
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    });
    return response.data;
  } catch (error) {
    throw readableAxiosError(error, "No se pudo abrir la mesa");
  }
}

export async function getActiveTableSessions() {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) return [];
  try {
    const response = await axios.get<TableSession[]>(`${url}/table-sessions/active`, {
      headers: { ...(await authHeaders()) },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function getTableSessionById(sessionId: number) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) return null;
  try {
    const response = await axios.get<TableSession>(`${url}/table-sessions/${sessionId}`, {
      headers: { ...(await authHeaders()) },
    });
    return response.data;
  } catch {
    return null;
  }
}

export async function addTableSessionPayment(sessionId: number, payload: { amount: number; method: "cash" | "card" | "mp" | "stripe"; orderId?: number; cashRegisterId?: number }) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  try {
    const response = await axios.post(`${url}/table-sessions/${sessionId}/payments`, payload, {
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    });
    return response.data;
  } catch (error) {
    throw readableAxiosError(error, "No se pudo registrar el pago");
  }
}

export async function addTableSessionTip(sessionId: number, payload: { amount: number; method?: string; waiterId?: number }) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  try {
    const response = await axios.post(`${url}/table-sessions/${sessionId}/tips`, payload, {
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    });
    return response.data;
  } catch (error) {
    throw readableAxiosError(error, "No se pudo registrar la propina");
  }
}

export async function splitTableSessionBill(sessionId: number, splitCount: number) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  const response = await axios.post(`${url}/table-sessions/${sessionId}/split`, { splitCount }, {
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
  });
  return response.data;
}

export async function moveTableSession(sessionId: number, tableId: number) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  const response = await axios.put(`${url}/table-sessions/${sessionId}/move`, { tableId }, {
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
  });
  return response.data;
}

export async function closeTableSession(sessionId: number, closeReason?: string) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  try {
    const response = await axios.put<TableSession>(`${url}/table-sessions/${sessionId}`, {
      status: "closed",
      endedAt: new Date().toISOString(),
      closeReason,
    }, {
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    });
    return response.data;
  } catch (error) {
    throw readableAxiosError(error, "No se pudo cerrar la mesa");
  }
}

export async function getTableSessionTicket(sessionId: number) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");
  const response = await axios.get<string>(`${url}/table-sessions/${sessionId}/ticket`, {
    headers: { ...(await authHeaders()) },
    responseType: "text",
  });
  return response.data;
}
