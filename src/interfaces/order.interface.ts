export interface IOrderItem {
  id: number;
  orderId: number;
  menuId: number;
  menuName: string;
  quantity: number;
  price: number;
  notes?: string;
  imageUrl?: string;
}

export interface IOrder {
  id: number;
  customerId: number;
  date: string;
  state: "preparation" | "ready" | "delivered";
  total_amount: number;
  deliveryType: "in_place" | "delivery";
  addressId?: number | null;
  paymentType: "cash" | "card" | "mp";
  paymentMethodId?: number | null;
  items: IOrderItem[];
}
