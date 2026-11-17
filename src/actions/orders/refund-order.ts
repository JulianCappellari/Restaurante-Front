"use server";

import axios from "axios";
import { cookies } from "next/headers";
import type { IOrder } from "@/interfaces";

export async function refundOrder(orderId: number, amount: number, reason: string): Promise<IOrder> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) throw new Error("API URL no definida");

  const token = (await cookies()).get("token")?.value;

  try {
    const response = await axios.put<IOrder>(
      `${url}/orders/${orderId}/refund`,
      { amount, reason },
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
      throw new Error(error.response?.data?.error || error.message || "No se pudo registrar el reembolso");
    }
    throw error instanceof Error ? error : new Error("No se pudo registrar el reembolso");
  }
}
