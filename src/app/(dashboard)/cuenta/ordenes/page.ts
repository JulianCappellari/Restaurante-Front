

import React, { Suspense } from "react";
import { getUserOrders } from "@/actions/orders/get-user-orders";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { cookies } from "next/headers";
import { IOrder, IMenu, IOrderItem } from "@/interfaces";
import { getOrderItemMenuId } from "@/lib/order-utils";

interface DecodedUser {
  id: number;
  email?: string;
  name?: string;
}

interface OrderItemWithMenu extends IOrderItem {
  menu: IMenu | null;
}

async function OrdersServerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let user: DecodedUser | null = null;
  
  if (token) {
    const decoded = getUserFromToken(token);
    if (decoded && typeof decoded === 'object' && 'id' in decoded) {
      user = decoded as DecodedUser;
    }
  }

  let orders: Array<Omit<IOrder, 'items'> & { items: OrderItemWithMenu[] }> = [];
  let error: string | null = null;
  
  if (user) {
    try {
      const userOrders = await getUserOrders(user.id);
      const { getMenuById } = await import("@/actions/menu/get-menu-by-id");
      const menuRequests = new Map<number, Promise<IMenu | null>>();
      const loadMenu = (id: number) => {
        const existing = menuRequests.get(id);
        if (existing) return existing;
        const request = getMenuById(id).catch(() => null);
        menuRequests.set(id, request);
        return request;
      };
      
      orders = await Promise.all(
        [...userOrders].sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || b.id - a.id).map(async (order) => {
          const items = await Promise.all(
            (order.items || []).map(async (item) => {
              let menu: IMenu | null = null;
              
              const menuId = getOrderItemMenuId(item);
              if (item.menu) {
                menu = item.menu;
              } else if (menuId) {
                menu = await loadMenu(menuId);
              }
              
              return {
                ...item,
                menu
              } as OrderItemWithMenu;
            })
          );
          
          return {
            ...order,
            items
          };
        })
      );
    } catch {
      error = "No pudimos cargar tus pedidos";
    }
  }
  // Importar dinámicamente el Client Component para evitar problemas de parsing
  const OrdersClient = (await import("../../../../components/cuenta/ordenes/OrdersClient")).default;
  return React.createElement(OrdersClient, { orders, error });
}

// Export default: renderizar el server component con Suspense
export default function Orders() {
  return React.createElement(
    Suspense,
    { fallback: React.createElement('div', { className: 'text-center py-10' }, 'Cargando pedidos...') },
        React.createElement(OrdersServerPage as React.FC)
  );
}

