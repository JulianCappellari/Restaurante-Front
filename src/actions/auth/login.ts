"use server";

import axios from "axios";

type LoginResponse = {
  token: string;
  refreshToken: string;
};

export const getLogin = async (
  email: string,
  password: string
): Promise<LoginResponse | null> => {
  const API = process.env.NEXT_PUBLIC_API_URL_BACKEND ?? "http://localhost:3000";

  try {
    const { data } = await axios.post<LoginResponse>(
      `${API}/auth/login`,
      { email, password },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return data;
  } catch (error: unknown) {
    const axiosError = axios.isAxiosError(error) ? error : null;
    console.error("[LOGIN] Error:", {
      status: axiosError?.response?.status,
      data: axiosError?.response?.data,
      url: axiosError?.config?.url,
    });

    return null;
  }
};
