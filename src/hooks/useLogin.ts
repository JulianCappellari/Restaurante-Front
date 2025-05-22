import { getLogin } from "@/actions/auth/login";
import useAuthStore from "@/store/auth/useAuthStore";
import Cookies from "js-cookie";
import { useState } from "react";

// hooks/useLogin.ts
export const useLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
    const login = async (email: string, password: string) => {
      setIsLoading(true);
      setErrorMessage(null);
  
      try {
        console.log(email, password);
        const response = await getLogin(email, password);
        console.log(response);
  
        if (response) {
          console.log("Token: ", response.token);
          Cookies.set("token", response.token, {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          });
          useAuthStore.getState().setAuthenticated(true);
          return true; // Indica que el login fue exitoso
        }
      } catch (error: any) {
        setErrorMessage(error.response?.data?.message || "Error al iniciar sesión. Intenta de nuevo.");
      } finally {
        setIsLoading(false);
      }
      return false; // Indica que el login falló
    };
  
    return { login, isLoading, errorMessage };
  };
  