'use server'

import axios from "axios"

export const getMenuById = async (id: number) => {
    console.log("Buscando menu por id:", id);
    const API_URL = process.env.NEXT_PUBLIC_API_URL2
    try {
        const res = await axios.get(`${API_URL}/menu/${id}`)
        console.log(res.data);
        return res.data
    } catch (error) {
        console.error("Error al obtener el menu:", error);
        throw new Error("Error al obtener el menu");
    }
}