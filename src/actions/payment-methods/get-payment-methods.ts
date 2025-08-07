"use server";

import { IPaymentMethod } from "@/interfaces";
import { getUserFromToken } from "@/utils/getUserFromToken";

import axios from "axios";
import { cookies } from "next/headers";

export const getPaymentMethods = async (): Promise<IPaymentMethod[]> => {
  const url = process.env.NEXT_PUBLIC_API_URL2;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const userId = getUserFromToken(token)?.id;
  console.log("token extraído del token:", token);
  console.log("userId extraído del token:", userId);
  try {
    const response = await axios.get<IPaymentMethod[]>(
      `${url}/payment-methods/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true, // por si el backend necesita enviar/recibir cookies
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error al obtener métodos de pago:",
      error.response?.data || error.message
    );
    throw error;
  }
};
