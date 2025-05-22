'use server'

import axios from "axios";


export const getAddressById = async (id: number) => {
    const url = process.env.NEXT_PUBLIC_API_URL2;
    try {
        const response = await axios.get(`${url}/addresses/${id}`);
        return response.data;
    } catch (error) {
        console.error(
            "Error al obtener la direccion:",
            error.response?.data || error.message
        );
        throw new Error("No se pudieron obtener la direccion.");
    }
}