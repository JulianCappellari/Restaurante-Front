'use server'
import axios from "axios";
import { cookies } from "next/headers";
// Types for order and items
export interface OrderItemCustomizationPayload {
  customizationId: number;
  isIncluded: boolean;
  notes?: string;
}

export interface OrderItemPayload {
  menuId: number;
  quantity: number;
  notes?: string;
  customizations?: OrderItemCustomizationPayload[];
}

export interface OrderPayload {
  customerId: number | null;
  deliveryType: 'delivery' | 'in_place';
  addressId: number | null;
  paymentType: 'cash' | 'card' | 'mp';
  paymentMethodId?: number;
  tableSessionId?: number | null;
  waiterId?: number | null;
  estimatedPrepMinutes?: number | null;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  /** together: todo a cocina; courses: cada tiempo sale cuando la mesa terminó el anterior. */
  pacing?: 'together' | 'courses';
  state: 'received' | 'preparing' | 'ready' | 'on_the_way' | 'delivered';
  total_amount: number;
  items: Array<{
    menuId: number;
    quantity: number;
    price: number;
    notes: string;
    state?: 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
    station?: 'kitchen' | 'grill' | 'bar' | 'dessert' | 'salad' | 'expo';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    estimatedPrepMinutes?: number | null;
    /** Comensales de la mesa a los que corresponde el plato. */
    guestIds?: number[];
    customizations?: Array<{
      customizationId: number;
      isIncluded: boolean;
      notes?: string;
    }>;
  }>;
}

export async function postOrder(payload: OrderPayload) {
  const url = process.env.NEXT_PUBLIC_API_URL2;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  try {
    // console.log("[postOrder] Enviando POST a /orders con:", payload);
    const response = await axios.post(`${url}/orders`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    // console.log("[postOrder] Orden creada exitosamente:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || error.response?.data?.message || error.message || "No se pudo crear el pedido");
    }
    throw error instanceof Error ? error : new Error("No se pudo crear el pedido");
  }
}

