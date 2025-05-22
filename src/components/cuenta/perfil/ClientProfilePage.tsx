'use client';

import { putUserByEmail } from '@/actions';
import { useUserInfo } from '@/hooks/useUserInfo';
import { IUser } from '@/interfaces';
import { User, Mail, Edit, Settings, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface Props {
  userEmail: string;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
);
export default function ClientProfilePage({ userEmail }: Props) {
  const { userInfo, loading } = useUserInfo(userEmail);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async(id: number) => {
    try {
      setIsEditing(true)
      setModalIsOpen(true)
    } catch (error) {
      alert("No se pudo cargar el usuario para editar.");
    }
  }

  const handleCloseModal = () => {
    setModalIsOpen(false)
    setIsEditing(false)
  }


  const handleSubmitUser = async(newUser: Omit<IUser, "id">) => {
    try {
      if(isEditing && userInfo){
        await putUserByEmail(userInfo.id, newUser)
      }
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
      alert("Ocurrió un error al actualizar el perfil");
    }
  }

  console.log(userInfo);
  if (loading) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header con foto de portada */}
          {/* <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            <div className="absolute -bottom-16 left-8">
              <Avatar className="h-32 w-32 border-4 border-white">
                <AvatarImage src={userInfo?.profileImage} />
                <AvatarFallback className="bg-indigo-100 text-indigo-600 text-4xl font-semibold">
                  {userInfo?.firstName?.charAt(0)}
                  {userInfo?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div> */}

          {/* Contenido principal */}
          <div className="pt-20 px-8 pb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userInfo?.firstName} {userInfo?.lastName}
                </h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <Mail className="h-5 w-5 mr-2" />
                  <span>{userInfo?.email}</span>
                </div>
              </div>
              
              <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Edit className="h-4 w-4 mr-2" />
                Editar perfil
              </button>
            </div>

            {/* Secciones del dashboard */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tarjeta de información personal */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
                  <User className="h-5 w-5 mr-2 text-indigo-600" />
                  Información Personal
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Nombre completo</p>
                    <p className="font-medium">
                      {userInfo?.firstName} {userInfo?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Numero de telefono</p>
                    <p className="font-medium">
                      {userInfo?.phone} 
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Correo electrónico</p>
                    <p className="font-medium">{userInfo?.email}</p>
                  </div>
                </div>
              </div>

              {/* Tarjeta de estadísticas (puedes personalizar) */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Actividad
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Miembro desde</span>
                    <span className="font-medium">Ene 2023</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Último acceso</span>
                    <span className="font-medium">Hoy</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de acciones rápidas */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Acciones
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="h-5 w-5 mr-2 text-gray-500" />
                    Configuración
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <LogOut className="h-5 w-5 mr-2 text-gray-500" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de skeleton para loading
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <Skeleton className="h-48 w-full bg-gray-200" />
          
          <div className="pt-20 px-8 pb-8">
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-5 w-48" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}