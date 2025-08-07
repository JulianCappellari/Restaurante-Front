"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, PlusCircle, Star, Trash2, CheckCircle } from "lucide-react";
// Simula tus acciones reales
// import { getAllPaymentMethods, addPaymentMethod, deletePaymentMethod, setPreferredPaymentMethod } from "@/actions/payment-methods";
import { Skeleton } from "@/components";
import { getPaymentMethods } from "@/actions/payment-methods/get-payment-methods";
import { postPaymentMethod } from "@/actions/payment-methods/post-payment.methods";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken";
import { deletePymentMethod } from "@/actions/payment-methods/delete-payment.method";
import ModalConfirmDelete from "@/components/ui/ModalConfirmDelete";




import ToastAlert from "@/components/ui/ToastAlert";

export default function PaymentMethodsPage() {
  // Recarga métodos de pago desde backend
  const reloadPaymentMethods = async () => {
    setLoading(true);
    try {
      const data = await getPaymentMethods();
      setPaymentMethods(data);
    } catch (err) {
      // Podés mostrar error si querés
    } finally {
      setLoading(false);
    }
  };
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newExpMonth, setNewExpMonth] = useState("");
  const [newExpYear, setNewExpYear] = useState("");
  const [newCvv, setNewCvv] = useState("");
  const [errors, setErrors] = useState<{name?: string; cardNumber?: string; cvv?: string}>({});

  // Simula fetch inicial
  useEffect(() => {
    
    getPaymentMethods()
      .then((data) => setPaymentMethods(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Agregar método de pago
  const handleAdd = async () => {
    console.log("[handleAdd] Inicio", { newName, newCardNumber, newExpMonth, newExpYear, newCvv });
    const newErrors: {name?: string; cardNumber?: string; cvv?: string} = {};
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(newName)) {
      newErrors.name = "El nombre solo puede contener letras y espacios.";
    }
    if (!/^\d{16}$/.test(newCardNumber)) {
      newErrors.cardNumber = "El número de tarjeta debe tener 16 dígitos numéricos.";
    }
    if (!/^\d{3,4}$/.test(newCvv)) {
      newErrors.cvv = "El CVV debe tener 3 o 4 dígitos numéricos.";
    }
    if (!newName) newErrors.name = "El nombre es obligatorio.";
    if (!newCardNumber) newErrors.cardNumber = "El número de tarjeta es obligatorio.";
    if (!newExpMonth || !newExpYear) newErrors.cardNumber = "La fecha de vencimiento es obligatoria.";
    if (!newCvv) newErrors.cvv = "El CVV es obligatorio.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.log("[handleAdd] Errores de validación", newErrors);
      return;
    }

    const expirationDate = `${newExpMonth}/${newExpYear.slice(-2)}`;

    const userId = getUserIdFromToken();
    if (!userId) {
      alert("No se pudo identificar el usuario. Por favor, inicia sesión nuevamente.");
      console.log("[handleAdd] No se pudo obtener userId");
      return;
    }
    try {
      const payload = {
        name: newName,
        cardHolderName: newName,
        cardNumber: newCardNumber,
        last4: newCardNumber.slice(-4),
        expirationDate,
        cvv: newCvv,
        status: "true",
        userId,
      };
      console.log("[handleAdd] Enviando payload a postPaymentMethod", payload);
      await postPaymentMethod(payload);
      await reloadPaymentMethods();
      setNewName("");
      setNewCardNumber("");
      setNewExpMonth("");
      setNewExpYear("");
      setNewCvv("");
      setShowSuccess(true);
    } catch (error) {
      console.error("[handleAdd] Error al agregar la tarjeta", error);
      alert("Error al agregar la tarjeta. Intenta nuevamente.");
    } finally {
      setAdding(false);
      console.log("[handleAdd] setAdding(false)");
    }
  };

  // Eliminar método de pago
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await deletePymentMethod(deleteId);
        await reloadPaymentMethods();
      } catch (err) {
        alert("Error al eliminar el método de pago.");
      }
    }
    setDeleteModalOpen(false);
    setDeleteId(null);
  };



  // Seleccionar como preferido
  const handleSetPreferred = (id: number) => {
    setPaymentMethods((prev: any[]) =>
      prev.map((m: any) => ({
        ...m,
        preferred: m.id === id,
      }))
    );
  };


  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <>
      <ModalConfirmDelete
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeleteId(null); }}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar método de pago?"
        description="Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este método de pago?"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Métodos de Pago</h1>
            <p className="text-gray-500 mt-1">Administra tus tarjetas y cuentas guardadas</p>
          </div>
        </div>

        {/* Agregar método */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-blue-500" />
            Agregar nuevo método de pago
          </h2>
           <form
             className="flex flex-col gap-4"
             onSubmit={e => {
               e.preventDefault();
               handleAdd();
             }}
             autoComplete="off"
           >
             {/* Primera fila */}
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="w-full md:w-1/2 flex flex-col">
              <input
                type="text"
                placeholder="Nombre en la tarjeta"
                className={`border rounded-lg px-4 py-2 w-full ${errors.name ? 'border-red-500' : ''}`}
                value={newName}
                onChange={e => setNewName(e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, ""))}
                disabled={adding}
                required
                maxLength={64}
                autoComplete="cc-name"
              />
              {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name}</span>}
            </div>
              <div className="w-full md:w-1/2 flex flex-col">
                <input
                  type="text"
                  placeholder="Número de tarjeta"
                  className={`border rounded-lg px-4 py-2 w-full ${errors.cardNumber ? 'border-red-500' : ''}`}
                  value={newCardNumber}
                  onChange={e => setNewCardNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 16))}
                  disabled={adding}
                  required
                  maxLength={16}
                  inputMode="numeric"
                  pattern="^\d{16}$"
                  title="16 dígitos"
                  autoComplete="cc-number"
                />
                {errors.cardNumber && <span className="text-red-500 text-xs mt-1">{errors.cardNumber}</span>}
              </div>
            </div>
            {/* Segunda fila */}
            <div className="flex flex-col md:flex-row gap-4 w-full">
              {/* Select personalizado para mes */}
              <select
                className="border rounded-lg px-4 py-2 w-full md:w-1/6 bg-white"
                value={newExpMonth}
                onChange={e => setNewExpMonth(e.target.value)}
                disabled={adding}
                required
              >
                <option value="" disabled>Mes</option>
                {[...Array(12)].map((_, i) => {
                  const mes = (i + 1).toString().padStart(2, '0');
                  return <option key={mes} value={mes}>{mes}</option>;
                })}
              </select>
              {/* Select personalizado para año */}
              <select
                className="border rounded-lg px-4 py-2 w-full md:w-1/6 bg-white"
                value={newExpYear}
                onChange={e => setNewExpYear(e.target.value)}
                disabled={adding}
                required
              >
                <option value="" disabled>Año</option>
                {Array.from({length: 15}, (_, i) => {
                  const year = (new Date().getFullYear() + i).toString();
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
              <div className="w-full md:w-1/6 flex flex-col">
                <input
                  type="text"
                  placeholder="CVV"
                  className={`border rounded-lg px-4 py-2 w-full ${errors.cvv ? 'border-red-500' : ''}`}
                  value={newCvv}
                  onChange={e => setNewCvv(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  disabled={adding}
                  required
                  maxLength={4}
                  inputMode="numeric"
                  pattern="^\d{3,4}$"
                  title="3 o 4 dígitos"
                  autoComplete="cc-csc"
                />
                {errors.cvv && <span className="text-red-500 text-xs mt-1">{errors.cvv}</span>}
              </div>
            </div>
             <div className="flex items-center gap-3 mt-2">
               <button
                 type="submit"
                 className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg inline-flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                 disabled={adding}
               >
                 <PlusCircle className="h-5 w-5" />
                 {adding ? "Agregando..." : "Agregar"}
               </button>
               <div className="relative">
                 <ToastAlert open={showSuccess} message="¡Tarjeta agregada correctamente!" type="success" onClose={() => setShowSuccess(false)} />
               </div>
             </div>
          </form>
        </div>

        {/* Lista de métodos */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No tienes métodos de pago guardados</h3>
            <p className="text-gray-500 mt-2 mb-4">Agrega una tarjeta o cuenta para comenzar</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`bg-white rounded-xl p-5 flex items-center justify-between shadow-sm border border-gray-200 transition-all ${
                  method.preferred ? "border-blue-500 ring-2 ring-blue-200" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <CreditCard className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{method.type}</span>
                      {method.preferred && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          <Star className="h-3 w-3" /> Preferido
                        </span>
                      )}
                    </div>
                    <span className="text-gray-500 text-sm">•••• {method.last4}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.preferred && (
                    <button
                      onClick={() => handleSetPreferred(method.id)}
                      className="text-blue-600 hover:text-blue-800 transition p-2 rounded-full hover:bg-blue-50"
                      aria-label="Seleccionar como preferido"
                      title="Seleccionar como preferido"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="text-red-600 hover:text-red-800 transition p-2 rounded-full hover:bg-red-50"
                    aria-label="Eliminar método de pago"
                    title="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}