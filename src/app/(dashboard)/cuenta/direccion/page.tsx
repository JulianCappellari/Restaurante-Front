"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, MapPin } from "lucide-react";
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

  const userId = getUserIdFromToken();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    if (!userId) {
      console.warn("No se encontró userId");
      return;
    }
    try {
      const data = await getAllAddressByUserId(Number(userId));
      setAddresses(data);
    } catch (error) {
      console.error("Error al obtener direcciones:", error);
    } finally {
      setLoading(false);
    }
  };

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
      console.error("Error al obtener la dirección:", error);
      alert("No se pudo cargar la dirección para editar.");
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
      userId: Number(userId),
      floor: newAddress.floor ?? null,
      apartment: newAddress.apartment ?? null,
    };
    try {
      if (isEditing && selectedAddress) {
        await putAddressById(selectedAddress.id, payload);
        // toast.success('Dirección editada correctamente');
      } else {
        // console.log("Payload dirección a enviar:", payload);
        await createAddressById(payload);
        // toast.success('Dirección agregada correctamente');
      }
      await fetchAddresses();
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar dirección:", error);
      alert("Hubo un error al guardar la dirección.");
      // toast.error('Hubo un error al guardar la dirección.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta dirección?")) return;
    try {
      await deleteAddressById(id);
      await fetchAddresses();
      // toast.success('Dirección eliminada correctamente');
    } catch (error) {
      console.error("Error al eliminar la dirección:", error);
      alert("No se pudo eliminar la dirección.");
      // toast.error('No se pudo eliminar la dirección.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header mejorado con botón de agregar siempre visible */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mis Direcciones</h1>
            <p className="text-gray-500 mt-1">Administra tus direcciones de envío</p>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg inline-flex items-center gap-2 transition-all shadow-md"
          >
            <PlusCircle className="h-5 w-5" />
            Nueva dirección
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No tienes direcciones guardadas</h3>
            <p className="text-gray-500 mt-2 mb-4">Agrega una dirección para comenzar</p>
            <button
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg inline-flex items-center gap-2 transition-all"
            >
              <PlusCircle className="h-5 w-5" />
              Agregar primera dirección
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-xl p-6 relative transition-all hover:shadow-lg border border-gray-200 hover:border-blue-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">
                      {address.street} {address.streetNumber}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.city}, {address.province}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">CP: {address.postalCode}</span>
                      {address.floor && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">Piso: {address.floor}</span>}
                      {address.apartment && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">Depto: {address.apartment}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(address.id)}
                    className="text-blue-600 hover:text-blue-800 transition p-2 rounded-full hover:bg-blue-50"
                    aria-label="Editar dirección"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-red-600 hover:text-red-800 transition p-2 rounded-full hover:bg-red-50"
                    aria-label="Eliminar dirección"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {/* Tarjeta para agregar nueva dirección */}
            <button
              onClick={handleAdd}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="bg-blue-100 group-hover:bg-blue-200 p-3 rounded-full transition-all">
                <PlusCircle className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
              </div>
              <span className="font-medium text-gray-700 group-hover:text-blue-600">
                Agregar nueva dirección
              </span>
            </button>
          </div>
        )}
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

export default DireccionPage;