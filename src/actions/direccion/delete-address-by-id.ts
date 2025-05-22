"use server";

import axios from "axios";
import { cookies } from "next/headers";

export const deleteAddressById = async (id: number) => {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Token no proporcionado.");
  }

  try {
    const response = await axios.delete(`${url}/addresses/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true, // por si el backend necesita enviar/recibir cookies
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error al eliminar la direccion:",
      error.response?.data || error.message
    );
    throw new Error("No se pudo eliminar la direccion.");
  }
};
