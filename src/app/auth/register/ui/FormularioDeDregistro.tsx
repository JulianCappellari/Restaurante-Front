"use client";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
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

export default function FormularioDeRegistro() {
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
        message: "Las contraseñas no coinciden",
      });
      return;
    }

    if (!data.terms) {
      setError("terms", {
        type: "validate",
        message: "Debes aceptar los términos y condiciones",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { firstName, lastName, email, phone, password } = data;
      const respuesta = await postRegister(
        firstName,
        lastName,
        email,
        phone,
        password,
        UserRoles.CUSTOMER
      );

      if (!respuesta) {
        setError("root", {
          type: "server",
          message: "Hubo un error al registrar el usuario. Por favor, inténtalo de nuevo.",
        });
        return;
      }

      // Redirigir al login con estado de éxito
      router.push("/auth/login?registered=true");
    } catch (error) {
      setError("root", {
        type: "server",
        message: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
          <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{errors.root.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="firstName" className="text-sm font-medium">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            className="w-full rounded-xl border px-4 py-2.5 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring"
            placeholder="Juan"
            {...register("firstName", { required: "El nombre es obligatorio" })}
            aria-invalid={errors.firstName ? "true" : "false"}
          />
          {errors.firstName && (
            <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="lastName" className="text-sm font-medium">
            Apellido <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            className="w-full rounded-xl border px-4 py-2.5 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring"
            placeholder="Pérez"
            {...register("lastName", { required: "El apellido es obligatorio" })}
            aria-invalid={errors.lastName ? "true" : "false"}
          />
          {errors.lastName && (
            <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Correo electrónico <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          className="w-full rounded-xl border px-4 py-2.5 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring"
          placeholder="example@email.com"
          {...register("email", {
            required: "El correo electrónico es obligatorio",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Correo electrónico no válido",
            },
          })}
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-sm font-medium">
          Teléfono <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          className="w-full rounded-xl border px-4 py-2.5 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring"
          placeholder="+54 9 11 1234-5678"
          {...register("phone", {
            required: "El teléfono es obligatorio",
            pattern: {
              value: /^[0-9+\-\s()]+$/,
              message: "Número de teléfono no válido",
            },
            minLength: {
              value: 8,
              message: "El teléfono debe tener al menos 8 caracteres",
            },
          })}
          aria-invalid={errors.phone ? "true" : "false"}
        />
        {errors.phone && (
          <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className="w-full rounded-xl border px-4 py-2.5 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring pr-10"
            placeholder="••••••••"
            {...register("password", {
              required: "La contraseña es obligatoria",
              minLength: {
                value: 8,
                message: "La contraseña debe tener al menos 8 caracteres",
              },
            })}
            aria-invalid={errors.password ? "true" : "false"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-2 flex items-center px-2 text-neutral-400 hover:text-neutral-600"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirmar contraseña <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            className="w-full rounded-xl border px-4 py-2.5 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:focus-ring pr-10"
            placeholder="••••••••"
            {...register("confirmPassword", {
              required: "Por favor confirma tu contraseña",
              validate: (value) =>
                value === password || "Las contraseñas no coinciden",
            })}
            aria-invalid={errors.confirmPassword ? "true" : "false"}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-2 flex items-center px-2 text-neutral-400 hover:text-neutral-600"
            aria-label={
              showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5 pt-2">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              {...register("terms", {
                required: "Debes aceptar los términos y condiciones",
              })}
              aria-invalid={errors.terms ? "true" : "false"}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="text-muted-foreground">
              Acepto los{' '}
              <a href="/terminos" className="text-primary hover:underline">
                Términos y Condiciones
              </a>{' '}
              y la{' '}
              <a href="/privacidad" className="text-primary hover:underline">
                Política de Privacidad
              </a>{' '}
              <span className="text-red-500">*</span>
            </label>
            {errors.terms && (
              <p className="text-red-600 mt-1">{errors.terms.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none transition-colors duration-200"
          disabled={isLoading}
        >
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  );
}
