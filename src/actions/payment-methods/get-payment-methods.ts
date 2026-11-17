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

  if (!token || !userId) {
    return [];
  }

  try {
    const response = await axios.get<IPaymentMethod[]>(
      `${url}/payment-methods/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data || error.message
      : error instanceof Error
      ? error.message
      : error;
    console.error("Error al obtener metodos de pago:", message);
    throw error;
  }
};
