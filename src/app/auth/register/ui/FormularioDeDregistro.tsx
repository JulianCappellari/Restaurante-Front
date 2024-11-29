"use client";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { UserRoles } from "@/interfaces";
import { postRegister } from "@/actions";

interface InputFormulario {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function FormularioDeRegistro() {
  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InputFormulario>();

  const onSubmit: SubmitHandler<InputFormulario> = async (data) => {
    setMensajeError("");
    setMensajeExito("");
    const { firstName, lastName, email, password } = data;

    // Registro con rol por defecto: Customer
    const respuesta = await postRegister(
      firstName,
      lastName,
      email,
      password,
      UserRoles.CUSTOMER
    );

    if (!respuesta) {
      setMensajeError("Hubo un error al registrar el usuario.");
      return;
    }

    setMensajeExito("Usuario registrado exitosamente. ¡Ahora puedes iniciar sesión!");

    reset();
  };

  return (
    <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="firstName">Nombre</label>
      <input
        className={clsx("px-5 py-2 border bg-gray-200 rounded mb-5", {
          "border-red-500": errors.firstName,
        })}
        type="text"
        {...register("firstName", { required: true })}
      />

      <label htmlFor="lastName">Apellido</label>
      <input
        className={clsx("px-5 py-2 border bg-gray-200 rounded mb-5", {
          "border-red-500": errors.lastName,
        })}
        type="text"
        {...register("lastName", { required: true })}
      />

      <label htmlFor="email">Correo Electrónico</label>
      <input
        className={clsx("px-5 py-2 border bg-gray-200 rounded mb-5", {
          "border-red-500": errors.email,
        })}
        type="email"
        {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
      />

      <label htmlFor="password">Contraseña</label>
      <input
        className={clsx("px-5 py-2 border bg-gray-200 rounded mb-5", {
          "border-red-500": errors.password,
        })}
        type="password"
        {...register("password", { required: true, minLength: 6 })}
      />

      <span className="text-red-500 mb-3">{mensajeError}</span>
      <span className="text-green-500 mb-3">{mensajeExito}</span>

      <button type="submit" className="btn-primary">
        Crear cuenta
      </button>

      <div className="flex items-center my-5">
        <div className="flex-1 border-t border-gray-500"></div>
        <div className="px-2 text-gray-800">O</div>
        <div className="flex-1 border-t border-gray-500"></div>
      </div>

      <Link href="/auth/login" className="btn-secondary text-center">
        Ingresar
      </Link>
    </form>
  );
}
