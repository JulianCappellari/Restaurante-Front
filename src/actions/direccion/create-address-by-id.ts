"use server";

import { IAddress } from "@/interfaces";
import axios from "axios";
import { cookies } from "next/headers";

export const createAddressById = async (data: IAddress) => {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Token no proporcionado.");
  }

  try {
    const response = await axios.post(
      `${url}/addresses`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true, // por si el backend necesita enviar/recibir cookies
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error al guardar dirección:", error);
    throw error;
  }
};
