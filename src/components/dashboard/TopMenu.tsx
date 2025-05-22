"use client";
import React, { useState, useEffect } from "react";
import {
  Navbar,
  Collapse,
  Typography,
  IconButton,
} from "@material-tailwind/react";
import Link from "next/link";
import Cookies from "js-cookie";
import AccountDropdown from "./AccountDropdown";

export function TopMenu() {
  const [openNav, setOpenNav] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Verificar si estamos en el cliente antes de acceder a window
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 960);
      if (window.innerWidth >= 960) setOpenNav(false);
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    // Verificar si existe el token al cargar
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);

    // Inicializar el estado de isDesktop
    setIsDesktop(window.innerWidth >= 960);

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navList = (
    <ul className="mt-2 mb-4 flex flex-col gap-4 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-8">
      {[
        { href: "/", label: "Inicio" },
        { href: "/menu", label: "Menú" },
        { href: "/nosotros", label: "Nosotros" },
        { href: "/contacto", label: "Contacto" },
      ].map((item) => (
        <Typography
          key={item.href}
          as="li"
          variant="small"
          className="group p-1 font-medium"
        >
          <Link
            href={item.href}
            className="flex items-center text-white hover:text-amber-400 transition-colors duration-300"
            onClick={() => setOpenNav(false)}
          >
            {item.label}
            <span className="block h-0.5 bg-amber-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </Link>
        </Typography>
      ))}
    </ul>
  );

  return (
    <Navbar
      className={`sticky top-0 z-50 h-max max-w-full rounded-none px-4 py-2 lg:px-8 lg:py-3 border-none transition-all duration-300 ${
        scrolled ? "bg-black/95 backdrop-blur-sm shadow-lg" : "bg-black"
      }`}
      blurred={scrolled}
    >
      <div className="flex items-center justify-between text-white">
        <Link href="/" className="flex items-center">
          <Typography
            as="span"
            className="mr-4 cursor-pointer text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent"
          >
            Restaurante App
          </Typography>
        </Link>

        <div className="flex items-center gap-4">
          {isDesktop && <div className="mr-4 hidden lg:block">{navList}</div>}

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {isLoggedIn ? (
              <>
                <Link
                  href="/cart"
                  className="relative font-medium text-white hover:text-amber-400 transition-colors"
                >
                  Carrito
                  <span className="absolute -top-2 -right-3 bg-amber-500 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center">
                    0
                  </span>
                </Link>
                <AccountDropdown />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="font-medium text-white hover:text-amber-400 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/register"
                  className="font-medium bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          <IconButton
            variant="text"
            className="ml-2 h-8 w-8 text-white hover:bg-white/10 focus:bg-white/10 active:bg-white/10 lg:hidden"
            ripple={false}
            onClick={() => setOpenNav(!openNav)}
          >
            {openNav ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </IconButton>
        </div>
      </div>

      <Collapse open={openNav}>
        <div className="pt-4 pb-2">
          {navList}
          <div className="flex flex-col gap-4 mt-6">
            {!isLoggedIn && (
              <>
                <Link
                  href="/auth/login"
                  className="w-full text-center font-medium text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                  onClick={() => setOpenNav(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/register"
                  className="w-full text-center font-medium text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg transition-colors"
                  onClick={() => setOpenNav(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </Collapse>
    </Navbar>
  );
}