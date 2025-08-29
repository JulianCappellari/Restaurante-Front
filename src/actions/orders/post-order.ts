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
  customerId: number;
  deliveryType: 'delivery' | 'in_place';
  addressId: number | null;
  paymentType: 'cash' | 'card' | 'mp';
  paymentMethodId?: number;
  state: 'received' | 'preparing' | 'ready' | 'on_the_way' | 'delivered';
  total_amount: number;
  items: Array<{
    menuId: number;
    quantity: number;
    price: number;
    notes: string;
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
    console.error("[postOrder] Error al crear la orden:", error);
    throw error;
  }
}

