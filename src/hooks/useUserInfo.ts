import { getUserByEmail } from "@/actions/user/get-user-by-email";
import { IUser } from "@/interfaces";
import { useCallback, useEffect, useState } from "react";

export const useUserInfo = (userEmail: string | null) => {
  const [userInfo, setUserInfo] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Esta función puede ser llamada desde fuera para forzar el refetch
  const refetch = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await getUserByEmail(userEmail);
      if (res) {
        setUserInfo(res);
      } else {
        setUserInfo(null);
      }
    } catch (err) {
      console.error("Error fetching user info", err);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Llama a refetch automáticamente cuando cambia el email
  useEffect(() => {
    refetch();
  }, [refetch]);

  return { userInfo, loading, refetch };
};