"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, CreditCard, Loader2, PlusCircle, Star, Trash2 } from "lucide-react";
import { Skeleton } from "@/components";
import { getPaymentMethods } from "@/actions/payment-methods/get-payment-methods";
import { postPaymentMethod } from "@/actions/payment-methods/post-payment.methods";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken";
import { deletePymentMethod } from "@/actions/payment-methods/delete-payment.method";
import ModalConfirmDelete from "@/components/ui/ModalConfirmDelete";
import ToastAlert from "@/components/ui/ToastAlert";
import { IPaymentMethod } from "@/interfaces";

type Errors = {
  name?: string;
  cardNumber?: string;
  expiration?: string;
  cvv?: string;
};

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<IPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newExpMonth, setNewExpMonth] = useState("");
  const [newExpYear, setNewExpYear] = useState("");
  const [newCvv, setNewCvv] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const reloadPaymentMethods = async () => {
    setLoading(true);
    try {
      const data = await getPaymentMethods();
      setPaymentMethods(data);
    } catch {
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadPaymentMethods();
  }, []);

  const validate = () => {
    const nextErrors: Errors = {};

    if (!/^[A-Za-z\s]+$/.test(newName.trim())) {
      nextErrors.name = "El nombre solo puede contener letras y espacios.";
    }
    if (!/^\d{16}$/.test(newCardNumber)) {
      nextErrors.cardNumber = "La tarjeta debe tener 16 digitos.";
    }
    if (!newExpMonth || !newExpYear) {
      nextErrors.expiration = "La fecha de vencimiento es obligatoria.";
    }
    if (!/^\d{3,4}$/.test(newCvv)) {
      nextErrors.cvv = "El CVV debe tener 3 o 4 digitos.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;

    const userId = getUserIdFromToken();
    if (!userId) {
      alert("No se pudo identificar el usuario. Inicia sesion nuevamente.");
      return;
    }

    setAdding(true);
    try {
      const expirationDate = `${newExpMonth}/${newExpYear.slice(-2)}`;
      await postPaymentMethod({
        name: "Tarjeta",
        type: "card",
        cardHolderName: newName.trim(),
        cardNumber: newCardNumber,
        last4: newCardNumber.slice(-4),
        expirationDate,
        cvv: newCvv,
        status: true,
        userId,
      });
      await reloadPaymentMethods();
      setNewName("");
      setNewCardNumber("");
      setNewExpMonth("");
      setNewExpYear("");
      setNewCvv("");
      setShowSuccess(true);
    } catch (error) {
      console.error("Error al agregar la tarjeta", error);
      alert("Error al agregar la tarjeta. Intenta nuevamente.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await deletePymentMethod(deleteId);
        await reloadPaymentMethods();
      } catch {
        alert("Error al eliminar el metodo de pago.");
      }
    }
    setDeleteModalOpen(false);
    setDeleteId(null);
  };

  const handleSetPreferred = (id: number) => {
    setPaymentMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  return (
    <>
      <ModalConfirmDelete
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar metodo de pago"
        description="Esta accion no se puede deshacer. Queres eliminar este metodo de pago?"
      />

      <div className="customer-shell py-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <header>
            <h1 data-split className="mt-2 text-4xl leading-tight text-cliente-ink sm:text-5xl">Metodos de pago</h1>
            <p className="mt-2 text-gray-600">
              Guarda tarjetas para acelerar tus proximos pedidos.
            </p>
          </header>

          <section className="mt-8 rounded-2xl border border-cliente-line bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <PlusCircle className="h-5 w-5 text-primario-700" />
              Agregar tarjeta
            </h2>
            <form
              className="mt-5 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleAdd();
              }}
              autoComplete="off"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre en la tarjeta" error={errors.name}>
                  <input
                    type="text"
                    className="w-full rounded-lg border px-4 py-2.5"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value.replace(/[^A-Za-z\s]/g, ""))}
                    disabled={adding}
                    autoComplete="cc-name"
                  />
                </Field>
                <Field label="Numero de tarjeta" error={errors.cardNumber}>
                  <input
                    type="text"
                    className="w-full rounded-lg border px-4 py-2.5"
                    value={newCardNumber}
                    onChange={(event) =>
                      setNewCardNumber(event.target.value.replace(/\D/g, "").slice(0, 16))
                    }
                    disabled={adding}
                    inputMode="numeric"
                    autoComplete="cc-number"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                <Field label="Mes" error={errors.expiration}>
                  <select
                    className="w-full rounded-lg border px-4 py-2.5"
                    value={newExpMonth}
                    onChange={(event) => setNewExpMonth(event.target.value)}
                    disabled={adding}
                  >
                    <option value="">Mes</option>
                    {Array.from({ length: 12 }, (_, index) => {
                      const month = String(index + 1).padStart(2, "0");
                      return (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      );
                    })}
                  </select>
                </Field>
                <Field label="Ano">
                  <select
                    className="w-full rounded-lg border px-4 py-2.5"
                    value={newExpYear}
                    onChange={(event) => setNewExpYear(event.target.value)}
                    disabled={adding}
                  >
                    <option value="">Ano</option>
                    {Array.from({ length: 15 }, (_, index) => {
                      const year = String(new Date().getFullYear() + index);
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </Field>
                <Field label="CVV" error={errors.cvv}>
                  <input
                    type="text"
                    className="w-full rounded-lg border px-4 py-2.5"
                    value={newCvv}
                    onChange={(event) => setNewCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    disabled={adding}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                  />
                </Field>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primario-600 px-5 font-semibold text-white transition hover:bg-primario-700 disabled:opacity-60"
                  disabled={adding}
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  {adding ? "Agregando" : "Agregar"}
                </button>
              </div>
            </form>
            <ToastAlert
              open={showSuccess}
              message="Tarjeta agregada correctamente."
              type="success"
              onClose={() => setShowSuccess(false)}
            />
          </section>

          <section className="mt-8">
            {loading ? (
              <div className="grid gap-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-lg bg-gray-200" />
                ))}
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="rounded-lg border bg-white p-10 text-center shadow-sm">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-2xl font-bold text-gray-950">
                  No tenes metodos de pago guardados
                </h3>
                <p className="mt-2 text-gray-600">
                  Agrega una tarjeta para usarla en el checkout.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {paymentMethods.map((method) => (
                  <article
                    key={method.id}
                    className={`flex flex-col gap-4 rounded-2xl border border-cliente-line bg-white p-5 transition sm:flex-row sm:items-center sm:justify-between ${
                      method.isDefault ? "border-primario-400 ring-2 ring-primario-100" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-lg bg-primario-50 text-primario-700">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gray-950">
                            {method.cardHolderName || method.name || "Tarjeta"}
                          </span>
                          {method.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primario-50 px-2 py-0.5 text-xs font-semibold text-primario-700">
                              <Star className="h-3 w-3" />
                              Preferida
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          Terminada en {method.last4 || "----"}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetPreferred(method.id)}
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-primario-50 hover:text-primario-700"
                          aria-label="Seleccionar como preferido"
                          title="Seleccionar como preferido"
                          type="button"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(method.id)}
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                        aria-label="Eliminar metodo de pago"
                        title="Eliminar"
                        type="button"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
