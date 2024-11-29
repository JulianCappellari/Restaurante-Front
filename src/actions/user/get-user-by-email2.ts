'use server';

import { IUser } from "@/interfaces";
import axios from "axios";

export const getUserByEmail2 = async (email: string, password: string): Promise<IUser | null> => {
  console.log("Buscando usuario por email:", email);
  try {
    const response = await axios.post<IUser>(
      `${process.env.NEXT_PUBLIC_API_URL}/login`,
      { email, password }
    );

    console.log("Usuario obtenido:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    return null;
  }
};
