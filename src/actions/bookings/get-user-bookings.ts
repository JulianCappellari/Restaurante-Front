"use server";

import axios from "axios";
import { cookies } from "next/headers";
import type { Booking } from "@/interfaces/reservation.interface";

type BookingEnvelope = { success?: boolean; data?: Booking[] };

export async function getUserBookings(userId: number): Promise<Booking[]> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) return [];

  const token = (await cookies()).get("token")?.value;
  if (!token) return [];

  try {
    const response = await axios.get<BookingEnvelope | Booking[]>(`${url}/bookings/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (Array.isArray(response.data)) return response.data;
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch {
    throw new Error("No se pudo cargar el historial.");
  }
}
