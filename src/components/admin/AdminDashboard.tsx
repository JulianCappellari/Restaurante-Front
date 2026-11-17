"use client";

import StaffHeader from "@/components/staff/StaffHeader";
import StaffTabs, { useStaffView, type StaffView } from "@/components/staff/StaffTabs";
import ServiceInsights from "@/components/admin/ServiceInsights";
import RadarControl from "@/components/admin/RadarControl";
import {
  LayoutDashboard as TabResumen, BarChart3 as TabVentas, Utensils as TabCarta, Armchair as TabMesas,
  Users as TabClientes, RotateCcw as TabPostventa, Truck as TabDespacho, Boxes as TabModulos, Gauge as TabServicio, Radar as TabRadar,
} from "lucide-react";

import type { AdminUser } from "@/actions/users/get-all-users";
import { refundOrder as refundOrderAction } from "@/actions/orders/refund-order";
import type { IMenu, IOrder } from "@/interfaces";
import type { Booking, Table } from "@/interfaces/reservation.interface";
import type { InventoryItem } from "@/actions/inventory/get-all-inventory";
import { formatARS, parseCurrency } from "@/lib/format";
import { roleLabel, tableStatusLabel } from "@/lib/labels";
import { buildMailUrl, buildWhatsAppUrl } from "@/lib/notifications";
import { getOrderItemName, orderCustomerName, orderStateLabel, orderSummaryName } from "@/lib/order-utils";
import Cookies from "js-cookie";
import AdvancedOpsPanel from "./AdvancedOpsPanel";
import DeliveryDispatchPanel from "@/components/staff/DeliveryDispatchPanel";
import { useRealtime } from "@/hooks/realtime/useRealtime";
import {
  BarChart3,
  CalendarDays,
  Download,
  Mail,
  MessageCircle,
  AlertTriangle,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  orders: IOrder[];
  menu: IMenu[];
  tables: Table[];
  bookings: Booking[];
  inventory: InventoryItem[];
  users: AdminUser[];
};

const dishTypes = ["Entrada", "Plato Principal", "Postre", "Bebida", "Ensalada", "Guarnicion"] as const;
type RoleValue = AdminUser["role"];
const roles: RoleValue[] = ["Administrator", "Waiter", "Customer", "Receptionist", "Chef"] as RoleValue[];

const apiUrl = () => process.env.NEXT_PUBLIC_API_URL2 || "";

type MenuCustomizationDraft = {
  name: string;
  description: string;
  additionalPrice: string;
  isDefaultIncluded: boolean;
  isRemovable: boolean;
  isRequired: boolean;
};

const emptyCustomization = (): MenuCustomizationDraft => ({
  name: "",
  description: "",
  additionalPrice: "0",
  isDefaultIncluded: true,
  isRemovable: true,
  isRequired: false,
});

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] || { mensaje: "Sin datos" });
  const csv = [
    headers.join(";"),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(";")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard(props: Props) {
  const [orders, setOrders] = useState(props.orders);
  const [menuItems, setMenuItems] = useState(props.menu);
  const [tables, setTables] = useState(props.tables);
  const [users, setUsers] = useState(props.users);
  const [expenses, setExpenses] = useState(0);
  const [refundOrderId, setRefundOrderId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);
  const [editingTableId, setEditingTableId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [menuQuery, setMenuQuery] = useState("");
  const [tableQuery, setTableQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [menuForm, setMenuForm] = useState({
    nameDish: "",
    price: "",
    typeDish: "Plato Principal",
    imageUrl: "",
    description: "",
    customizations: [emptyCustomization()],
  });
  const [tableForm, setTableForm] = useState({
    tableNum: "",
    ability: "2",
    status: "available",
  });
  const [userForm, setUserForm] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: RoleValue;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Customer" as RoleValue,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [view, setView] = useStaffView(["resumen", "radar", "servicio", "ventas", "carta", "mesas", "clientes", "postventa", "despacho", "modulos"], "resumen");
  const realtimeHandlers = useMemo(
    () => ({
      order_created: () => setMessage("Nuevo pedido recibido en tiempo real."),
      low_stock: () => setMessage("Alerta de stock bajo recibida."),
      delivery_updated: () => setMessage("Delivery actualizado."),
      resource_changed: () => setMessage("Un recurso administrativo cambio."),
    }),
    []
  );
  useRealtime("admin", realtimeHandlers);

  const token = Cookies.get("token");

  const metrics = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWeek = new Date(startToday);
    startWeek.setDate(startWeek.getDate() - 6);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const salesOrders = orders.filter((order) => !order.cancelledAt);

    const sumFrom = (date: Date) =>
      salesOrders
        .filter((order) => new Date(order.date) >= date)
        .reduce((sum, order) => sum + parseCurrency(order.total_amount), 0);

    const topMap = new Map<string, number>();
    salesOrders.forEach((order) => {
      order.items?.forEach((item) => {
        topMap.set(getOrderItemName(item), (topMap.get(getOrderItemName(item)) || 0) + item.quantity);
      });
    });

    return {
      todaySales: sumFrom(startToday),
      weekSales: sumFrom(startWeek),
      monthSales: sumFrom(startMonth),
      activeOrders: orders.filter((order) => order.state !== "delivered" && !order.cancelledAt).length,
      topDishes: [...topMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity })),
    };
  }, [orders]);

  const lowStock = props.inventory.filter((item) => item.amount <= item.minimumThreshold);
  const net = metrics.monthSales - expenses;
  const refundableOrders = useMemo(
    () =>
      orders
        .filter((order) => !order.cancelledAt && parseCurrency(order.total_amount) > parseCurrency(order.refundAmount || 0))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30),
    [orders]
  );
  const selectedRefundOrder = refundableOrders.find((order) => String(order.id) === refundOrderId) || null;
  const selectedRefundedAmount = parseCurrency(selectedRefundOrder?.refundAmount || 0);
  const selectedRefundRemaining = Math.max(0, parseCurrency(selectedRefundOrder?.total_amount || 0) - selectedRefundedAmount);

  const filteredMenuItems = useMemo(() => {
    const query = menuQuery.trim().toLowerCase();
    if (!query) return menuItems;

    return menuItems.filter((item) =>
      [item.nameDish, item.typeDish, item.description, item.price]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [menuItems, menuQuery]);

  const filteredTables = useMemo(() => {
    const query = tableQuery.trim().toLowerCase();
    if (!query) return tables;

    return tables.filter((table) =>
      [
        `mesa ${table.tableNum}`,
        table.tableNum,
        table.ability,
        table.status,
        tableStatusLabel[table.status],
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [tables, tableQuery]);

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [
        user.firstName,
        user.lastName,
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.phone,
        roleLabel[user.role],
        user.role,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [users, userQuery]);

  const editingMenuName = useMemo(
    () => menuItems.find((item) => item.id === editingMenuId)?.nameDish || null,
    [editingMenuId, menuItems]
  );

  const editingTableName = useMemo(
    () => {
      const table = tables.find((item) => item.id === editingTableId);
      return table ? `Mesa ${table.tableNum}` : null;
    },
    [editingTableId, tables]
  );

  const editingUserName = useMemo(
    () => {
      const user = users.find((item) => item.id === editingUserId);
      return user ? `${user.firstName} ${user.lastName}`.trim() || user.email : null;
    },
    [editingUserId, users]
  );

  const authHeaders = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const createMenu = async () => {
    if (!menuForm.nameDish || !menuForm.price) return;
    const isEditing = Boolean(editingMenuId);
    const response = await fetch(`${apiUrl()}/menu${editingMenuId ? `/${editingMenuId}` : ""}`, {
      method: isEditing ? "PUT" : "POST",
      headers: authHeaders,
      body: JSON.stringify({
        nameDish: menuForm.nameDish,
        price: Number(menuForm.price),
        available: true,
        typeDish: menuForm.typeDish,
        imageUrl: menuForm.imageUrl || null,
        description: menuForm.description || null,
        customizations: menuForm.customizations
          .filter((customization) => customization.name.trim())
          .map((customization) => ({
            name: customization.name.trim(),
            description: customization.description.trim() || null,
            additionalPrice: Number(customization.additionalPrice) || 0,
            isDefaultIncluded: customization.isDefaultIncluded,
            isRemovable: customization.isRemovable,
            isRequired: customization.isRequired,
          })),
      }),
    });
    if (!response.ok) {
      setMessage(isEditing ? "No se pudo actualizar el plato." : "No se pudo crear el plato.");
      return;
    }
    const created = await response.json();
    setMenuItems((current) =>
      editingMenuId
        ? current.map((item) => (item.id === editingMenuId ? created : item))
        : [...current, created]
    );
    setEditingMenuId(null);
    setMenuForm({
      nameDish: "",
      price: "",
      typeDish: "Plato Principal",
      imageUrl: "",
      description: "",
      customizations: [emptyCustomization()],
    });
    setMessage(isEditing ? "Plato actualizado." : "Plato creado.");
  };

  const editMenu = (item: IMenu) => {
    const customizations = item.dishCustomizations || item.customizations || [];
    setEditingMenuId(item.id);
    setMenuForm({
      nameDish: item.nameDish,
      price: String(item.price),
      typeDish: item.typeDish,
      imageUrl: item.imageUrl || "",
      description: item.description || "",
      customizations: customizations.length
        ? customizations.map((customization) => ({
            name: customization.name,
            description: customization.description || "",
            additionalPrice: String(customization.additionalPrice || 0),
            isDefaultIncluded: Boolean(customization.isDefaultIncluded),
            isRemovable: customization.isRemovable ?? true,
            isRequired: Boolean(customization.isRequired),
          }))
        : [emptyCustomization()],
    });
    setMessage(`Editando ${item.nameDish}.`);
  };

  const cancelMenuEdit = () => {
    setEditingMenuId(null);
    setMenuForm({
      nameDish: "",
      price: "",
      typeDish: "Plato Principal",
      imageUrl: "",
      description: "",
      customizations: [emptyCustomization()],
    });
    setMessage(null);
  };

  const updateCustomization = (
    index: number,
    patch: Partial<MenuCustomizationDraft>
  ) => {
    setMenuForm((current) => ({
      ...current,
      customizations: current.customizations.map((customization, itemIndex) =>
        itemIndex === index ? { ...customization, ...patch } : customization
      ),
    }));
  };

  const addCustomization = () => {
    setMenuForm((current) => ({
      ...current,
      customizations: [...current.customizations, emptyCustomization()],
    }));
  };

  const removeCustomization = (index: number) => {
    setMenuForm((current) => ({
      ...current,
      customizations:
        current.customizations.length === 1
          ? [emptyCustomization()]
          : current.customizations.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const deleteMenu = async (id: number) => {
    const response = await fetch(`${apiUrl()}/menu/${id}`, { method: "DELETE", headers: authHeaders });
    if (response.ok) {
      if (editingMenuId === id) cancelMenuEdit();
      setMenuItems((current) => current.filter((item) => item.id !== id));
      setMessage("Plato eliminado.");
    } else {
      setMessage("No se pudo eliminar el plato.");
    }
  };

  const createTable = async () => {
    if (!tableForm.tableNum) return;
    const isEditing = Boolean(editingTableId);
    const response = await fetch(`${apiUrl()}/tables${editingTableId ? `/${editingTableId}` : ""}`, {
      method: isEditing ? "PUT" : "POST",
      headers: authHeaders,
      body: JSON.stringify({
        tableNum: Number(tableForm.tableNum),
        ability: Number(tableForm.ability),
        status: tableForm.status,
      }),
    });
    if (!response.ok) {
      setMessage(isEditing ? "No se pudo actualizar la mesa." : "No se pudo crear la mesa.");
      return;
    }
    const created = await response.json();
    setTables((current) =>
      editingTableId
        ? current.map((table) => (table.id === editingTableId ? created : table))
        : [...current, created]
    );
    setEditingTableId(null);
    setTableForm({ tableNum: "", ability: "2", status: "available" });
    setMessage(isEditing ? "Mesa actualizada." : "Mesa creada.");
  };

  const editTable = (table: Table) => {
    setEditingTableId(table.id);
    setTableForm({
      tableNum: String(table.tableNum),
      ability: String(table.ability),
      status: table.status,
    });
    setMessage(`Editando Mesa ${table.tableNum}.`);
  };

  const cancelTableEdit = () => {
    setEditingTableId(null);
    setTableForm({ tableNum: "", ability: "2", status: "available" });
    setMessage(null);
  };

  const deleteTable = async (id: number) => {
    const response = await fetch(`${apiUrl()}/tables/${id}`, { method: "DELETE", headers: authHeaders });
    if (response.ok) {
      if (editingTableId === id) cancelTableEdit();
      setTables((current) => current.filter((table) => table.id !== id));
      setMessage("Mesa eliminada.");
    } else {
      setMessage("No se pudo eliminar la mesa.");
    }
  };

  const updateUserRole = async (user: AdminUser, role: RoleValue) => {
    const response = await fetch(`${apiUrl()}/users/${user.id}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ role }),
    });
    if (response.ok) {
      setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, role } : item)));
      setMessage("Rol actualizado.");
    } else {
      setMessage("No se pudo actualizar el rol.");
    }
  };

  const editUser = (user: AdminUser) => {
    setEditingUserId(user.id);
    setUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
    setMessage(`Editando ${`${user.firstName} ${user.lastName}`.trim() || user.email}.`);
  };

  const cancelUserEdit = () => {
    setEditingUserId(null);
    setUserForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "Customer" as RoleValue,
    });
    setMessage(null);
  };

  const updateUserProfile = async () => {
    if (!editingUserId) return;

    const response = await fetch(`${apiUrl()}/users/${editingUserId}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify(userForm),
    });

    if (!response.ok) {
      setMessage("No se pudo actualizar el usuario.");
      return;
    }

    const updated = (await response.json()) as AdminUser;
    setUsers((current) =>
      current.map((user) =>
        user.id === editingUserId ? { ...user, ...updated, role: updated.role || userForm.role } : user
      )
    );
    cancelUserEdit();
    setMessage("Usuario actualizado.");
  };

  const deleteUser = async (id: number) => {
    const response = await fetch(`${apiUrl()}/users/${id}`, { method: "DELETE", headers: authHeaders });
    if (response.ok) {
      if (editingUserId === id) cancelUserEdit();
      setUsers((current) => current.filter((user) => user.id !== id));
      setMessage("Usuario eliminado.");
    } else {
      setMessage("No se pudo eliminar el usuario.");
    }
  };

  const submitRefund = async () => {
    const orderId = Number(refundOrderId);
    const amount = parseCurrency(refundAmount);
    const reason = refundReason.trim();
    if (!orderId || amount <= 0 || !reason) {
      setMessage("Selecciona un pedido, monto y motivo para registrar el reembolso.");
      return;
    }
    if (selectedRefundOrder && amount > selectedRefundRemaining) {
      setMessage(`El monto supera el saldo reembolsable de ${formatARS(selectedRefundRemaining)}.`);
      return;
    }

    setRefundLoading(true);
    try {
      const updated = await refundOrderAction(orderId, amount, reason);
      setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, ...updated } : order)));
      setRefundAmount("");
      setRefundReason("");
      setMessage(`Reembolso registrado para Pedido #${orderId}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo registrar el reembolso.");
    } finally {
      setRefundLoading(false);
    }
  };

  const exportReport = (period: "dia" | "semana" | "mes") => {
    downloadCsv(`reporte-${period}.csv`, orders.filter((order) => !order.cancelledAt).map((order) => ({
      id: order.id,
      fecha: new Date(order.date).toLocaleString("es-AR"),
      estado: orderStateLabel[order.state],
      total: parseCurrency(order.total_amount),
      cliente: order.customer?.email || order.customerId || orderCustomerName(order),
      items: order.items?.map((item) => `${item.quantity}x ${getOrderItemName(item)}`).join(" | ") || "",
    })));
  };

  const adminViews: StaffView[] = [
    { id: "resumen", label: "Resumen", icon: TabResumen, count: lowStock.length, alert: true },
    { id: "radar", label: "Radar", icon: TabRadar },
    { id: "servicio", label: "Servicio", icon: TabServicio },
    { id: "ventas", label: "Ventas", icon: TabVentas },
    { id: "carta", label: "Carta", icon: TabCarta, count: menuItems.length },
    { id: "mesas", label: "Mesas", icon: TabMesas, count: tables.length },
    { id: "clientes", label: "Clientes", icon: TabClientes, count: users.length },
    { id: "postventa", label: "Postventa", icon: TabPostventa },
    { id: "despacho", label: "Despacho", icon: TabDespacho },
    { id: "modulos", label: "Módulos", icon: TabModulos },
  ];

  return (
    <div className="staff-shell">
      <StaffHeader area="admin" title="Gestión del restaurante" description="Consultá ventas, revisá el stock y administrá la carta y los recursos del local." />

      <section aria-label="Indicadores de operación" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={BarChart3} label="Ventas hoy" value={formatARS(metrics.todaySales)} />
        <Metric icon={CalendarDays} label="Ventas mes" value={formatARS(metrics.monthSales)} />
        <Metric icon={Utensils} label="Pedidos activos" value={String(metrics.activeOrders)} />
        <Metric icon={AlertTriangle} label="Stock bajo" value={String(lowStock.length)} alert={lowStock.length > 0} />
      </section>

      <StaffTabs label="Vistas de administración" views={adminViews} active={view} onChange={setView} />

      {message && <div className="rounded-lg border bg-white p-4 text-sm text-gray-700 shadow-sm">{message}</div>}

      <div id={`vista-${view}`} role="tabpanel" aria-labelledby={`tab-${view}`} className="staff-view space-y-5" key={view}>
        {view === "resumen" && (
          <div className="grid items-start gap-5 lg:grid-cols-3">
          <section className="staff-panel p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-950">Platos más vendidos</h2>
            <div className="mt-4 space-y-3">
              {metrics.topDishes.map((dish, index) => (
                <div key={dish.name} className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 p-3">
                  <span className="min-w-0 break-words font-semibold text-gray-900">{index + 1}. {dish.name}</span>
                  <span className="text-sm font-bold text-primario-700">{dish.quantity}</span>
                </div>
              ))}
              {metrics.topDishes.length === 0 && (
                <p className="rounded-lg bg-stone-50 p-3 text-sm text-gray-500">
                  Todavia no hay ventas suficientes para calcular ranking.
                </p>
              )}
            </div>
          </section>

          <section className="staff-panel p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-950">Alertas de stock bajo</h2>
            <div className="mt-4 space-y-3">
              {lowStock.map((item) => (
                <div key={item.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm">Stock {item.amount} / minimo {item.minimumThreshold}</p>
                </div>
              ))}
              {lowStock.length === 0 && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Sin alertas activas.</p>}
            </div>
          </section>

          <section className="staff-panel p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-950">Notificaciones</h2>
            <div className="mt-4 space-y-3">
              {props.bookings.slice(0, 4).map((booking) => {
                const customerName = booking.user
                  ? `${booking.user.firstName} ${booking.user.lastName}`.trim() || booking.user.email
                  : "Cliente sin datos";
                const dateLabel = booking.date || booking.bookingDate || "fecha pendiente";
                const payload = {
                  type: "reserva" as const,
                  recipientName: customerName,
                  phone: booking.user?.phone,
                  email: booking.user?.email,
                  reference: `Reserva de ${customerName}`,
                  details: `recordatorio de reserva para ${dateLabel}.`,
                };
                return (
                  <div key={booking.id} className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                    <span className="min-w-0 text-sm font-semibold text-gray-900">
                      <span className="block truncate">{customerName}</span>
                      <span className="block text-xs font-normal text-gray-500">Reserva #{booking.id} - {dateLabel}</span>
                    </span>
                    <span className="flex gap-2">
                      <a href={buildWhatsAppUrl(payload)} target="_blank" rel="noreferrer" className="rounded-lg border bg-white p-2 text-gray-700 hover:bg-stone-100" aria-label="Enviar WhatsApp">
                        <MessageCircle className="h-4 w-4" />
                      </a>
                      <a href={buildMailUrl(payload)} className="rounded-lg border bg-white p-2 text-gray-700 hover:bg-stone-100" aria-label="Enviar email">
                        <Mail className="h-4 w-4" />
                      </a>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
          </div>
        )}
        {view === "ventas" && (<>
          <section className="staff-panel p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 id="ventas" className="text-xl font-bold text-gray-950">Reportes y ganancias</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Exporta CSV compatible con Excel por dia, semana o mes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["dia", "semana", "mes"] as const).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => exportReport(period)}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-stone-50"
                  >
                    <Download className="h-4 w-4" />
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <ReportBox label="Semana" value={formatARS(metrics.weekSales)} />
              <ReportBox label="Mes" value={formatARS(metrics.monthSales)} />
              <label className="rounded-lg bg-stone-50 p-4">
                <span className="text-sm text-gray-500">Gastos del mes</span>
                <input
                  type="number"
                  value={expenses || ""}
                  onChange={(event) => setExpenses(Number(event.target.value) || 0)}
                  className="mt-2 w-full rounded-lg border px-3 py-2"
                  placeholder="0"
                />
              </label>
            </div>
            <div className="mt-4 rounded-lg bg-primario-50 p-4 text-primario-800">
              Ganancia estimada del mes: <b>{formatARS(net)}</b>
            </div>
          </section>
        </>)}
        {view === "carta" && (<>
          <section className="staff-panel p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <h2 id="carta-admin" className="text-xl font-bold text-gray-950">Carta y personalizaciones</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Crea platos con descripcion visible para el cliente y opciones para agregar o quitar ingredientes.
                </p>
              </div>
              <div className="min-w-[240px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={menuQuery}
                    onChange={(event) => setMenuQuery(event.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primario-300 focus:bg-white focus:ring-2 focus:ring-primario-100"
                    placeholder="Buscar plato"
                  />
                </label>
                <p className="mt-2 text-right text-xs text-gray-500">
                  {filteredMenuItems.length} de {menuItems.length} platos
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-6">
              <input value={menuForm.nameDish} onChange={(e) => setMenuForm({ ...menuForm, nameDish: e.target.value })} className="rounded-lg border px-3 py-2 md:col-span-2" placeholder="Nombre" />
              <input value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} className="rounded-lg border px-3 py-2" placeholder="Precio" inputMode="numeric" />
              <select value={menuForm.typeDish} onChange={(e) => setMenuForm({ ...menuForm, typeDish: e.target.value })} className="rounded-lg border px-3 py-2">
                {dishTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <input value={menuForm.imageUrl} onChange={(e) => setMenuForm({ ...menuForm, imageUrl: e.target.value })} className="rounded-lg border px-3 py-2 md:col-span-2" placeholder="URL de imagen" />
              <textarea value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} className="rounded-lg border px-3 py-2 md:col-span-6" placeholder="Descripcion del plato: ingredientes, guarnicion, punto recomendado..." rows={3} />
            </div>

            <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-bold text-gray-950">Personalizaciones del plato</h3>
                  <p className="text-sm text-gray-600">
                    Ejemplo: sin huevo, extra queso, punto jugoso o sin hielo.
                  </p>
                </div>
                <button type="button" onClick={addCustomization} className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-stone-100">
                  <Plus className="h-4 w-4" />
                  Agregar opcion
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {menuForm.customizations.map((customization, index) => (
                  <div key={index} className="rounded-lg border border-stone-200 bg-white p-3">
                    <div className="grid gap-3 md:grid-cols-6">
                      <input
                        value={customization.name}
                        onChange={(e) => updateCustomization(index, { name: e.target.value })}
                        className="rounded-lg border px-3 py-2 md:col-span-2"
                        placeholder="Nombre de opcion"
                      />
                      <input
                        value={customization.additionalPrice}
                        onChange={(e) => updateCustomization(index, { additionalPrice: e.target.value })}
                        className="rounded-lg border px-3 py-2"
                        placeholder="Costo extra"
                        inputMode="numeric"
                      />
                      <input
                        value={customization.description}
                        onChange={(e) => updateCustomization(index, { description: e.target.value })}
                        className="rounded-lg border px-3 py-2 md:col-span-2"
                        placeholder="Detalle para el cliente"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomization(index)}
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-700">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={customization.isDefaultIncluded}
                          onChange={(e) => updateCustomization(index, { isDefaultIncluded: e.target.checked })}
                        />
                        Incluida por defecto
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={customization.isRemovable}
                          onChange={(e) => updateCustomization(index, { isRemovable: e.target.checked })}
                        />
                        El cliente la puede quitar
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={customization.isRequired}
                          onChange={(e) => updateCustomization(index, { isRequired: e.target.checked })}
                        />
                        Obligatoria
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <button type="button" onClick={createMenu} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primario-600 px-4 py-2 font-semibold text-white hover:bg-primario-700">
                  {editingMenuId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingMenuId ? `Guardar ${editingMenuName || "plato"}` : "Crear plato"}
                </button>
                {editingMenuId && (
                  <button type="button" onClick={cancelMenuEdit} className="ml-2 inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 font-semibold text-gray-700 hover:bg-stone-50">
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 max-h-[560px] overflow-auto rounded-lg border">
              {filteredMenuItems.length > 0 ? (
                <div className="divide-y">
                  {filteredMenuItems.map((item) => (
                    <Row
                      key={item.id}
                      title={item.nameDish}
                      subtitle={`${item.typeDish} - ${formatARS(item.price)}${item.description ? ` - ${item.description}` : ""}`}
                      details={(item.dishCustomizations || item.customizations || []).map((customization) =>
                        `${customization.name}${Number(customization.additionalPrice) > 0 ? ` (+${formatARS(customization.additionalPrice)})` : ""}`
                      )}
                      onEdit={() => editMenu(item)}
                      onDelete={() => deleteMenu(item.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="p-6 text-center text-sm text-gray-500">
                  No hay platos que coincidan con la busqueda.
                </p>
              )}
            </div>
          </section>
        </>)}
        {view === "mesas" && (<>
          <section className="staff-panel p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <h2 id="mesas-admin" className="text-xl font-bold text-gray-950">Mesas y ubicaciones</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Alta, edicion y baja de mesas con estado operativo.
                </p>
              </div>
              <div className="min-w-[240px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={tableQuery}
                    onChange={(event) => setTableQuery(event.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primario-300 focus:bg-white focus:ring-2 focus:ring-primario-100"
                    placeholder="Buscar mesa"
                  />
                </label>
                <p className="mt-2 text-right text-xs text-gray-500">
                  {filteredTables.length} de {tables.length} mesas
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <input value={tableForm.tableNum} onChange={(e) => setTableForm({ ...tableForm, tableNum: e.target.value })} className="rounded-lg border px-3 py-2" placeholder="Numero" inputMode="numeric" />
              <select value={tableForm.ability} onChange={(e) => setTableForm({ ...tableForm, ability: e.target.value })} className="rounded-lg border px-3 py-2">
                <option value="2">2 personas</option>
                <option value="4">4 personas</option>
              </select>
              <select value={tableForm.status} onChange={(e) => setTableForm({ ...tableForm, status: e.target.value })} className="rounded-lg border px-3 py-2">
                <option value="available">Disponible</option>
                <option value="reserved">Reservada</option>
                <option value="occupied">Ocupada</option>
                <option value="maintenance">Mantenimiento</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={createTable} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primario-600 px-4 py-2 font-semibold text-white hover:bg-primario-700">
                  {editingTableId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingTableId ? `Guardar ${editingTableName || "mesa"}` : "Crear"}
                </button>
                {editingTableId && (
                  <button type="button" onClick={cancelTableEdit} className="rounded-lg border px-3 py-2 text-gray-700 hover:bg-stone-50">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-5 max-h-[420px] overflow-auto rounded-lg border">
              {filteredTables.length > 0 ? (
                <div className="grid gap-0 divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
                  {filteredTables.map((table) => (
                    <Row
                      key={table.id}
                      title={`Mesa ${table.tableNum}`}
                      subtitle={`${table.ability} personas - ${tableStatusLabel[table.status]}`}
                      onEdit={() => editTable(table)}
                      onDelete={() => deleteTable(table.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="p-6 text-center text-sm text-gray-500">
                  No hay mesas que coincidan con la busqueda.
                </p>
              )}
            </div>
          </section>
        </>)}
        {view === "clientes" && (<>
          <section className="staff-panel p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <h2 id="clientes-admin" className="text-xl font-bold text-gray-950">Clientes y perfiles</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Gestiona datos de contacto y permisos del equipo.
                </p>
              </div>
              <div className="min-w-[260px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={userQuery}
                    onChange={(event) => setUserQuery(event.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primario-300 focus:bg-white focus:ring-2 focus:ring-primario-100"
                    placeholder="Buscar usuario"
                  />
                </label>
                <p className="mt-2 text-right text-xs text-gray-500">
                  {filteredUsers.length} de {users.length} usuarios
                </p>
              </div>
            </div>

            {editingUserId && (
              <div className="mt-5 rounded-lg border border-primario-100 bg-primario-50/60 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <h3 className="font-bold text-gray-950">Editar {editingUserName || "usuario"}</h3>
                    <p className="text-sm text-gray-600">Actualiza datos basicos y perfil operativo.</p>
                  </div>
                  <button type="button" onClick={cancelUserEdit} className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-stone-50">
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-5">
                  <input value={userForm.firstName} onChange={(event) => setUserForm({ ...userForm, firstName: event.target.value })} className="rounded-lg border px-3 py-2" placeholder="Nombre" />
                  <input value={userForm.lastName} onChange={(event) => setUserForm({ ...userForm, lastName: event.target.value })} className="rounded-lg border px-3 py-2" placeholder="Apellido" />
                  <input value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} className="rounded-lg border px-3 py-2" placeholder="Email" />
                  <input value={userForm.phone} onChange={(event) => setUserForm({ ...userForm, phone: event.target.value })} className="rounded-lg border px-3 py-2" placeholder="Telefono" />
                  <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value as RoleValue })} className="rounded-lg border px-3 py-2">
                    {roles.map((role) => <option key={role} value={role}>{roleLabel[role]}</option>)}
                  </select>
                </div>
                <button type="button" onClick={updateUserProfile} className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primario-600 px-4 py-2 font-semibold text-white hover:bg-primario-700">
                  <Save className="h-4 w-4" />
                  Guardar {editingUserName || "usuario"}
                </button>
              </div>
            )}

            <div className="mt-5 max-h-[520px] overflow-auto rounded-lg border">
              {filteredUsers.length > 0 ? (
                <div className="divide-y">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-950">{user.firstName} {user.lastName}</p>
                        <p className="break-words text-sm text-gray-500">{user.email} - {user.phone}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <select value={user.role} onChange={(e) => updateUserRole(user, e.target.value as RoleValue)} className="rounded-lg border px-3 py-2 text-sm">
                          {roles.map((role) => <option key={role} value={role}>{roleLabel[role]}</option>)}
                        </select>
                        <button type="button" onClick={() => editUser(user)} className="rounded-lg border p-2 text-gray-700 hover:bg-stone-50" aria-label="Editar usuario">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => deleteUser(user.id)} className="rounded-lg border p-2 text-red-600 hover:bg-red-50" aria-label="Eliminar usuario">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-6 text-center text-sm text-gray-500">
                  No hay usuarios que coincidan con la busqueda.
                </p>
              )}
            </div>
          </section>
        </>)}
        {view === "postventa" && (<>
          <section className="staff-panel p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div>
                <h2 id="postventa" className="text-xl font-bold text-gray-950">Postventa y reembolsos</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Registra devoluciones con motivo, controla saldos reembolsables y evita superar el total del pedido.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-gray-600">
                <RefreshCcw className="h-3.5 w-3.5" />
                {refundableOrders.length} pedidos disponibles
              </span>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="max-h-[340px] overflow-auto rounded-lg border border-stone-200">
                {refundableOrders.length > 0 ? (
                  <div className="divide-y divide-stone-100">
                    {refundableOrders.map((order) => {
                      const refunded = parseCurrency(order.refundAmount || 0);
                      const remaining = Math.max(0, parseCurrency(order.total_amount) - refunded);
                      return (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => {
                            setRefundOrderId(String(order.id));
                            setRefundAmount(String(remaining));
                          }}
                          className={`w-full p-4 text-left transition hover:bg-stone-50 ${
                            refundOrderId === String(order.id) ? "bg-primario-50" : "bg-white"
                          }`}
                        >
                          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                            <div className="min-w-0">
                              <p className="font-bold text-gray-950">
                                Pedido #{order.id} - {orderSummaryName(order)}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {orderCustomerName(order)} - {orderStateLabel[order.state]}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {(order.items || []).map((item) => `${item.quantity}x ${getOrderItemName(item)}`).join(" | ") || "Sin detalle"}
                              </p>
                            </div>
                            <div className="shrink-0 text-left md:text-right">
                              <p className="text-sm font-bold text-gray-950">{formatARS(order.total_amount)}</p>
                              <p className="text-xs text-gray-500">Disponible {formatARS(remaining)}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="p-6 text-center text-sm text-gray-500">
                    No hay pedidos con saldo pendiente de reembolso.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Pedido</span>
                  <select
                    value={refundOrderId}
                    onChange={(event) => setRefundOrderId(event.target.value)}
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Seleccionar pedido</option>
                    {refundableOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        Pedido #{order.id} - {orderSummaryName(order)}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedRefundOrder && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-white p-3">
                      <span className="block text-gray-500">Ya reembolsado</span>
                      <b>{formatARS(selectedRefundedAmount)}</b>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <span className="block text-gray-500">Maximo actual</span>
                      <b>{formatARS(selectedRefundRemaining)}</b>
                    </div>
                  </div>
                )}

                <label className="mt-3 block">
                  <span className="text-sm font-semibold text-gray-700">Monto</span>
                  <input
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                    inputMode="decimal"
                    placeholder="0"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="text-sm font-semibold text-gray-700">Motivo</span>
                  <textarea
                    value={refundReason}
                    onChange={(event) => setRefundReason(event.target.value)}
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Ej: producto frio, devolucion parcial, error de cobro"
                  />
                </label>
                <button
                  type="button"
                  onClick={submitRefund}
                  disabled={refundLoading || !refundOrderId || parseCurrency(refundAmount) <= 0 || !refundReason.trim()}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primario-600 px-4 py-2 text-sm font-bold text-white disabled:bg-gray-300"
                >
                  <RefreshCcw className="h-4 w-4" />
                  {refundLoading ? "Registrando..." : "Registrar reembolso"}
                </button>
              </div>
            </div>
          </section>
        </>)}
        {view === "despacho" && <DeliveryDispatchPanel initialOrders={orders} title="Delivery listo para enviar" />}
        {view === "modulos" && <AdvancedOpsPanel />}
        {view === "servicio" && <ServiceInsights menu={menuItems} tables={tables} />}
        {view === "radar" && <RadarControl />}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, alert = false }: { icon: React.ElementType; label: string; value: string; alert?: boolean }) {
  return (
    <div className={`staff-panel p-4 sm:p-5 ${alert ? "border-red-200 bg-red-50/60" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${alert ? "bg-red-100 text-red-700" : "bg-[#eaf0fa] text-[#17336d]"}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 text-sm font-semibold leading-tight text-stone-600">{label}</span>
      </div>
      <p className="staff-section-title mt-4 break-words text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
    </div>
  );
}

function ReportBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-50 p-4">
      <p className="text-sm text-gray-500">Ventas {label.toLowerCase()}</p>
      <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
    </div>
  );
}

function Row({
  title,
  subtitle,
  details = [],
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle: string;
  details?: string[];
  onEdit?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <p className="break-words font-bold text-gray-950">{title}</p>
        <p className="break-words text-sm text-gray-500">{subtitle}</p>
        {details.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {details.map((detail) => (
              <span key={detail} className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-gray-600">
                {detail}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-2 self-end sm:self-auto">
        {onEdit && (
          <button type="button" onClick={onEdit} className="rounded-lg border p-2 text-gray-700 hover:bg-stone-50" aria-label="Editar">
            <Pencil className="h-4 w-4" />
          </button>
        )}
        <button type="button" onClick={onDelete} className="rounded-lg border p-2 text-red-600 hover:bg-red-50" aria-label="Eliminar">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
