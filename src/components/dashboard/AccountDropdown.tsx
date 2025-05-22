'use client';

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, UserIcon, MapPinIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
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
      icon: <UserIcon className="h-5 w-5 mr-2" />,
      label: "Mis datos",
    },
    {
      href: "/cuenta/direccion",
      icon: <MapPinIcon className="h-5 w-5 mr-2" />,
      label: "Mis direcciones",
    },
    {
      action: handleLogout,
      icon: <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />,
      label: "Cerrar sesión",
      isDestructive: true,
    },
  ];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex items-center justify-center rounded-md px-3 py-2 font-medium text-white hover:text-amber-400 focus:outline-none transition-colors duration-200 group">
          <span>Mi cuenta</span>
          <ChevronDownIcon
            className="ml-1 h-4 w-4 text-white group-hover:text-amber-400 transition-transform duration-200 group-hover:rotate-180"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
          <div className="py-1.5 px-1.5">
            {menuItems.map((item, index) => (
              <Menu.Item key={index}>
                {({ active }) => (
                  item.href ? (
                    <Link
                      href={item.href}
                      className={classNames(
                        active ? 'bg-gray-50 text-gray-900' : 'text-gray-700',
                        'flex items-center px-3 py-2.5 text-sm rounded-md transition-colors'
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      onClick={item.action}
                      className={classNames(
                        active ? 'bg-red-50' : '',
                        item.isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50',
                        'w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors'
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
        </Menu.Items>
      </Transition>
    </Menu>
  );
}