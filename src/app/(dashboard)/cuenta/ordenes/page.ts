

import React, { Suspense } from "react";
import { getUserOrders } from "@/actions/orders/get-user-orders";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { cookies } from "next/headers";
import { IOrder } from "@/interfaces";

interface DecodedUser {
  id: number;
  [key: string]: any;
}

async function OrdersServerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let user: DecodedUser | null = null;
  if (token) {
    const decoded = getUserFromToken(token);
    // jwt.verify puede devolver string | JwtPayload
    if (decoded && typeof decoded === 'object' && 'id' in decoded) {
      user = decoded as DecodedUser;
    }
  }
  let orders: IOrder[] = [];
  let error = null;
  if (user) {
    try {
      orders = await getUserOrders(user.id);
      // Solo poblar el menú de cada item (los items ya vienen embebidos)
      const { getMenuById } = await import("@/actions/menu/get-menu-by-id");
      orders = await Promise.all(
        orders.map(async (order) => {
          let items = order.items ?? [];
          items = await Promise.all(
            items.map(async (item) => {
              let menu = null;
              try {
                menu = await getMenuById(item.menuId);
              } catch (e) {}
              return { ...item, menu };
            })
          );
          return { ...order, items };
        })
      );
    } catch (e: any) {
      error = e.message;
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
    // @ts-expect-error Server Component
    React.createElement(OrdersServerPage)
  );
}

