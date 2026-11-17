"use server";

import axios from "axios";
import { cookies } from "next/headers";
import type { IOrder } from "@/interfaces";

export async function getAllOrders(): Promise<IOrder[]> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) return [];

  const token = (await cookies()).get("token")?.value;

  try {
    const response = await axios.get<IOrder[]>(`${url}/orders`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}
