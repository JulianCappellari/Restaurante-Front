"use server";

import { IPaymentMethod } from "@/interfaces/payment-methods.interface";
import axios from "axios";
import { cookies } from "next/headers";

export async function postPaymentMethod(
  payload: Omit<IPaymentMethod, "id">
) {
  const cookiesStore = await cookies();
  const token = cookiesStore.get("token")?.value;
  const url = process.env.NEXT_PUBLIC_API_URL2;

  if (!token) {
    throw new Error("Token no proporcionado.");
  }

  try {
    const res = await axios.post(`${url}/payment-methods`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message
      : error instanceof Error
      ? error.message
      : null;
    throw new Error(message || "Error al crear el metodo de pago");
  }
}
