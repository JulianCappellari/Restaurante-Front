"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { IOrder } from "@/interfaces";

export async function getUserOrders(userId: number): Promise<IOrder[]> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return [];
  }

  try {
    const response = await axios.get<IOrder[]>(`${url}/orders/customer/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    throw new Error("No se pudo cargar el historial.");
  }
}
