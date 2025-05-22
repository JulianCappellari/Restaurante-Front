"use server";

import { IAddress } from "@/interfaces";
import axios from "axios";
import { cookies } from "next/headers";

export const putAddressById = async (
  id: number,
  data: Omit<IAddress, "id">
) => {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Token no proporcionado.");
  }

  try {
    const response = await axios.put(`${url}/addresses/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true, // por si el backend necesita enviar/recibir cookies
    });
    console.log("Direccion actualizada:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error al actualizar la direccion:",
      error.response?.data || error.message
    );
  }
};
