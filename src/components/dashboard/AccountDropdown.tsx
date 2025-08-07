'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, UserIcon, MapPinIcon, ArrowRightIcon, CreditCardIcon, ListBulletIcon     } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AccountDropdown() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/');
  };

  const menuItems = [
    {
      href: "/cuenta/perfil",
      icon: <UserIcon className="h-5 w-5 mr-3" />,
      label: "Mi perfil",
    },
    {
      href: "/cuenta/ordenes",
      icon: <ListBulletIcon className="h-5 w-5 mr-3" />,
      label: "Mis ordenes", 
    },
    {
      href: "/cuenta/direccion",
      icon: <MapPinIcon className="h-5 w-5 mr-3" />,
      label: "Mis direcciones",
    },
    {
      href: "/cuenta/payment-methods",
      icon: <CreditCardIcon className="h-5 w-5 mr-3" />,
      label: "Metodos de pago",
    },
    {
      action: handleLogout,
      icon: <ArrowRightIcon className="h-5 w-5 mr-3" />,
      label: "Cerrar sesión",
      isDestructive: true,
    },
  ];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium text-white hover:text-amber-400 hover:bg-white/10 focus:outline-none transition-all duration-200 group">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mr-2">
            <UserIcon className="h-4 w-4 text-white" />
          </div>
          <span>Mi cuenta</span>
          <ChevronDownIcon
            className="ml-2 h-4 w-4 text-white group-hover:text-amber-400 transition-transform duration-200 group-hover:rotate-180"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-20 mt-3 w-64 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none border border-gray-100">
          <div className="py-2 px-2">
            <div className="px-3 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">Mi cuenta</p>
              <p className="text-xs text-gray-500">Gestiona tu perfil y preferencias</p>
            </div>
            
            <div className="py-2">
              {menuItems.map((item, index) => (
                <Menu.Item key={index}>
                  {({ active }) => (
                    item.href ? (
                      <Link
                        href={item.href}
                        className={classNames(
                          active ? 'bg-amber-50 text-amber-700' : 'text-gray-700',
                          'flex items-center px-3 py-3 text-sm rounded-lg transition-all duration-200 hover:bg-amber-50 hover:text-amber-700'
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ) : (
                      <button
                        onClick={item.action}
                        className={classNames(
                          active ? 'bg-red-50 text-red-700' : '',
                          item.isDestructive ? 'text-red-600 hover:bg-red-50 hover:text-red-700' : 'text-gray-700 hover:bg-gray-50',
                          'w-full flex items-center px-3 py-3 text-sm rounded-lg transition-all duration-200'
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    )
                  )}
                </Menu.Item>
              ))}
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}