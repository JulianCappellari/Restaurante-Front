"use client";

import { useState } from "react";
import type React from "react";
import { IUser } from "@/interfaces";
import { putUserByEmail } from "@/actions";
import { Loader2, Save, X } from "lucide-react";

interface Props {
  user: IUser;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: IUser) => void;
}

export default function UserEditModal({ user, isOpen, onClose, onUpdate }: Props) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phone: user.phone || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) nextErrors.firstName = "El nombre es requerido";
    if (!formData.lastName.trim()) nextErrors.lastName = "El apellido es requerido";
    if (!formData.email.trim()) {
      nextErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "El email no es valido";
    }
    if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
      nextErrors.phone = "El telefono no es valido";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const updatedUserData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
      };

      await putUserByEmail(user.id, updatedUserData);
      onUpdate({
        ...user,
        ...updatedUserData,
        phone: updatedUserData.phone ?? "",
      });
      onClose();
    } catch {
      setErrors({
        submit: "Ocurrio un error al actualizar el perfil. Intentalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <h2 className="text-xl font-bold text-gray-950">Editar perfil</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            type="button"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errors.submit}
            </div>
          )}

          <InputField
            id="firstName"
            label="Nombre"
            value={formData.firstName}
            onChange={handleInputChange}
            error={errors.firstName}
          />
          <InputField
            id="lastName"
            label="Apellido"
            value={formData.lastName}
            onChange={handleInputChange}
            error={errors.lastName}
          />
          <InputField
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
          />
          <InputField
            id="phone"
            label="Telefono"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            error={errors.phone}
          />

          <div className="flex justify-end gap-3 border-t pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-5 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center rounded-lg bg-primario-600 px-5 py-2 font-semibold text-white transition hover:bg-primario-700 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primario-200 ${
          error ? "border-red-300" : "border-gray-300"
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
