'use server'

import { IUser } from "@/interfaces"
import axios from "axios"
import { cookies } from "next/headers"


export const putUserByEmail = async (id: number, data: Omit<IUser, "id">) => {


    const url = process.env.NEXT_PUBLIC_API_URL2
    const cookiesStore = await cookies()

    const token = cookiesStore.get("token")?.value

    if(!token){
        throw new Error("token no proporcionado")
    }

    try {
        const response = await axios.put(`${url}/users/${id}`, data, {
            headers: {
                Authorization: `Barrer ${token}`
            },
            withCredentials: true
        })
        return response.data
    } catch (error) {
        console.error(
            "Error al actualizar el usuario:",
            error.response?.data || error.message
          );
    }

}