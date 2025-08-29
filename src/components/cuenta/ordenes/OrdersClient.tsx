"use client";
import React, { useState } from "react";
import { IOrder, IOrderItem } from "@/interfaces";
import { AlarmClockCheck, Bike, CheckCircle, ChefHat, ClipboardList } from "lucide-react";
import Image from "next/image";

// Extend the IOrderItem interface to include the menu property
interface OrderItemWithMenu extends IOrderItem {
  menu?: {
    nameDish: string;
    imageUrl?: string;
    ingredients?: Array<{ description: string }>;
  };
}

type OrdersClientProps = {
  orders: Array<Omit<IOrder, 'items'> & { items: OrderItemWithMenu[] }>;
  error: string | null;
};

export default function OrdersClient({ orders, error }: OrdersClientProps) {
  const [tab, setTab] = useState<"actuales" | "entregados">("actuales");
  const actualOrders = orders.filter((o) => o.state !== "delivered");
  const deliveredOrders = orders.filter((o) => o.state === "delivered");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Mis Pedidos</h1>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-10">
        {["actuales", "entregados"].map((type) => (
          <button
            key={type}
            onClick={() => setTab(type as "actuales" | "entregados")}
            className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 
              ${
                tab === type
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {type === "actuales" ? "Actuales" : "Entregados"}
          </button>
        ))}
      </div>

      {/* Mensajes de error o sin pedidos */}
      {error && <div className="text-red-600 text-center mb-4">{error}</div>}

      {!orders.length && !error && (
        <div className="text-gray-500 text-center mt-10">
          No tienes pedidos aún.
        </div>
      )}

      {/* Listado de pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(tab === "actuales" ? actualOrders : deliveredOrders).map((order) => (
          <div
            key={order.id}
            className="w-full max-w-[460px] mx-auto bg-white border border-blue-100 rounded-2xl shadow-lg p-6 group transition hover:shadow-2xl hover:scale-[1.01]"
          >
            

            {/* Icono de estado */}
            <div className="flex flex-col items-center justify-start min-w-[56px] mb-4 md:mb-0">
              <span
                className={`rounded-full p-2 ${
                  order.state === "received"
                    ? "bg-blue-100 text-blue-600"
                    : order.state === "preparing"
                    ? "bg-orange-100 text-orange-600"
                    : order.state === "ready"
                    ? "bg-yellow-100 text-yellow-700"
                    : order.state === "on_the_way"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {order.state === "received" && (
                  <ClipboardList className="w-6 h-6" />
                )}
                {order.state === "preparing" && <ChefHat className="w-6 h-6" />}
                {order.state === "ready" && <AlarmClockCheck className="w-6 h-6" />}
                {order.state === "on_the_way" && <Bike className="w-6 h-6" />}
                {order.state === "delivered" && (
                  <CheckCircle className="w-6 h-6" />
                )}
              </span>
            </div>

            <div className="flex-1 space-y-4">
              {/* Encabezado */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <div>
                  <h2 className="text-lg font-bold text-blue-900">
                    Pedido #{order.id}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {new Date(order.date).toLocaleString()}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {order.deliveryType === "delivery"
                    ? "Envío a domicilio"
                    : "Para retirar en el local"}
                </div>
              </div>

              {/* Estado visual */}
              <span
                className={`inline-block px-4 py-1 rounded-full text-xs font-bold border-2 shadow-sm
                ${
                  order.state === "received"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : order.state === "preparing"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : order.state === "ready"
                    ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                    : order.state === "on_the_way"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "bg-green-50 text-green-700 border-green-200"
                }`}
              >
                {order.state === "received" && "Pedido recibido"}
                {order.state === "preparing" && "En preparación"}
                {order.state === "ready" &&
                  (order.deliveryType === "in_place"
                    ? "Listo para retirar"
                    : "Listo para envío")}
                {order.state === "on_the_way" && "En camino"}
                {order.state === "delivered" && "Entregado"}
              </span>

              {/* Items del pedido */}
              <div className="flex flex-wrap gap-3">
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item) => {
                    const itemTotal = Number(item.price) * item.quantity;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 shadow-sm w-full"
                      >
                        {item.imageUrl ? (
                          <div className="relative w-10 h-10">
                            <Image
                              src={item.imageUrl}
                              alt={item.menuName}
                              fill
                              className="rounded object-cover"
                              sizes="40px"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <ChefHat className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 truncate">
                            {item.menuName}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              ${Number(item.price).toFixed(2)} c/u
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-700 text-sm font-bold">
                                x{item.quantity}
                              </span>
                              <span className="text-green-700 font-medium whitespace-nowrap">
                                ${itemTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                    Sin items
                  </span>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-3 border-t border-blue-100">
                <span className="text-sm text-gray-500">Total:</span>
                <span className="text-xl font-bold text-blue-700">
                  {typeof order.total_amount === "number"
                    ? `$${order.total_amount.toFixed(2)}`
                    : `$${order.total_amount ?? "0"}`}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Sin pedidos en tab actual */}
        {(tab === "actuales" ? actualOrders : deliveredOrders).length === 0 &&
          !error && (
            <div className="text-gray-400 text-center py-10">
              No hay pedidos {tab === "actuales" ? "actuales" : "entregados"}.
            </div>
          )}
      </div>
    </div>
  );
}
