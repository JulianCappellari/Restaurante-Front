"use client";

import Cookies from "js-cookie";
import { useEffect } from "react";

type RealtimeHandlers = Record<string, (payload: unknown) => void>;

export function useRealtime(channel: "admin" | "chef" | "waiter" | "customer" | "reception", handlers: RealtimeHandlers) {
  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL2;
    const token = Cookies.get("token");
    if (!api || !token) return;

    const source = new EventSource(`${api}/realtime/${channel}?token=${encodeURIComponent(token)}`);

    Object.entries(handlers).forEach(([event, handler]) => {
      source.addEventListener(event, (message) => {
        try {
          handler(JSON.parse((message as MessageEvent).data));
        } catch {
          handler((message as MessageEvent).data);
        }
      });
    });

    return () => source.close();
  }, [channel, handlers]);
}
