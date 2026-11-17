export type OrderState =
  | "received"
  | "preparing"
  | "ready"
  | "on_the_way"
  | "delivered";

import type { IMenu, IDishCustomization } from "./menu.interface";
import type { IUser } from "./user.interface";
import type { TableSession } from "./reservation.interface";

export interface IOrderItemCustomization {
  id?: number;
  orderItemId?: number;
  order_item_id?: number;
  customizationId: number;
  customization_id?: number;
  isIncluded?: boolean;
  notes?: string | null;
  customization?: IDishCustomization | null;
}

export interface IOrderItem {
  id: number;
  orderId?: number;
  order_id?: number;
  menuId?: number;
  menu_id?: number;
  menuName?: string;
  quantity: number;
  price: number | string;
  notes?: string | null;
  imageUrl?: string | null;
  menu?: IMenu | null;
  customizations?: IOrderItemCustomization[];
  state?: "received" | "preparing" | "ready" | "delivered" | "cancelled";
  station?: "kitchen" | "grill" | "bar" | "dessert" | "salad" | "expo";
  priority?: "low" | "normal" | "high" | "urgent";
  estimatedPrepMinutes?: number | null;
  startedAt?: string | null;
  readyAt?: string | null;
  delayedAlertAt?: string | null;
}

export interface IOrder {
  id: number;
  customerId: number | null;
  date: string;
  state: OrderState;
  total_amount: number;
  deliveryType: "in_place" | "delivery";
  addressId?: number | null;
  paymentType: "cash" | "card" | "mp";
  paymentMethodId?: number | null;
  items: IOrderItem[];
  customer?: Pick<IUser, "id" | "firstName" | "lastName" | "email" | "phone" | "role">;
  tableSession?: TableSession | null;
  tableSessionId?: number | null;
  waiterId?: number | null;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  refundAmount?: number | null;
  refundReason?: string | null;
  estimatedPrepMinutes?: number | null;
  priority?: "low" | "normal" | "high" | "urgent";
  deliveryZoneId?: number | null;
  courierId?: number | null;
  trackingCode?: string | null;
  trackingStatus?: "pending" | "assigned" | "picked_up" | "delivered" | "failed" | null;
}
