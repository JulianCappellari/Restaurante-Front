"use server";

import axios from "axios";
import { cookies } from "next/headers";
import type { AvailabilityRequest, AvailabilityResponse } from "@/interfaces/reservation.interface";

export async function checkAvailabilityAction(
  payload: AvailabilityRequest
): Promise<AvailabilityResponse> {
  const API = process.env.NEXT_PUBLIC_API_URL2;
  if (!API) throw new Error("API URL no definida");

  if (/^https?:\/\/localhost:3001(\/|$)/i.test(API)) {
    throw new Error("NEXT_PUBLIC_API_URL2 apunta al frontend. Debe apuntar al backend.");
  }

  const token = (await cookies()).get("token")?.value;

  try {
    const { data } = await axios.post<AvailabilityResponse>(
      `${API}/availability/check`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 10000,
      }
    );

    return data;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : error instanceof Error
      ? error.message
      : "Error consultando disponibilidad";
    throw new Error(message);
  }
}
