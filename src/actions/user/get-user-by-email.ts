'use server';

import { IUser } from "@/interfaces";
import axios from "axios";

export const getUserByEmail = async (email: string): Promise<IUser | null> => {
  console.log("Buscando usuario por email:", email);
  try {
    const response = await axios.get<IUser>(
      `${process.env.NEXT_PUBLIC_API_URL2}/users/${email}`
    );

    console.log("Usuario obtenido:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    return null;
  }
};
