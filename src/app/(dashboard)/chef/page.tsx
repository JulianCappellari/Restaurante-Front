import { getAllOrders } from "@/actions/orders/get-all-orders";
import KitchenBoard from "@/components/staff/KitchenBoard";

export const dynamic = "force-dynamic";

export default async function ChefPage() {
  const orders = await getAllOrders();
  return <KitchenBoard initialOrders={orders} />;
}
