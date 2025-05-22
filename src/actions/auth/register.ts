'use server';
import { IUser, UserRoles } from "@/interfaces";
import axios from "axios";

export const postRegister = async (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  password: string,
  rol: UserRoles
): Promise<IUser | null> => {
  try {
    const response = await axios.post<IUser>(
      `${process.env.NEXT_PUBLIC_API_URL}/register`,
      { firstName, lastName, email,phone, password, rol }
    );
    console.log("Usuario registrado:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    return null;
  }
};
