"use client";

import { useUserInfo } from "@/hooks/useUserInfo";
import { CreditCard, Edit, LogOut, Mail, MapPin, Phone, Settings, User } from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type React from "react";
import UserEditModal from "./UserEditModal";

interface Props {
  userEmail: string | null;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

export default function ClientProfilePage({ userEmail }: Props) {
  const { userInfo, loading, refetch } = useUserInfo(userEmail);
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleLogout = () => {
    Cookies.remove("token");
    router.push("/");
  };

  const handleUpdateUser = async () => {
    await refetch();
    setIsEditModalOpen(false);
  };

  if (loading) return <ProfileSkeleton />;

  if (!userEmail || !userInfo) {
    return (
      <div className="customer-shell py-6 sm:py-10">
        <div className="mx-auto max-w-2xl rounded-lg border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">No pudimos cargar tu perfil</h1>
          <p className="mt-2 text-gray-600">
            Inicia sesion nuevamente para ver y editar tus datos.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 rounded-lg bg-primario-600 px-5 py-2.5 font-medium text-white hover:bg-primario-700"
            type="button"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  const initials = `${userInfo.firstName?.charAt(0) || ""}${userInfo.lastName?.charAt(0) || ""}`;

  return (
    <div className="customer-shell py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="bg-cliente-blue px-5 py-7 text-white sm:px-8 sm:py-10">
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-full bg-cliente-butter text-xl font-bold text-cliente-ink sm:size-20">
                  {initials || "U"}
                </div>
                <div className="min-w-0 break-words">
                  <h1 className="text-3xl">
                    {userInfo.firstName} {userInfo.lastName}
                  </h1>
                  <p className="mt-1 text-white/75">{userInfo.email}</p>
                </div>
              </div>

              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 font-semibold text-neutral-950 transition hover:bg-white/90"
                type="button"
              >
                <Edit className="h-4 w-4" />
                Editar perfil
              </button>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-2xl border border-cliente-line bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-primario-50 text-primario-700">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-950">Datos personales</h2>
                <p className="text-sm text-gray-500">Informacion principal de tu cuenta</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <InfoRow label="Nombre completo" value={`${userInfo.firstName} ${userInfo.lastName}`} />
              <InfoRow label="Email" value={userInfo.email} icon={Mail} />
              <InfoRow label="Telefono" value={userInfo.phone || "Sin telefono cargado"} icon={Phone} />
            </div>
          </section>

          <section className="rounded-2xl border border-cliente-line bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-green-50 text-green-700">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-950">Acciones rapidas</h2>
                <p className="text-sm text-gray-500">Gestiona tus datos frecuentes</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <QuickLink
                href="/cuenta/direccion"
                icon={MapPin}
                title="Mis direcciones"
                description="Ubicaciones para delivery"
              />
              <QuickLink
                href="/cuenta/payment-methods"
                icon={CreditCard}
                title="Metodos de pago"
                description="Tarjetas guardadas"
              />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-red-600 transition hover:bg-red-50"
                type="button"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-red-100">
                  <LogOut className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold">Cerrar sesion</span>
                  <span className="text-sm text-red-500">Salir de tu cuenta</span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </div>

      <UserEditModal
        user={userInfo}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateUser}
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-stone-50 p-4">
      <span className="flex items-center gap-2 text-sm text-gray-600">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </span>
      <span className="text-right font-semibold text-gray-950">{value}</span>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg p-3 text-gray-700 transition hover:bg-stone-50"
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-stone-100 text-gray-600">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-semibold text-gray-950">{title}</span>
        <span className="text-sm text-gray-500">{description}</span>
      </span>
    </Link>
  );
}

function ProfileSkeleton() {
  return (
    <div className="customer-shell py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Skeleton className="h-56 w-full" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
