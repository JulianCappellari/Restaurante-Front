"use client";

import { IAddress } from "@/interfaces";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, MapPin, Home, Navigation, Hash, Mail } from "lucide-react";

export const AddressModal2: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  initialValues,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Omit<IAddress, "id">>({
    defaultValues: initialValues || {},
  });

  useEffect(() => {
    reset(initialValues || {});
  }, [initialValues, reset, open]);

  const handleFormSubmit = (data: Omit<IAddress, "id">) => {
    onSubmit(data);
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {initialValues ? "Editar dirección" : "Agregar nueva dirección"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition p-1 rounded-full hover:bg-gray-100"
            aria-label="Cerrar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Grupo de campos principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Calle */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Navigation className="h-4 w-4 mr-2 text-blue-500" />
                  Calle
                </label>
                <div className="relative">
                  <input
                    {...register("street", {
                      required: "Este campo es obligatorio",
                    })}
                    type="text"
                    placeholder="Ej: Av. Corrientes"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.street
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:ring-blue-200"
                    }`}
                  />
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.street && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.street.message}
                  </p>
                )}
              </div>

              {/* Altura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Hash className="h-4 w-4 mr-2 text-blue-500" />
                  Altura
                </label>
                <input
                  {...register("streetNumber", {
                    required: "Este campo es obligatorio",
                  })}
                  type="text"
                  placeholder="Ej: 1234"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.streetNumber
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                />
                {errors.streetNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.streetNumber.message}
                  </p>
                )}
              </div>

              {/* Código Postal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-blue-500" />
                  Código Postal
                </label>
                <input
                  {...register("postalCode", {
                    required: "Este campo es obligatorio",
                  })}
                  type="text"
                  placeholder="Ej: C1043"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.postalCode
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                />
                {errors.postalCode && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.postalCode.message}
                  </p>
                )}
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Home className="h-4 w-4 mr-2 text-blue-500" />
                  Ciudad
                </label>
                <input
                  {...register("city", {
                    required: "Este campo es obligatorio",
                  })}
                  type="text"
                  placeholder="Ej: Buenos Aires"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.city
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.city.message}
                  </p>
                )}
              </div>

              {/* Provincia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia
                </label>
                <input
                  {...register("province", {
                    required: "Este campo es obligatorio",
                  })}
                  type="text"
                  placeholder="Ej: CABA"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.province
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                />
                {errors.province && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.province.message}
                  </p>
                )}
              </div>
            </div>

            {/* Campos opcionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Piso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Piso (opcional)
                </label>
                <input
                  {...register("floor")}
                  type="text"
                  placeholder="Ej: 3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento (opcional)
                </label>
                <input
                  {...register("apartment")}
                  type="text"
                  placeholder="Ej: B"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-6 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg text-white transition ${
                  isSubmitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } flex items-center justify-center min-w-[120px]`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  "Guardar dirección"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};