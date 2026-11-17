"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { getAllAddressByUserId } from "@/actions/direccion/get-address-by-user-id";
import { IAddress } from "@/interfaces";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken";
import { createAddressById } from "@/actions/direccion/create-address-by-id";
import { putAddressById } from "@/actions/direccion/put-address-by-id";
import { getAddressById } from "@/actions/direccion/get-address-by-id";
import { deleteAddressById } from "@/actions/direccion/delete-address-by-id";
import { AddressModal2 } from "@/components/direccion/AddressModal2";
import { Skeleton } from "@/components";

const DireccionPage = () => {
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<IAddress | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    setUserId(getUserIdFromToken());
  }, []);

  const fetchAddresses = async (id: number | null) => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getAllAddressByUserId(id);
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al obtener direcciones:", error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses(userId);
  }, [userId]);

  const handleAdd = () => {
    setSelectedAddress(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = async (id: number) => {
    try {
      const address = await getAddressById(id);
      setSelectedAddress(address);
      setIsEditing(true);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error al obtener la direccion:", error);
      alert("No se pudo cargar la direccion para editar.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAddress(null);
    setIsEditing(false);
  };

  const handleSubmitAddress = async (newAddress: Omit<IAddress, "id">) => {
    if (!userId) return;
    const payload = {
      ...newAddress,
      userId,
      floor: newAddress.floor ?? null,
      apartment: newAddress.apartment ?? null,
    };

    try {
      if (isEditing && selectedAddress) {
        await putAddressById(selectedAddress.id, payload);
      } else {
        await createAddressById(payload);
      }
      await fetchAddresses(userId);
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar direccion:", error);
      alert("Hubo un error al guardar la direccion.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Estas seguro de que deseas eliminar esta direccion?")) return;
    try {
      await deleteAddressById(id);
      await fetchAddresses(userId);
    } catch (error) {
      console.error("Error al eliminar la direccion:", error);
      alert("No se pudo eliminar la direccion.");
    }
  };

  return (
    <div className="customer-shell py-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 data-split className="mt-2 text-4xl leading-tight text-cliente-ink sm:text-5xl">Mis direcciones</h1>
            <p className="mt-2 text-gray-600">
              Gestiona los lugares donde queres recibir tus pedidos.
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primario-600 px-5 py-3 font-semibold text-white transition hover:bg-primario-700"
            type="button"
          >
            <PlusCircle className="h-5 w-5" />
            Nueva direccion
          </button>
        </header>

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-44 w-full rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="rounded-lg border bg-white p-10 text-center shadow-sm">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-2xl font-bold text-gray-950">
                No tenes direcciones guardadas
              </h3>
              <p className="mt-2 text-gray-600">
                Agrega una direccion para usarla en el checkout.
              </p>
              <button
                onClick={handleAdd}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primario-600 px-5 py-3 font-semibold text-white transition hover:bg-primario-700"
                type="button"
              >
                <PlusCircle className="h-5 w-5" />
                Agregar primera direccion
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {addresses.map((address) => (
                <article
                  key={address.id}
                  className="rounded-2xl border border-cliente-line bg-white p-5 transition hover:border-primario-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-primario-50 text-primario-700">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-bold text-gray-950">
                        {address.street} {address.streetNumber}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {address.city}, {address.province}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Chip>CP {address.postalCode}</Chip>
                        {address.floor && <Chip>Piso {address.floor}</Chip>}
                        {address.apartment && <Chip>Depto {address.apartment}</Chip>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-2 border-t pt-4">
                    <button
                      onClick={() => handleEdit(address.id)}
                      className="rounded-lg p-2 text-gray-600 transition hover:bg-primario-50 hover:text-primario-700"
                      aria-label="Editar direccion"
                      type="button"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                      aria-label="Eliminar direccion"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddressModal2
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAddress}
        initialValues={selectedAddress || undefined}
      />
    </div>
  );
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-gray-600">
      {children}
    </span>
  );
}

export default DireccionPage;
