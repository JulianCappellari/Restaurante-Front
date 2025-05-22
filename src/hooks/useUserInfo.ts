import { getUserByEmail } from "@/actions/user/get-user-by-email";
import { IUser } from "@/interfaces";
import { useEffect, useState } from "react";


export const useUserInfo = (userEmail: string | null) => {
    

    const [userInfo, setUserInfo] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL2;
    useEffect(() => {
      const fetchUserInfo = async () => {
        try {
          if (!userEmail) return;
          console.log("UserEmail Hook", userEmail);
          const res = await getUserByEmail(userEmail)
          if (res) {
            setUserInfo(res); // Ya es el objeto IUser
          } else {
            setUserInfo(null); // Maneja el caso de error o no encontrado
          }
        } catch (err) {
          console.error("Error fetching user info", err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchUserInfo();
    }, [userEmail, API_URL]);
  
    return { userInfo, loading };
}