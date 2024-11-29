"use client";
import React, { useState } from "react";
import {
  Navbar,
  Collapse,
  Typography,
  IconButton,
} from "@material-tailwind/react";
import Link from "next/link";
import Cookies from "js-cookie";

export function TopMenu() {
  const [openNav, setOpenNav] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 960);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 960);
      if (window.innerWidth < 960) {
        setOpenNav(false); // Cerrar el menú si se cambia a mobile
      }
    };

    // Verificar si existe el token al cargar
    const token = Cookies.get("token");
    setIsLoggedIn(!!token);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    Cookies.remove("token"); // Eliminar el token
    setIsLoggedIn(false); // Actualizar el estado
  };

  const navList = (
    <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <Link href="/" className="flex items-center">
          Inicio
        </Link>
      </Typography>
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <Link href="/menu" className="flex items-center">
          Menu
        </Link>
      </Typography>
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <Link href="/nosotros" className="flex items-center">
          Nosotros
        </Link>
      </Typography>
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <Link href="#" className="flex items-center">
          Contacto
        </Link>
      </Typography>
    </ul>
  );

  return (
    <div className="max-h-[768px] w-full overflow-none mr-8 relative z-10 bg-black">
      <Navbar className="sticky top-0 z-10 h-max max-w-full rounded-none px-4 py-2 lg:px-8 lg:py-4 bg-black border-none">
        <div className="flex items-center justify-between text-blue-gray-900">
          <Typography
            as="a"
            href="/"
            className="mr-4 cursor-pointer py-1.5 font-medium"
          >
            Restaurante app
          </Typography>
          <div className="items-center gap-4 hidden md:flex">
            {isDesktop && <div className="mr-4 hidden lg:block">{navList}</div>}
            <div className="flex items-center gap-x-2 lg:gap-x-6">
              {isLoggedIn ? (
                <>
                  <Link
                    href={"/cart"}
                    className=" hover:underline"
                  >
                    Carrito
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="font-bold text-red-500 hover:underline"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="font-bold hover:underline"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/auth/register"
                    className="font-bold hover:underline"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
            <IconButton
              variant="text"
              className="ml-auto h-6 w-6 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
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
          {!isDesktop && navList}
          <div className="items-center gap-x-1 hidden">
            <Link href={"/"}>
              <span>Log In</span>
            </Link>
            <Link href={"/"}>
              <span>Sign in</span>
            </Link>
          </div>
        </Collapse>
      </Navbar>
    </div>
  );
}
