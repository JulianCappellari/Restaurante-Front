

import React, { Suspense } from "react";
import { getUserOrders } from "@/actions/orders/get-user-orders";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { cookies } from "next/headers";
import { IOrder, IMenu, IOrderItem } from "@/interfaces";

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
      
      orders = await Promise.all(
        userOrders.map(async (order) => {
          const items = await Promise.all(
            (order.items || []).map(async (item) => {
              let menu: IMenu | null = null;
              
              if (item.menuId) {
                try {
                  menu = await getMenuById(item.menuId);
                } catch (e) {
                  const error = e as Error;
                  console.error(`Error fetching menu item ${item.menuId}:`, error.message);
                }
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
    } catch (e) {
      const errorObj = e as Error;
      error = errorObj.message;
      console.error('Error loading orders:', errorObj);
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

