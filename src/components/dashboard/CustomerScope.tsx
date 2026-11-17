"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isCustomerRoute } from "@/lib/customer-routes";

export default function CustomerScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const customer = isCustomerRoute(pathname);
  return (
    <div data-customer={customer ? "" : undefined} data-staff={customer ? undefined : ""}>
      {children}
      {customer && pathname !== "/" && (
        <footer className="border-t border-cliente-line bg-cliente-paper text-cliente-ink">
          <div className="customer-shell flex flex-wrap items-center justify-between gap-4 py-6">
            <Link href="/" className="customer-wordmark text-xl">Restaurante App</Link>
            <nav aria-label="Enlaces al pie" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold">
              <Link className="py-2 hover:underline" href="/menu">Carta</Link>
              <Link className="py-2 hover:underline" href="/reserva">Reservas</Link>
              <Link className="py-2 hover:underline" href="/nosotros">Nosotros</Link>
            </nav>
          </div>
        </footer>
      )}
    </div>
  );
}
