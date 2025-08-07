'use server'

import { IUser } from "@/interfaces"
import axios from "axios"
import { cookies } from "next/headers"

// Puedes definir un tipo más específico si quieres
export type UpdateUserDTO = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  rol?: 'Administrator' | 'Waiter' | 'Customer';
};

export const putUserByEmail = async (id: number, data: Partial<IUser>) => {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  const cookiesStore = await cookies();
  const token = cookiesStore.get("token")?.value;

  if (!token) {
    throw new Error("token no proporcionado");
  }

  try {
    const response = await axios.put(`${url}/users/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}` // <-- Corrige aquí
      },
      withCredentials: true
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error al actualizar el usuario:",
      error.response?.data || error.message
    );
    throw error; // Lanza el error para que el frontend lo maneje si quiere
  }
};