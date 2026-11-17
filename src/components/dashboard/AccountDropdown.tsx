"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  CreditCardIcon,
  ListBulletIcon,
  MapPinIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  HeartIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Cookies from "js-cookie";
import useAuthStore from "@/store/auth/useAuthStore";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type RoleValue = "Administrator" | "Waiter" | "Customer" | "Receptionist" | "Chef";

type DropdownItem = {
  href?: string;
  action?: () => void;
  icon: ReactNode;
  label: string;
  isDestructive?: boolean;
};

export const decodeRoleFromToken = (): RoleValue | null => {
  const token = Cookies.get("token");
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized)) as { role?: RoleValue };
    return decoded.role || null;
  } catch {
    return null;
  }
};

export default function AccountDropdown({ home = false }: { home?: boolean }) {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [role, setRole] = useState<RoleValue | null>(null);

  useEffect(() => {
    setRole(decodeRoleFromToken());
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    setAuthenticated(false);
    window.location.href = "/";
  };

  const accountItems: DropdownItem[] = [
    {
      href: "/cuenta/perfil",
      icon: <UserIcon className="mr-3 h-5 w-5" />,
      label: "Mi perfil",
    },
    {
      href: "/cuenta/ordenes",
      icon: <ListBulletIcon className="mr-3 h-5 w-5" />,
      label: "Mis ordenes",
    },
    {
      href: "/cuenta/reservas",
      icon: <CalendarDaysIcon className="mr-3 h-5 w-5" />,
      label: "Mis reservas",
    },
    {
      href: "/cuenta/favoritos",
      icon: <HeartIcon className="mr-3 h-5 w-5" />,
      label: "Favoritos",
    },
    {
      href: "/cuenta/direccion",
      icon: <MapPinIcon className="mr-3 h-5 w-5" />,
      label: "Mis direcciones",
    },
    {
      href: "/cuenta/payment-methods",
      icon: <CreditCardIcon className="mr-3 h-5 w-5" />,
      label: "Metodos de pago",
    },
  ];

  const roleItems = useMemo<DropdownItem[]>(() => {
    if (role === "Administrator") {
      return [
        {
          href: "/admin",
          icon: <Cog6ToothIcon className="mr-3 h-5 w-5" />,
          label: "Panel administrador",
        },
        {
          href: "/mozo",
          icon: <ListBulletIcon className="mr-3 h-5 w-5" />,
          label: "Panel mozo",
        },
        {
          href: "/chef",
          icon: <ListBulletIcon className="mr-3 h-5 w-5" />,
          label: "Pantalla cocina",
        },
        {
          href: "/recepcion",
          icon: <CalendarDaysIcon className="mr-3 h-5 w-5" />,
          label: "Recepcion",
        },
      ];
    }

    if (role === "Waiter") {
      return [
        {
          href: "/mozo",
          icon: <ListBulletIcon className="mr-3 h-5 w-5" />,
          label: "Panel mozo",
        },
      ];
    }

    if (role === "Chef") {
      return [
        {
          href: "/chef",
          icon: <ListBulletIcon className="mr-3 h-5 w-5" />,
          label: "Pantalla cocina",
        },
      ];
    }

    if (role === "Receptionist") {
      return [
        {
          href: "/recepcion",
          icon: <CalendarDaysIcon className="mr-3 h-5 w-5" />,
          label: "Recepcion",
        },
      ];
    }

    return [];
  }, [role]);

  const logoutItem: DropdownItem = {
    action: handleLogout,
    icon: <ArrowRightIcon className="mr-3 h-5 w-5" />,
    label: "Cerrar sesion",
    isDestructive: true,
  };

  const renderItem = (item: DropdownItem, index: number) => (
    <Menu.Item key={`${item.label}-${index}`}>
      {({ active }) =>
        item.href ? (
          <Link
            href={item.href}
            className={classNames(
              active ? "bg-primario-50 text-primario-700" : "text-gray-700",
              "flex items-center rounded-lg px-3 py-3 text-sm transition"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ) : (
          <button
            onClick={item.action}
            className={classNames(
              active ? "bg-red-50 text-red-700" : "",
              item.isDestructive
                ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                : "text-gray-700 hover:bg-gray-50",
              "flex w-full items-center rounded-lg px-3 py-3 text-sm transition"
            )}
            type="button"
          >
            {item.icon}
            {item.label}
          </button>
        )
      }
    </Menu.Item>
  );

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button aria-label="Mi cuenta" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:px-3">
        <span className={classNames("grid h-8 w-8 place-items-center rounded-full sm:mr-2", home ? "bg-[#ffdb71] text-[#16284e]" : "bg-primario-600 text-white")}>
          <UserIcon aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="hidden sm:inline">Mi cuenta</span>
        <ChevronDownIcon className="ml-2 hidden h-4 w-4 sm:block" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150 motion-reduce:transition-none"
        enterFrom="transform opacity-0 motion-safe:scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-out duration-100 motion-reduce:transition-none"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 motion-safe:scale-95"
      >
        <Menu.Items className="absolute right-0 z-20 mt-3 max-h-[calc(100dvh-6rem)] w-56 origin-top-right overflow-y-auto overscroll-contain rounded-lg border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5 [--customer-focus:#294780] focus:outline-none sm:w-64">
          <div className="border-b border-gray-100 px-3 py-3">
            <p className="text-sm font-semibold text-gray-900">Mi cuenta</p>
            <p className="text-xs text-gray-500">Perfil, pedidos y preferencias</p>
          </div>

          <div className="py-2">
            {accountItems.map(renderItem)}

            {roleItems.length > 0 && (
              <>
                <div className="my-2 border-t border-gray-100 px-3 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Equipo
                  </p>
                </div>
                {roleItems.map(renderItem)}
              </>
            )}

            <div className="mt-2 border-t border-gray-100 pt-2">
              {renderItem(logoutItem, 0)}
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
