"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, ChefHat, DoorOpen, LayoutDashboard, Utensils, UtensilsCrossed } from "lucide-react";
import Cookies from "js-cookie";
import { decodeRoleFromToken } from "./AccountDropdown";
import useAuthStore from "@/store/auth/useAuthStore";

const areas = [
  { href: "/admin", label: "Administración", role: "Administrator", icon: LayoutDashboard },
  { href: "/recepcion", label: "Recepción", role: "Receptionist", icon: CalendarDays },
  { href: "/chef", label: "Cocina", role: "Chef", icon: ChefHat },
  { href: "/mozo", label: "Salón", role: "Waiter", icon: UtensilsCrossed },
];

export default function StaffNavigation({ pathname }: { pathname: string }) {
  const [role, setRole] = useState<ReturnType<typeof decodeRoleFromToken>>(null);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  useEffect(() => { setRole(decodeRoleFromToken()); }, [pathname]);

  function logout() {
    Cookies.remove("token");
    setAuthenticated(false);
    window.location.href = "/";
  }

  return (
    <header className="staff-nav">
      <a href="#contenido-principal" className="staff-skip">Ir al contenido</a>
      <div className="staff-nav-inner">
        <div className="staff-brand">
          <span className="staff-brand-icon"><Utensils size={17} aria-hidden /></span>
          Restaurante App
        </div>
        <nav aria-label="Áreas del restaurante" className="staff-areas">
          {areas.filter(({ role: areaRole, href }) =>
            role === "Administrator" || role === areaRole || pathname === href
          ).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
              <Icon size={16} aria-hidden /> {label}
            </Link>
          ))}
        </nav>
        <div className="staff-nav-actions">
          <Link href="/" aria-label="Ver sitio público" title="Ver sitio público">
            <span className="hidden md:inline">Ver sitio</span><ArrowUpRight size={17} aria-hidden />
          </Link>
          <button type="button" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <DoorOpen size={17} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
