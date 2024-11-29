"use client";

import {  useEffect, useState } from 'react';
import clsx from "clsx";
import Link from "next/link";
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

import {  useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/useLogin';


export const LoginForm = () => {

  const router = useRouter();
  
  const { login, isLoading, errorMessage } = useLogin();
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const success = await login(email, password);
    if (success) {
      setIsAuthenticated(true); // Marca como autenticado
    }
  };
  
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/"); // Redirige después de autenticación exitosa
    }
  }, [isAuthenticated, router]);
  
  

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <label htmlFor="email">Correo electrónico</label>
      <input
        className="px-5 py-2 border bg-gray-200 rounded mb-5"
        type="email"
        name="email"
        required
      />

      <label htmlFor="password">Contraseña</label>
      <input
        className="px-5 py-2 border bg-gray-200 rounded mb-5"
        type="password"
        name="password"
        required
      />

      <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
        {errorMessage && (
          <div className="flex flex-row mb-2 text-red-500">
            <ExclamationCircleIcon className="h-5 w-5" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}
      </div>

      <LoginButton isPending={isLoading} />

      <div className="flex items-center my-5">
        <div className="flex-1 border-t border-gray-500"></div>
        <div className="px-2 text-gray-800">O</div>
        <div className="flex-1 border-t border-gray-500"></div>
      </div>

      <Link href="/auth/register" className="btn-secondary text-center">
        Crear una nueva cuenta
      </Link>
    </form>
  );
};

function LoginButton({ isPending }) {
  return (
    <button
      type="submit"
      className={clsx("btn-primary", { "btn-desabilitado": isPending })}
      disabled={isPending}
    >
      Ingresar
    </button>
  );
}