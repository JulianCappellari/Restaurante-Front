"use server";

import axios from "axios";
import { cookies } from "next/headers";
import type { Booking } from "@/interfaces/reservation.interface";

type BookingEnvelope = { success?: boolean; data?: Booking[] };

export async function getAllBookings(): Promise<Booking[]> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) return [];

  const token = (await cookies()).get("token")?.value;

  try {
    const response = await axios.get<BookingEnvelope | Booking[]>(`${url}/bookings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (Array.isArray(response.data)) return response.data;
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch {
    return [];
  }
}
