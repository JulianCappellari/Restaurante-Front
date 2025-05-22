"use server";
import axios from "axios";

export const getAllAddressByUserId = async (id: number) => {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  try {
    const response = await axios.get(`${url}/addresses/user/${id}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error al obtener las direcciones:",
      error.response?.data || error.message
    );
    throw new Error("No se pudieron obtener las direcciones.");
  }
};
