"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import AccountDropdown from "./AccountDropdown";
import { useCartStore } from "@/store";
import { LogIn, Menu, ShoppingCart, UserPlus, Utensils, X } from "lucide-react";
import StaffNavigation from "./StaffNavigation";
import { isCustomerRoute } from "@/lib/customer-routes";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/menu", label: "Carta" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/reserva", label: "Reservas" },
];

export function TopMenu() {
  const pathname = usePathname();
  return isCustomerRoute(pathname) ? <CustomerNavigation pathname={pathname} /> : <StaffNavigation pathname={pathname} />;
}

function CustomerNavigation({ pathname }: { pathname: string }) {
  const home = pathname === "/";
  const menuButton = useRef<HTMLButtonElement>(null);
  const [openNav, setOpenNav] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setOpenNav(false);
    setIsLoggedIn(Boolean(Cookies.get("token")));
  }, [pathname]);

  const navList = (
    <>
      {navItems.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              active ? "bg-white/15 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => setOpenNav(false)}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <nav
      data-customer-inverse=""
      aria-label="Navegación principal"
      onKeyDown={(event) => {
        if (event.key === "Escape" && openNav) {
          setOpenNav(false);
          menuButton.current?.focus();
        }
      }}
      className="sticky top-0 z-50 w-full border-b border-white/15 bg-[#17336d]"
    >
      <a href={home ? "#contenido-portada" : "#contenido-principal"} className="sr-only z-10 rounded bg-white px-4 py-3 font-semibold text-[#16284e] focus:not-sr-only focus:absolute focus:left-4 focus:top-2">
          Ir al contenido
      </a>
      <div className="mx-auto w-[calc(100%-2rem)] max-w-[75rem] md:w-[calc(100%-3rem)]">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-20">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cliente-butter text-cliente-ink">
              <Utensils aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="text-sm font-bold leading-tight text-white min-[375px]:text-lg sm:text-xl">
              Restaurante App
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">{navList}</div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/cart"
                  className="relative grid h-10 w-10 place-items-center rounded-lg text-white/90 transition hover:bg-white/10 hover:text-white"
                  aria-label="Abrir carrito"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-xs font-bold text-neutral-950">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <AccountDropdown home />
              </>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Ingresar
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <UserPlus className="h-4 w-4" />
                  Crear cuenta
                </Link>
              </div>
            )}

            <button
              ref={menuButton}
              onClick={() => setOpenNav((value) => !value)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white lg:hidden"
              aria-label={openNav ? "Cerrar navegación" : "Abrir navegación"}
              aria-expanded={openNav}
              aria-controls="navegacion-movil"
              type="button"
            >
              {openNav ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

          <div id="navegacion-movil" className={openNav ? "max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-white/10 py-4 lg:hidden" : "hidden"}>
            <div className="flex flex-col gap-2">{navList}</div>
            {!isLoggedIn && (
              <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 sm:hidden">
                  <Link
                    href="/auth/login"
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
                    onClick={() => setOpenNav(false)}
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/auth/register"
                    className="rounded-lg bg-cliente-butter px-3 py-2 text-sm font-semibold text-cliente-ink"
                    onClick={() => setOpenNav(false)}
                  >
                    Crear cuenta
                  </Link>
              </div>
            )}
          </div>
      </div>
    </nav>
  );
}
