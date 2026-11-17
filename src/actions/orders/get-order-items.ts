"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { IOrderItem } from "@/interfaces";

export async function getOrderItems(orderId: number): Promise<IOrderItem[]> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Token no proporcionado");
  }

  try {
    const response = await axios.get<IOrderItem[]>(`${url}/order-items/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message
      : error instanceof Error
      ? error.message
      : null;
    throw new Error(message || "Error al obtener items de la orden");
  }
}
