"use server";

import axios from "axios";

export type InventoryItem = {
  id: number;
  name: string;
  amount: number;
  unit?: string;
  minimumThreshold: number;
};

export async function getAllInventory(): Promise<InventoryItem[]> {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  if (!url) return [];

  try {
    const response = await axios.get<InventoryItem[]>(`${url}/inventarios`);
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}
