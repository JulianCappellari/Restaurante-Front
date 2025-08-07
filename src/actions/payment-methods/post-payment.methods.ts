'use server'
import { IPaymentMethod } from "@/interfaces/payment-methods.interface";
import axios from "axios";
import { cookies } from "next/headers";

export async function postPaymentMethod(payload: Omit<IPaymentMethod, "id"> & { userId: number }) {
const cookiesStore = await cookies();
  const token = cookiesStore.get("token")?.value;
    const url = process.env.NEXT_PUBLIC_API_URL2
console.log("Cuerpo a enviar:   ", payload)
  try {
    const res = await axios.post(`${url}/payment-methods`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Error al crear el método de pago"
    );
  }
}
