import { getAllBookings } from "@/actions/bookings/get-all-bookings";
import { getAllInventory } from "@/actions/inventory/get-all-inventory";
import { getAllmenu } from "@/actions/menu/get-all-menu";
import { getAllOrders } from "@/actions/orders/get-all-orders";
import { getAllTables } from "@/actions/tables/get-all-tables";
import { getAllUsers } from "@/actions/users/get-all-users";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [orders, menu, tables, bookings, inventory, users] = await Promise.allSettled([
    getAllOrders(),
    getAllmenu(),
    getAllTables(),
    getAllBookings(),
    getAllInventory(),
    getAllUsers(),
  ]);

  return (
    <AdminDashboard
      orders={orders.status === "fulfilled" ? orders.value : []}
      menu={menu.status === "fulfilled" ? menu.value : []}
      tables={tables.status === "fulfilled" ? tables.value : []}
      bookings={bookings.status === "fulfilled" ? bookings.value : []}
      inventory={inventory.status === "fulfilled" ? inventory.value : []}
      users={users.status === "fulfilled" ? users.value : []}
    />
  );
}
