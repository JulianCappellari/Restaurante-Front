"use client";

import { useState } from "react";
import type React from "react";
import { SubmitHandler, UseFormRegisterReturn, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { UserRoles } from "@/interfaces";
import { postRegister } from "@/actions";
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface InputFormulario {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export default function FormularioDeRegistro({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<InputFormulario>({
    defaultValues: {
      terms: false,
    },
  });

  const password = watch("password");

  const onSubmit: SubmitHandler<InputFormulario> = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", {
        type: "validate",
        message: "Las contrasenas no coinciden",
      });
      return;
    }

    if (!data.terms) {
      setError("terms", {
        type: "validate",
        message: "Debes aceptar los terminos y condiciones",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await postRegister(
        data.firstName,
        data.lastName,
        data.email,
        data.phone,
        data.password,
        UserRoles.CUSTOMER
      );

      if (!response) {
        setError("root", {
          type: "server",
          message: "Hubo un error al registrar el usuario. Intentalo de nuevo.",
        });
        return;
      }

      router.push(`/auth/login?registered=true&redirect=${encodeURIComponent(returnTo)}`);
    } catch {
      setError("root", {
        type: "server",
        message: "Ocurrio un error inesperado. Intentalo mas tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{errors.root.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          id="firstName"
          label="Nombre"
          placeholder="Juan"
          register={register("firstName", { required: "El nombre es obligatorio" })}
          error={errors.firstName?.message}
        />
        <TextField
          id="lastName"
          label="Apellido"
          placeholder="Perez"
          register={register("lastName", { required: "El apellido es obligatorio" })}
          error={errors.lastName?.message}
        />
      </div>

      <TextField
        id="email"
        label="Correo electronico"
        type="email"
        placeholder="example@email.com"
        register={register("email", {
          required: "El correo electronico es obligatorio",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Correo electronico no valido",
          },
        })}
        error={errors.email?.message}
      />

      <TextField
        id="phone"
        label="Telefono"
        type="tel"
        placeholder="+54 9 11 1234-5678"
        register={register("phone", {
          required: "El telefono es obligatorio",
          pattern: {
            value: /^[0-9+\-\s()]+$/,
            message: "Numero de telefono no valido",
          },
          minLength: {
            value: 8,
            message: "El telefono debe tener al menos 8 caracteres",
          },
        })}
        error={errors.phone?.message}
      />

      <PasswordField
        id="password"
        label="Contrasena"
        show={showPassword}
        setShow={setShowPassword}
        register={register("password", {
          required: "La contrasena es obligatoria",
          minLength: {
            value: 8,
            message: "La contrasena debe tener al menos 8 caracteres",
          },
        })}
        error={errors.password?.message}
      />

      <PasswordField
        id="confirmPassword"
        label="Confirmar contrasena"
        show={showConfirmPassword}
        setShow={setShowConfirmPassword}
        register={register("confirmPassword", {
          required: "Confirma tu contrasena",
          validate: (value) => value === password || "Las contrasenas no coinciden",
        })}
        error={errors.confirmPassword?.message}
      />

      <div className="space-y-1.5 pt-2">
        <label className="flex items-start gap-3 text-sm text-gray-600">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primario-600 focus:ring-primario-600"
            {...register("terms", {
              required: "Debes aceptar los terminos y condiciones",
            })}
          />
          <span>
            Acepto los terminos y condiciones y la politica de privacidad.
          </span>
        </label>
        {errors.terms && <p className="text-sm text-red-600">{errors.terms.message}</p>}
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-primario-600 px-4 py-2.5 font-semibold text-white transition hover:bg-primario-700 disabled:pointer-events-none disabled:opacity-60"
        disabled={isLoading}
      >
        {isLoading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}

function TextField({
  id,
  label,
  register,
  error,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="w-full rounded-lg border px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring"
        placeholder={placeholder}
        {...register}
        aria-invalid={error ? "true" : "false"}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function PasswordField({
  id,
  label,
  register,
  error,
  show,
  setShow,
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className="w-full rounded-lg border px-4 py-2.5 pr-10 text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring"
          placeholder="********"
          {...register}
          aria-invalid={error ? "true" : "false"}
        />
        <button
          type="button"
          onClick={() => setShow((value) => !value)}
          className="absolute inset-y-0 right-2 flex items-center px-2 text-neutral-400 hover:text-neutral-600"
          aria-label={show ? "Ocultar contrasena" : "Mostrar contrasena"}
        >
          {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
