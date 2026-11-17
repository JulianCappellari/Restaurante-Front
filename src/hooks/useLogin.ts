import { getLogin } from "@/actions/auth/login";
import useAuthStore from "@/store/auth/useAuthStore";
import Cookies from "js-cookie";
import { useState } from "react";

function getJwtPayload(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getLogin(email.trim(), password);

      if (!response?.token) {
        setErrorMessage("Email o contraseña incorrectos.");
        return false;
      }

      const payload = getJwtPayload(response.token);

      Cookies.set("token", response.token, {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      Cookies.set("refreshToken", response.refreshToken, {
        expires: 30,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      if (payload?.role) {
        Cookies.set("role", payload.role, {
          expires: 7,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        });
      }

      useAuthStore.getState().setAuthenticated(true);
      return true;
    } catch {
      setErrorMessage("Error al iniciar sesión. Intentá de nuevo.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, errorMessage };
};