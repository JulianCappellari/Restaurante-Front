import type { IMenu, IOrder, IOrderItem, IOrderItemCustomization, OrderState } from "@/interfaces";
import { parseCurrency } from "./format";

export const orderStateLabel: Record<OrderState, string> = {
  received: "Recibido",
  preparing: "En preparacion",
  ready: "Listo",
  on_the_way: "En camino",
  delivered: "Entregado",
};

export const kitchenStates: OrderState[] = ["received", "preparing", "ready", "delivered"];

export function getOrderItemMenuId(item: IOrderItem) {
  return item.menuId ?? item.menu_id ?? item.menu?.id ?? 0;
}

export function getOrderItemName(item: IOrderItem) {
  return item.menuName || item.menu?.nameDish || "Plato sin nombre";
}

export function getOrderItemImage(item: IOrderItem) {
  return item.imageUrl || item.menu?.imageUrl || "/Fondo-restaurante.jpg";
}

export function getOrderItemUnitPrice(item: IOrderItem) {
  return parseCurrency(item.price || item.menu?.price || 0);
}

export function getCustomizationLabel(customization: IOrderItemCustomization) {
  const customizationId = customization.customizationId ?? customization.customization_id ?? 0;
  const name = customization.customization?.name || (customizationId ? "Personalizacion seleccionada" : "Personalizacion");
  if (customization.isIncluded === false) return `Sin ${name}`;
  return name;
}

export function getCustomizationDetails(item: IOrderItem) {
  return (item.customizations || []).map(getCustomizationLabel).filter(Boolean);
}

export function orderCustomerName(order: IOrder) {
  const customer = order.customer;
  if (!customer) return order.tableSessionId ? "Comensal de mesa" : "Cliente";
  return `${customer.firstName} ${customer.lastName}`.trim() || customer.email;
}

export function orderTableLabel(order: IOrder) {
  if (order.tableSession?.table?.tableNum) return `Mesa ${order.tableSession.table.tableNum}`;
  if (order.tableSession?.tableId) return "Mesa asignada";
  if (order.tableSessionId) return "Mesa de salon";
  return null;
}

export function orderServiceLabel(order: IOrder) {
  if (order.deliveryType === "delivery") return "Delivery";
  return orderTableLabel(order) || "Salon";
}

export function orderSummaryName(order: Pick<IOrder, "items">) {
  const names = (order.items || [])
    .map(getOrderItemName)
    .filter(Boolean)
    .filter((name, index, list) => list.indexOf(name) === index)
    .slice(0, 2);

  if (names.length === 0) return "Pedido sin detalle cargado";
  if (names.length === 1) return names[0];
  return `${names[0]} + ${names[1]}`;
}

export function toCartMenu(item: IOrderItem): (IMenu & { quantity: number; selectedCustomizations?: number[] }) | null {
  if (!item.menu) return null;
  return {
    ...item.menu,
    quantity: item.quantity,
    selectedCustomizations: (item.customizations || [])
      .filter((customization) => customization.isIncluded !== false)
      .map((customization) => customization.customizationId ?? customization.customization_id ?? 0)
      .filter(Boolean),
  };
}
