'use server'
import axios from "axios";
import { cookies } from "next/headers";

export const deletePymentMethod = async (id:number) => {

    const url = process.env.NEXT_PUBLIC_API_URL2
    const cookiesStore = await cookies();
    const token = cookiesStore.get("token")?.value;

    if (!token) {
        throw new Error("token no proporcionado");
      }

    try {
        const res = await axios.delete(`${url}/payment-methods/${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        throw new Error(
            error?.response?.data?.message || "Error al eliminar el método de pago"
        );
    }

}