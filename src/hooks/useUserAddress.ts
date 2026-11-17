"use client";

import type { IAddress } from "@/interfaces";
import axios from "axios";
import { useEffect, useState } from "react";

type AddressResult = { userId: number; attempt: number; addresses: IAddress[]; error: boolean };

export function useUserAddress(userId: number | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<AddressResult | null>(null);

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL2;
    if (!userId || !api) return;

    const controller = new AbortController();
    axios.get<IAddress[]>(`${api}/addresses/user/${userId}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) {
          setResult({ userId, attempt, addresses: Array.isArray(data) ? data : [], error: false });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ userId, attempt, addresses: [], error: true });
        }
      });

    return () => controller.abort();
  }, [userId, attempt]);

  const apiConfigured = Boolean(process.env.NEXT_PUBLIC_API_URL2);
  const current = result?.userId === userId && result.attempt === attempt ? result : null;
  return {
    addresses: current?.addresses ?? [],
    loading: Boolean(userId && apiConfigured && !current),
    error: Boolean(userId && (!apiConfigured || current?.error)),
    retry: () => setAttempt((count) => count + 1),
  };
}
