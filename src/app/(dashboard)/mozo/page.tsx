import { getAllmenu } from "@/actions/menu/get-all-menu";
import { getAllBookings } from "@/actions/bookings/get-all-bookings";
import { getAllTables } from "@/actions/tables/get-all-tables";
import { getActiveTableSessions } from "@/actions/table-sessions/table-session-actions";
import WaiterPanel from "@/components/staff/WaiterPanel";

export const dynamic = "force-dynamic";

export default async function WaiterPage() {
  const [menuResult, tables, bookings, sessions] = await Promise.allSettled([
    getAllmenu(),
    getAllTables(),
    getAllBookings(),
    getActiveTableSessions(),
  ]);
  const menu = menuResult.status === "fulfilled" ? menuResult.value : [];
  const tableList = tables.status === "fulfilled" ? tables.value : [];
  const bookingList = bookings.status === "fulfilled" ? bookings.value : [];
  const activeSessions = sessions.status === "fulfilled" ? sessions.value : [];

  return <WaiterPanel menu={menu} tables={tableList} bookings={bookingList} activeSessions={activeSessions} />;
}
