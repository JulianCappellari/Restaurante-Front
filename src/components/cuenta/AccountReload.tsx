"use client";

import { useRouter } from "next/navigation";

export default function AccountReload() {
  const router = useRouter();
  return <button type="button" onClick={() => router.refresh()} className="btn-outline customer-press mt-4 min-h-11">Volver a cargar</button>;
}
