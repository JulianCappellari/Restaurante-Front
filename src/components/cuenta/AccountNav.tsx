"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  ["/cuenta/perfil", "Perfil"],
  ["/cuenta/ordenes", "Pedidos"],
  ["/cuenta/reservas", "Reservas"],
  ["/cuenta/favoritos", "Favoritos"],
  ["/cuenta/direccion", "Direcciones"],
  ["/cuenta/payment-methods", "Medios de pago"],
] as const;

export default function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Mi cuenta" className="border-b border-cliente-line bg-white">
      <ul className="customer-shell grid grid-cols-3 gap-1 py-2 sm:flex sm:flex-wrap">
        {sections.map(([href, name]) => (
          <li key={href}>
            <Link href={href} aria-current={pathname === href ? "page" : undefined}
              className="customer-press inline-flex min-h-11 w-full items-center justify-center rounded-lg px-1.5 text-center text-xs font-semibold sm:w-auto text-cliente-ink hover:bg-cliente-mist aria-[current=page]:bg-cliente-blue aria-[current=page]:text-white sm:px-3 sm:text-sm">
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
