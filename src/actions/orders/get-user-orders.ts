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
    // Nueva ruta backend para traer todas las órdenes de un cliente con sus items embebidos
    const response = await axios.get(`${url}/orders/customer/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );
    // Defensive: always return array
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    return [];
  }
}
