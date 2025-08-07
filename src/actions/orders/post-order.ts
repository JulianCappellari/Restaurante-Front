'use server'
import axios from "axios";
import { cookies } from "next/headers";
// Types for order and items
export interface OrderItemPayload {
  menuId: number;
  quantity: number;
  notes?: string;
}

export interface OrderPayload {
  customerId: number;
  date: string;
  state: "received" | "preparing" | "ready" | "on_the_way" | "delivered";
  total_amount: number;
  deliveryType: "in_place" | "delivery";
  addressId?: number | null;
  paymentType: "cash" | "card" | "mp";
  paymentMethodId?: number | null;
  items: OrderItemPayload[];
}

export async function postOrder(payload: OrderPayload) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  // console.log("[postOrder] INICIO. Payload recibido:", payload);

  // 1. Crear la orden principal (sin los ítems)
  let orderData;
  try {
    // console.log("[postOrder] Enviando POST a /orders con:", payload);
    const resp = await axios.post(`${url}/orders`, {
      customerId: payload.customerId,
      date: payload.date,
      state: payload.state,
      total_amount: payload.total_amount,
      deliveryType: payload.deliveryType,
      addressId: payload.addressId,
      paymentType: payload.paymentType,
      paymentMethodId: payload.paymentMethodId,
    }, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    orderData = resp.data;
    // console.log("[postOrder] Orden creada. Respuesta:", orderData);
  } catch (err) {
    // console.error("[postOrder] Error al crear la orden:", err);
    throw err;
  }

  const orderId = orderData.order.id;

  // 2. Crear los ítems de la orden, uno por uno
  const itemResults = [];
  for (const item of payload.items) {
    try {
      // console.log("[postOrder] Enviando POST a /order-items con:", { orderId, menuId: item.menuId, quantity: item.quantity, notes: item.notes || "" });
      const { data: itemData } = await axios.post(`${url}/order-items`, {
        orderId,
        menuId: item.menuId,
        quantity: item.quantity,
        notes: item.notes || ""
      }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      } );
      // console.log("[postOrder] Item creado:", itemData);
      itemResults.push(itemData);
    } catch (err) {
      // console.error("[postOrder] Error al crear item:", item, err);
      throw err;
    }
  }

  // 3. Devolver la orden y los ítems creados
  // console.log("[postOrder] FIN. Orden e items creados:", { order: orderData, items: itemResults });
  return { order: orderData, items: itemResults };
}

