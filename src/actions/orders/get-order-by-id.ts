"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { IOrder } from "@/interfaces";

export async function getOrderById(orderId: number): Promise<IOrder> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Token no proporcionado");
  }

  try {
    const response = await axios.get(`${url}/orders/${orderId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "Error al obtener la orden");
  }
}
