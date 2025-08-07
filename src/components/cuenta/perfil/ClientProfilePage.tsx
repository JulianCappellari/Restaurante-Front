"use client";

import { useUserInfo } from "@/hooks/useUserInfo";
import {
  User,
  Mail,
  Edit,
  Settings,
  LogOut,
  Phone,
  Calendar,
  Shield,
  CreditCard,
  MapPin,
} from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import UserEditModal from "./UserEditModal";
import { IUser } from "@/interfaces";

interface Props {
  userEmail: string;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
);

export default function ClientProfilePage({ userEmail }: Props) {
  const { userInfo, loading, refetch } = useUserInfo(userEmail);
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleLogout = () => {
    Cookies.remove("token");
    router.push("/");
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (updatedUser: IUser) => {
    await refetch(); // <-- Esto vuelve a pedir los datos al backend
    setIsEditModalOpen(false);
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header con avatar y información principal */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          <div className="relative h-48 bg-gradient-to-r from-amber-500 to-amber-600">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 space-y-4 sm:space-y-0">
                {/* Avatar */}

                <div className="hidden relative md:flex items-center justify-center sm:justify-start">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-lg ">
                    <span className="text-2xl sm:text-3xl font-bold text-amber-600 ">
                      {userInfo?.firstName?.charAt(0)}
                      {userInfo?.lastName?.charAt(0)}
                    </span>
                  </div>
                  {/* Online badge - hidden in mobile */}
                  <div className="hidden sm:flex absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-[3px] border-white items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full" />
                  </div>
                </div>

                {/* Información del usuario */}
                <div className="flex-1 text-white">
                  <h1 className="text-3xl font-bold mb-2">
                    {userInfo?.firstName} {userInfo?.lastName}
                  </h1>
                  <div className="hidden sm:block md:flex items-center space-x-4 text-amber-100">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <span>{userInfo?.email}</span>
                    </div>
                    {userInfo?.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{userInfo.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón de editar */}
                <button
                  onClick={handleEditProfile}
                  className="flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 border border-white/30"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar perfil
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de tarjetas de información */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Información Personal */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mr-4">
                <User className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Información Personal
                </h3>
                <p className="text-sm text-gray-500">Datos de tu cuenta</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Nombre completo</span>
                <span className="font-medium text-gray-900">
                  {userInfo?.firstName} {userInfo?.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Email</span>
                <span className="font-medium text-gray-900">
                  {userInfo?.email}
                </span>
              </div>
              {userInfo?.phone && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Teléfono</span>
                  <span className="font-medium text-gray-900">
                    {userInfo.phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actividad y Estadísticas */}
          {/* <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Actividad</h3>
                <p className="text-sm text-gray-500">Historial reciente</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Miembro desde</span>
                <span className="font-medium text-gray-900">Enero 2024</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Último acceso</span>
                <span className="font-medium text-gray-900">Hoy</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Pedidos realizados</span>
                <span className="font-medium text-gray-900">12</span>
              </div>
            </div>
          </div> */}

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Acciones
                </h3>
                <p className="text-sm text-gray-500">Gestiona tu cuenta</p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/cuenta/direccion"
                className="w-full flex items-center p-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-amber-100 transition-colors">
                  <MapPin className="h-5 w-5 text-gray-500 group-hover:text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Mis direcciones</p>
                  <p className="text-sm text-gray-500">Gestionar ubicaciones</p>
                </div>
              </Link>

              <Link
                href="/cuenta/payment-methods"
                className="w-full flex items-center p-3 text-left text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
                  <CreditCard className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Métodos de pago</p>
                  <p className="text-sm text-gray-500">Tarjetas y cuentas</p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center p-3 text-left text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                  <LogOut className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium">Cerrar sesión</p>
                  <p className="text-sm text-red-500">Salir de tu cuenta</p>
                </div>
              </button>
            </div>
          </div>

          {/* Seguridad */}
          {/* <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Seguridad</h3>
                <p className="text-sm text-gray-500">Protege tu cuenta</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Estado de la cuenta</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Verificada
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Último cambio de contraseña</span>
                <span className="font-medium text-gray-900">Hace 30 días</span>
              </div>
            </div>
          </div> */}

          {/* Preferencias */}
        </div>
      </div>

      {/* Modal de edición */}
      {userInfo && (
        <UserEditModal
          user={userInfo}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdateUser}
        />
      )}
    </div>
  );
}

// Componente de skeleton para loading
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          <Skeleton className="h-48 w-full bg-gray-200" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
            >
              <div className="flex items-center mb-6">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="ml-4 flex-1">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
