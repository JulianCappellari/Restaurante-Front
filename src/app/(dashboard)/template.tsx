"use client";

import { usePathname } from "next/navigation";
import { isCustomerRoute } from "@/lib/customer-routes";

// Next vuelve a montar el template en cada navegación: la entrada de página se repite.
// Solo opacidad (sin transform) para no romper elementos fijos ni secciones fijadas.
// Las pantallas del equipo no animan: se usan muchas veces por turno.
export default function Template({ children }: { children: React.ReactNode }) {
  const customer = isCustomerRoute(usePathname());
  if (!customer) return <>{children}</>;
  return (
    <>
      <div className="route-bar" aria-hidden="true" />
      <div className="page-enter">{children}</div>
    </>
  );
}
