"use server";

import axios from "axios";
import { cookies } from "next/headers";
import type { IOrder, OrderState } from "@/interfaces";

export async function updateOrderState(orderId: number, state: OrderState): Promise<IOrder | null> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");

  const token = (await cookies()).get("token")?.value;

  try {
    const response = await axios.put<IOrder>(
      `${url}/orders/${orderId}`,
      { state },
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.message || "No se pudo actualizar el pedido");
    }
    throw error instanceof Error ? error : new Error("No se pudo actualizar el pedido");
  }
}
