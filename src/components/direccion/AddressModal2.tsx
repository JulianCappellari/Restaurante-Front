"use client";

import { IAddress } from "@/interfaces";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, MapPin, Home, Navigation, Hash, Mail } from "lucide-react";

export type AddressFormValues = Omit<IAddress, "id">;

export type AddressModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormValues) => void | Promise<void>;
  initialValues?: IAddress;
};

export const AddressModal2: React.FC<AddressModalProps> = ({
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
  } = useForm<AddressFormValues>({
    defaultValues: initialValues || {},
  });

  useEffect(() => {
    reset(initialValues || {});
  }, [initialValues, reset, open]);

  const handleFormSubmit = async (data: AddressFormValues) => {
    await onSubmit({
      ...data,
      floor: data.floor || null,
      apartment: data.apartment || null,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {initialValues ? "Editar direccion" : "Agregar direccion"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Estos datos se usaran para tus pedidos con envio.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Cerrar modal"
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 flex items-center text-sm font-medium text-gray-700">
                <Navigation className="mr-2 h-4 w-4 text-primario-600" />
                Calle
              </label>
              <div className="relative">
                <input
                  {...register("street", { required: "Este campo es obligatorio" })}
                  type="text"
                  placeholder="Ej: Av. Corrientes"
                  className={`w-full rounded-lg border py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 ${
                    errors.street
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:ring-primario-200"
                  }`}
                />
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              </div>
              {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>}
            </div>

            <div>
              <label className="mb-1 flex items-center text-sm font-medium text-gray-700">
                <Hash className="mr-2 h-4 w-4 text-primario-600" />
                Altura
              </label>
              <input
                {...register("streetNumber", { required: "Este campo es obligatorio" })}
                type="text"
                placeholder="Ej: 1234"
                className={`w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                  errors.streetNumber
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:ring-primario-200"
                }`}
              />
              {errors.streetNumber && <p className="mt-1 text-sm text-red-600">{errors.streetNumber.message}</p>}
            </div>

            <div>
              <label className="mb-1 flex items-center text-sm font-medium text-gray-700">
                <Mail className="mr-2 h-4 w-4 text-primario-600" />
                Codigo postal
              </label>
              <input
                {...register("postalCode", { required: "Este campo es obligatorio" })}
                type="text"
                placeholder="Ej: C1043"
                className={`w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                  errors.postalCode
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:ring-primario-200"
                }`}
              />
              {errors.postalCode && <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>}
            </div>

            <div>
              <label className="mb-1 flex items-center text-sm font-medium text-gray-700">
                <Home className="mr-2 h-4 w-4 text-primario-600" />
                Ciudad
              </label>
              <input
                {...register("city", { required: "Este campo es obligatorio" })}
                type="text"
                placeholder="Ej: Buenos Aires"
                className={`w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                  errors.city
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:ring-primario-200"
                }`}
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Provincia
              </label>
              <input
                {...register("province", { required: "Este campo es obligatorio" })}
                type="text"
                placeholder="Ej: CABA"
                className={`w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-2 ${
                  errors.province
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:ring-primario-200"
                }`}
              />
              {errors.province && <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Piso (opcional)
              </label>
              <input
                {...register("floor")}
                type="text"
                placeholder="Ej: 3"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primario-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Departamento (opcional)
              </label>
              <input
                {...register("apartment")}
                type="text"
                placeholder="Ej: B"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primario-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primario-600 px-5 py-2 font-medium text-white transition hover:bg-primario-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : "Guardar direccion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
