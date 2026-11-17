"use server";

import axios from "axios";
import { cookies } from "next/headers";
import type { IUser } from "@/interfaces";

export type AdminRole = "Administrator" | "Waiter" | "Customer" | "Receptionist" | "Chef";

export type AdminUser = Omit<IUser, "password" | "role"> & {
  role: AdminRole;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAllUsers(): Promise<AdminUser[]> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) return [];

  const token = (await cookies()).get("token")?.value;
  if (!token) return [];

  try {
    const response = await axios.get<AdminUser[]>(`${url}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}
