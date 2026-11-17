"use server";

import axios from "axios";
import type { Table } from "@/interfaces/reservation.interface";

export async function getAllTables(): Promise<Table[]> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) return [];

  try {
    const response = await axios.get<Table[]>(`${url}/tables`);
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}
