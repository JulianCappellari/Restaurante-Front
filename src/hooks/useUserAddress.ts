import { IAddress } from "@/interfaces";
import axios from "axios";
import { useEffect, useState } from "react";

export const useUserAddress = (userId: number | null) => {
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL2;

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        if (!userId) return;

        // console.log(`${API_URL}/addresses/user/${userId}`);
        // console.log(userId);

        const res = await axios.get(`${API_URL}/addresses/user/${userId}`);
        setAddresses(res.data);
      } catch (err) {
        console.error("Error fetching addresses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [userId, API_URL]);

  return { addresses, loading };
};
