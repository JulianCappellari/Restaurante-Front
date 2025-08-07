"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, PlusCircle, DollarSign, X } from "lucide-react";
import { postPaymentMethod } from "@/actions/payment-methods/post-payment.methods";
import { getPaymentMethods } from "@/actions/payment-methods/get-payment-methods";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken";
import router from "next/router";

export default function PaymentMethod() {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [newCard, setNewCard] = useState({ type: "", last4: "" });

  const [name, setName] = useState("");
const [cardNumber, setCardNumber] = useState("");
const [expMonth, setExpMonth] = useState("");
const [expYear, setExpYear] = useState("");
const [cvv, setCvv] = useState("");
const [errors, setErrors] = useState<any>({});
const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const newErrors: any = {};
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(name)) {
    newErrors.name = "El nombre solo puede contener letras y espacios.";
  }
  if (!/^\d{16}$/.test(cardNumber)) {
    newErrors.cardNumber = "El número de tarjeta debe tener 16 dígitos numéricos.";
  }
  if (!/^\d{2}$/.test(expMonth) || +expMonth < 1 || +expMonth > 12) {
    newErrors.expMonth = "Mes inválido.";
  }
  if (!/^\d{4}$/.test(expYear)) {
    newErrors.expYear = "Año inválido.";
  }
  if (!/^\d{3,4}$/.test(cvv)) {
    newErrors.cvv = "El CVV debe tener 3 o 4 dígitos numéricos.";
  }
  setErrors(newErrors);
  if (Object.keys(newErrors).length) return;

  setLoading(true);
  try {
    const expirationDate = `${expMonth}/${expYear}`;
    const userId = getUserIdFromToken();
    await postPaymentMethod({
      name,
      cardNumber,
      expirationDate,
      cvv,
      status: "true",
      userId,
    });
    // Recarga métodos de pago reales
    const updated = await getPaymentMethods();
    setPaymentMethods(updated);
    setShowModal(false);
    setName(""); setCardNumber(""); setExpMonth(""); setExpYear(""); setCvv("");
    // Opcional: mostrar feedback de éxito
  } catch (error) {
    alert("Error al agregar la tarjeta. Intenta nuevamente.");
  } finally {
    setLoading(false);
  }
};

  // Cargar métodos de pago reales
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const data = await getPaymentMethods();
        setPaymentMethods(data);
      } catch (e) {
        setPaymentMethods([]);
      }
    };
    fetchMethods();
  }, []);

  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const handleSelect = (id: string) => setSelected(id);

  const handleAddCard = () => {
    if (newCard.type && newCard.last4.length === 4) {
      setPaymentMethods([
        ...paymentMethods,
        { id: Date.now(), ...newCard },
      ]);
      setShowModal(false);
      setNewCard({ type: "", last4: "" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-2 py-8">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Seleccioná un método de pago
        </h2>
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleSelect(method.id.toString())}
              className={`flex items-center w-full p-4 rounded-lg border transition-colors
                ${
                  selected === method.id.toString()
                    ? "border-primario-500 bg-primario-50"
                    : "border-gray-200 hover:border-primario-300"
                }
              `}
              aria-pressed={selected === method.id.toString()}
            >
              <CreditCard className="text-primario-500 mr-3" size={28} />
              <span className="flex-1 text-left font-medium text-gray-800">
                {method.type} •••• {method.last4}
              </span>
              {selected === method.id.toString() && (
                <span className="ml-2 text-primario-500 font-bold">✓</span>
              )}
            </button>
          ))}

          {/* Opción de pago en efectivo */}
          <button
            onClick={() => handleSelect("cash")}
            className={`flex items-center w-full p-4 rounded-lg border transition-colors
              ${
                selected === "cash"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-green-300"
              }
            `}
            aria-pressed={selected === "cash"}
          >
            <DollarSign className="text-green-600 mr-3" size={28} />
            <span className="flex-1 text-left font-medium text-gray-800">
              Pagar en efectivo
            </span>
            {selected === "cash" && (
              <span className="ml-2 text-green-600 font-bold">✓</span>
            )}
          </button>
        </div>

        {/* Botón para agregar nuevo método */}
        <button
          className="flex items-center justify-center w-full mt-6 py-3 rounded-lg border-2 border-dashed border-primario-400 text-primario-500 font-semibold bg-primario-50 hover:bg-primario-100 transition-colors"
          onClick={() => setShowModal(true)}
        >
          <PlusCircle className="mr-2" size={24} />
          Agregar nuevo método de pago
        </button>

        {/* Botón de confirmar */}
        <button
          disabled={!selected}
          className={`w-full mt-6 py-3 rounded-lg font-medium text-lg transition-colors shadow-md
            ${
              !selected
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-primario-500 hover:bg-primario-600 text-white hover:shadow-lg"
            }
          `}
          onClick={async () => {
            // console.log("[CONFIRMAR] Click en confirmar. selected:", selected);
            if (!selected) {
              // console.log("[CONFIRMAR] No hay método de pago seleccionado");
              return;
            }
            try {
              const userId = getUserIdFromToken();
              // console.log("[CONFIRMAR] userId:", userId);
              // Obtener dirección seleccionada
              const { useCheckoutStore } = await import("@/store/checkout/checkout-store");
              const selectedAddress = useCheckoutStore.getState().selectedAddress;
              // console.log("[CONFIRMAR] selectedAddress:", selectedAddress);
              // Obtener carrito y total
              const { useCartStore } = await import("@/store/cart/cart-store");
              const cart = useCartStore.getState().cart;
              const cartSummary = useCartStore.getState().getCartSummary();
              // console.log("[CONFIRMAR] cart:", cart);
              // console.log("[CONFIRMAR] cartSummary:", cartSummary);

              // Armar items
              const items = cart.map((item) => ({
                menuId: item.id,
                quantity: item.quantity,
                notes: ""
              }));
              // console.log("[CONFIRMAR] items armados:", items);

              // Determinar tipo de pago y método
              let paymentType: "cash" | "card" | "mp" = "cash";
              let paymentMethodId: number | null = null;
              if (selected === "cash") {
                paymentType = "cash";
                paymentMethodId = null;
                // console.log("[CONFIRMAR] Pago en efectivo");
              } else {
                paymentType = "card";
                paymentMethodId = Number(selected);
                // console.log("[CONFIRMAR] Pago con tarjeta, id:", paymentMethodId);
              }

              // Payload para la orden
              const payload = {
                customerId: userId,
                date: new Date().toISOString(),
                state: "received",
                total_amount: cartSummary.total,
                deliveryType: selectedAddress ? "delivery" : "in_place",
                addressId: selectedAddress ? selectedAddress.id : null,
                paymentType,
                paymentMethodId,
                items,
              };
              // console.log("[CONFIRMAR] Payload final:", payload);
              const { postOrder } = await import("@/actions/orders/post-order");
              const result = await postOrder(payload);
              // console.log("[CONFIRMAR] Respuesta postOrder:", result);
              // Limpiar carrito
              useCartStore.getState().clearCart();
              setShowSuccess(true);
              setTimeout(() => {
                router.push("/cuenta/ordenes");
              }, 2000);
            } catch (e) {
              // console.error("[CONFIRMAR] Error al crear la orden:", e);
              alert("Error al crear la orden. Intenta nuevamente.");
            }
          }}
        >
          Confirmar
        </button>
      </div>

      {/* Modal de éxito */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center animate-fade-in">
            <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2l4-4" />
            </svg>
            <h2 className="text-2xl font-bold text-green-600 mb-2">¡Orden creada con éxito!</h2>
            <p className="text-gray-600">Redirigiendo a tus pedidos...</p>
          </div>
        </div>
      )}

      {/* Modal para agregar tarjeta */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              <X size={24} />
            </button>
            <h3 className="text-lg font-bold mb-4 text-gray-800">Agregar tarjeta</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Nombre en la tarjeta</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Número de tarjeta</label>
                <input
                  type="text"
                  maxLength={16}
                  className="w-full border rounded-lg px-3 py-2"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                  disabled={loading}
                />
                {errors.cardNumber && <p className="text-red-500 text-xs">{errors.cardNumber}</p>}
              </div>
              <div className="flex gap-2">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Mes</label>
                  <select
  className="w-full border rounded-lg px-3 py-2"
  value={expMonth}
  onChange={e => setExpMonth(e.target.value)}
  disabled={loading}
>
  <option value="">Mes</option>
  {[...Array(12)].map((_, i) => {
    const m = (i + 1).toString().padStart(2, "0");
    return <option key={m} value={m}>{m}</option>;
  })}
</select>
                  {errors.expMonth && <p className="text-red-500 text-xs">{errors.expMonth}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Año</label>
                  <select
  className="w-full border rounded-lg px-3 py-2"
  value={expYear}
  onChange={e => setExpYear(e.target.value)}
  disabled={loading}
>
  <option value="">Año</option>
  {(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 15 }, (_, i) => {
    const y = currentYear + i;
    return <option key={y} value={y}>{y}</option>;
  });
})()}
</select>
                  {errors.expYear && <p className="text-red-500 text-xs">{errors.expYear}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">CVV</label>
                  <input
                    type="text"
                    maxLength={4}
                    className="w-full border rounded-lg px-3 py-2"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                    disabled={loading}
                  />
                  {errors.cvv && <p className="text-red-500 text-xs">{errors.cvv}</p>}
                </div>
              </div>
              <button
                className="w-full bg-primario-500 hover:bg-primario-600 text-white py-2 rounded-lg font-medium transition-colors mt-2"
                disabled={loading}
                type="submit"
              >
                {loading ? "Guardando..." : "Guardar tarjeta"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Responsive: mobile full width */}
      <style jsx>{`
        @media (max-width: 640px) {
          div[class*="max-w-lg"] {
            max-width: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}