"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import AccountDropdown from "./AccountDropdown";
import { useCartStore } from "@/store";
import { ShoppingCart, Menu, X, LogIn, UserPlus } from "lucide-react";

export function TopMenu() {
  const [openNav, setOpenNav] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
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

  const navItems = [
    { href: "/", label: "Inicio" },
    { href: "/menu", label: "Menú" },
    { href: "/nosotros", label: "Nosotros" },
    { href: "/reserva", label: "Reservas" },
  ];

  const navList = (
    <ul className="mt-2 mb-4 flex flex-col gap-4 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-8">
      {navItems.map((item) => (
        <li key={item.href} className="group">
          <Link
            href={item.href}
            className="flex items-center text-white hover:text-amber-400 transition-colors duration-300 font-medium relative"
            onClick={() => setOpenNav(false)}
          >
            {item.label}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <nav
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? "bg-black/95 backdrop-blur-md shadow-xl border-b border-white/10" 
          : "bg-black"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-amber-500 transition-all duration-300">
                Restaurante App
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isDesktop && (
            <div className="hidden lg:flex items-center space-x-8">
              {navList}
            </div>
          )}

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {/* Cart with Badge */}
                <Link
                  href="/cart"
                  className="relative p-2 text-white hover:text-amber-400 transition-colors duration-200 group"
                >
                  <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                      {totalItems}
                    </span>
                  )}
                </Link>
                
                {/* User Dropdown */}
                <AccountDropdown />
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden sm:flex items-center space-x-2 text-white hover:text-amber-400 transition-colors duration-200 font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar sesión</span>
                </Link>
                <Link
                  href="/auth/register"
                  className="hidden sm:flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Registrarse</span>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setOpenNav(!openNav)}
              className="lg:hidden p-2 text-white hover:text-amber-400 hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              {openNav ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {openNav && (
          <div className="lg:hidden border-t border-white/10 bg-black/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-white hover:text-amber-400 hover:bg-white/10 rounded-md transition-colors duration-200 font-medium"
                  onClick={() => setOpenNav(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              {!isLoggedIn && (
                <div className="pt-4 space-y-2">
                  <Link
                    href="/auth/login"
                    className="flex items-center space-x-2 px-3 py-2 text-white hover:text-amber-400 hover:bg-white/10 rounded-md transition-colors duration-200 font-medium"
                    onClick={() => setOpenNav(false)}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar sesión</span>
                  </Link>
                  <Link
                    href="/auth/register"
                    className="flex items-center space-x-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors duration-200 font-medium"
                    onClick={() => setOpenNav(false)}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Registrarse</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}