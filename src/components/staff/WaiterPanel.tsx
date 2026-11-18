"use client";

import StaffHeader from "@/components/staff/StaffHeader";

import { postOrder } from "@/actions/orders/post-order";
import { useRouter } from "next/navigation";
import TableDiningCode from "./TableDiningCode";
import WaiterServiceQueue from "./WaiterServiceQueue";
import { cancelOrder } from "@/actions/orders/cancel-order";
import { updateKitchenItemState } from "@/actions/advanced/advanced-actions";
import {
  addTableSessionPayment,
  addTableSessionTip,
  closeTableSession,
  createTableSession,
  getTableSessionById,
  getTableSessionTicket,
  moveTableSession,
  splitTableSessionBill,
} from "@/actions/table-sessions/table-session-actions";
import type { IDishCustomization, IMenu, IOrder } from "@/interfaces";
import type { Booking, Table, TableSession } from "@/interfaces/reservation.interface";
import { formatARS, parseCurrency } from "@/lib/format";
import { useRealtime } from "@/hooks/realtime/useRealtime";
import { getUserIdFromToken } from "@/utils/getUserIdFromToken";
import { getCustomizationDetails, getOrderItemName } from "@/lib/order-utils";
import { Bell, CheckCircle, CreditCard, Minus, Plus, Search, Trash2, Utensils } from "lucide-react";
import {
  addSessionGuest, fireNextCourse, getKitchenSignals, getSessionLedger, settleSession, type KitchenSignals, type SessionLedger,
} from "@/actions/service/service-actions";
import RadarStrip from "./RadarStrip";
// Dock inferior y hoja de comanda: ver staff.css (.waiter-*)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TicketItem = {
  /** Plato + comensal: el mismo plato puede ir a dos personas distintas. */
  key: string;
  menu: IMenu;
  quantity: number;
  notes: string;
  customizations: Record<number, boolean>;
  guestId: number | null;
};

type Props = {
  menu: IMenu[];
  tables: Table[];
  bookings: Booking[];
  activeSessions: TableSession[];
};

const todayInArgentina = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const menuCustomizations = (menuItem: IMenu) => menuItem.dishCustomizations || menuItem.customizations || [];

const initialCustomizationState = (menuItem: IMenu) =>
  menuCustomizations(menuItem).reduce<Record<number, boolean>>((values, customization) => {
    values[customization.id] = Boolean(customization.isDefaultIncluded || customization.isRequired);
    return values;
  }, {});

const customizationDelta = (customization: IDishCustomization, selected: boolean) => {
  if (selected && !customization.isDefaultIncluded && !customization.isRequired) return Math.max(0, Number(customization.additionalPrice || 0));
  return 0;
};

/* Pedidos especiales frecuentes: un toque los agrega a la nota del plato que ve cocina. */
const SPECIAL_REQUESTS: Record<string, string[]> = {
  "Plato Principal": ["Punto jugoso", "A punto", "Bien cocido", "Sin sal", "Sin cebolla", "Salsa aparte"],
  Entrada: ["Sin sal", "Sin picante", "Salsa aparte", "Para compartir"],
  Ensalada: ["Aderezo aparte", "Sin cebolla", "Sin queso"],
  Guarnicion: ["Sin sal", "Bien doradas", "Para compartir"],
  Postre: ["Sin crema", "Para compartir", "Con vela"],
  Bebida: ["Sin hielo", "Con limón", "Bien fría"],
  default: ["Sin sal", "Para compartir"],
};

export default function WaiterPanel({ menu, tables, bookings, activeSessions }: Props) {
  const router = useRouter();
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [ticket, setTicket] = useState<TicketItem[]>([]);
  const [session, setSession] = useState<TableSession | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [splitCount, setSplitCount] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [ticketPreview, setTicketPreview] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);
  const [workRevision, setWorkRevision] = useState(0);
  const selectedTableRef = useRef<number | null>(null);
  const [cancelReasons, setCancelReasons] = useState<Record<number, string>>({});
  const [ticketOpen, setTicketOpen] = useState(false);
  const [menuType, setMenuType] = useState("Todos");
  const [queue, setQueue] = useState({ calls: 0, dishes: 0 });
  const [zone, setZone] = useState("Todas");
  const [pacing, setPacing] = useState<"together" | "courses">("together");
  const [firing, setFiring] = useState(false);
  const [ledger, setLedger] = useState<SessionLedger | null>(null);
  const [forGuest, setForGuest] = useState<number | null>(null);
  const [newGuest, setNewGuest] = useState("");
  const [settleMethod, setSettleMethod] = useState<"card" | "cash" | "mp">("card");
  const [ledgerBusy, setLedgerBusy] = useState<string | null>(null);
  const [kitchen, setKitchen] = useState<KitchenSignals | null>(null);

  // Tiempos de cocina: si no cargan, la carta rápida funciona igual.
  useEffect(() => {
    let active = true;
    const load = () => getKitchenSignals().then((value) => { if (active) setKitchen(value); }).catch(() => { if (active) setKitchen(null); });
    void load();
    const timer = window.setInterval(load, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  // "Mi sector" se recuerda en el celular del mozo.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mozo-sector");
      if (saved) setZone(saved);
    } catch { /* almacenamiento no disponible */ }
  }, []);
  const chooseZone = (value: string) => {
    setZone(value);
    try { window.localStorage.setItem("mozo-sector", value); } catch { /* almacenamiento no disponible */ }
  };

  const today = todayInArgentina();
  const checkedInBookings = useMemo(
    () =>
      bookings.filter(
        (booking) => booking.status === "checked_in" && (booking.date || booking.bookingDate?.slice(0, 10)) === today
      ),
    [bookings, today]
  );
  const bookingByTableId = useMemo(() => {
    const map = new Map<number, Booking>();
    checkedInBookings.forEach((booking) => {
      booking.assignedTables?.forEach((table) => map.set(table.id, booking));
    });
    return map;
  }, [checkedInBookings]);
  const sessionByTableId = useMemo(() => {
    const map = new Map<number, TableSession>();
    activeSessions.forEach((activeSession) => map.set(activeSession.tableId, activeSession));
    return map;
  }, [activeSessions]);
  const eligibleTables = useMemo(
    () => tables.filter((table) => table.status === "available" || bookingByTableId.has(table.id) || sessionByTableId.has(table.id)),
    [bookingByTableId, sessionByTableId, tables]
  );
  const selectedTable = eligibleTables.find((table) => table.id === selectedTableId) || null;
  const selectedBooking = selectedTable ? bookingByTableId.get(selectedTable.id) || (session?.tableId === selectedTable.id ? session.booking : null) : null;
  const accountOrders = session?.orders || [];
  const readyItems = accountOrders.flatMap((order) =>
    (order.items || [])
      .filter((item) => item.state === "ready")
      .map((item) => ({ order, item }))
  );
  const accountTotal = Number(session?.totalAmount ?? accountOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0));
  const paidAmount = Number(session?.paidAmount || 0);
  const tipTotal = Number(session?.tipAmount || 0);
  const remainingAmount = Math.max(0, accountTotal - paidAmount);

  const menuTypes = useMemo(
    () => ["Todos", ...Array.from(new Set(menu.filter((item) => item.available).map((item) => item.typeDish)))],
    [menu]
  );

  const filteredMenu = useMemo(() => {
    const clean = query.trim().toLowerCase();
    return menu.filter((item) =>
      item.available &&
      (menuType === "Todos" || item.typeDish === menuType) &&
      (!clean || [item.nameDish, item.typeDish].some((value) => value.toLowerCase().includes(clean)))
    );
  }, [menu, query, menuType]);

  const ticketCount = ticket.reduce((sum, item) => sum + item.quantity, 0);
  const guestOptions = (ledger?.buckets ?? []).filter((bucket) => bucket.guestId).map((bucket) => ({ id: bucket.guestId as number, alias: bucket.alias }));

  const loadLedger = useCallback(async (sessionId: number) => {
    try {
      setLedger(await getSessionLedger(sessionId));
    } catch {
      setLedger(null);
    }
  }, []);
  useEffect(() => {
    setForGuest(null);
    if (session?.id) void loadLedger(session.id);
    else setLedger(null);
  }, [session?.id, session?.totalAmount, session?.paidAmount, loadLedger]);

  async function addGuest() {
    if (!session || !newGuest.trim()) return;
    setLedgerBusy("guest");
    setError(null);
    try {
      const guest = await addSessionGuest(session.id, newGuest.trim());
      setNewGuest("");
      setForGuest(guest.id);
      await loadLedger(session.id);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo agregar el comensal.");
    } finally {
      setLedgerBusy(null);
    }
  }

  async function settle(guestIds: number[], includeTable: boolean, label: string) {
    if (!session) return;
    setLedgerBusy(label);
    setError(null);
    try {
      const result = await settleSession(session.id, { guestIds, includeTable, method: settleMethod });
      setSuccess(result.tableClosed ? "Cuenta saldada: la mesa se liberó." : `Cobro registrado (${label}).`);
      await refreshSession(session.id);
      await loadLedger(session.id);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo registrar el cobro.");
    } finally {
      setLedgerBusy(null);
    }
  }
  const courseOf = (typeDish: string) =>
    typeDish === "Bebida" ? "bebida" : typeDish === "Postre" ? "postre" : ["Entrada", "Ensalada"].includes(typeDish) ? "entrada" : "principal";
  const ticketCourses = new Set(ticket.map((item) => courseOf(item.menu.typeDish)).filter((course) => course !== "bebida"));
  const zones = [...new Set(tables.map((table) => (table as Table & { zone?: string | null }).zone).filter(Boolean))] as string[];
  const visibleTables = zone === "Todas"
    ? eligibleTables
    : eligibleTables.filter((table) => (table as Table & { zone?: string | null }).zone === zone);
  const heldItems = accountOrders.flatMap((order) => order.items || []).filter((item) => (item as { held?: boolean }).held);
  const quantityOf = (menuId: number) => ticket.filter((item) => item.menu.id === menuId).reduce((sum, item) => sum + item.quantity, 0);

  const total = ticket.reduce((sum, item) => {
    const customizations = menuCustomizations(item.menu);
    const extras = customizations.reduce(
      (extraSum, customization) =>
        extraSum + customizationDelta(customization, item.customizations[customization.id] ?? false),
      0
    );
    return sum + (parseCurrency(item.menu.price) + extras) * item.quantity;
  }, 0);

  const refreshSession = useCallback(async (sessionId?: number | null) => {
    if (!sessionId) return;
    const fresh = await getTableSessionById(sessionId);
    if (fresh?.tableId === selectedTableRef.current) setSession(fresh.status === "active" ? fresh : null);
  }, []);

  const sessionId = session?.id;
  const realtimeHandlers = useMemo(
    () => ({
      table_sessions_updated: () => router.refresh(),
      waiter_calls_updated: () => setWorkRevision((value) => value + 1),
      order_created: (payload: unknown) => {
        const event = payload as { tableSessionId?: number };
        if (sessionId && event.tableSessionId === sessionId) void refreshSession(sessionId);
      },
      order_item_ready: (payload: unknown) => {
        const item = payload as { item?: { order_id?: number } };
        setLiveAlert(`Cocina marco un plato listo${item.item?.order_id ? ` para el pedido #${item.item.order_id}` : ""}.`);
        setWorkRevision((value) => value + 1);
      },
      order_ready: () => {
        setLiveAlert("Hay un pedido completo listo para retirar.");
      },
      kitchen_item_updated: (payload: unknown) => {
        const event = payload as { tableSessionId?: number };
        if (sessionId && event.tableSessionId === sessionId) void refreshSession(sessionId);
        setWorkRevision((value) => value + 1);
      },
      order_cancelled: () => {
        if (sessionId) void refreshSession(sessionId);
        setWorkRevision((value) => value + 1);
      },
    }),
    [sessionId, refreshSession, router]
  );
  useRealtime("waiter", realtimeHandlers);

  useEffect(() => {
    if (!eligibleTables.length) {
      setSelectedTableId(null);
      setSession(null);
      return;
    }

    if (!selectedTableId || !eligibleTables.some((table) => table.id === selectedTableId)) {
      setSelectedTableId(eligibleTables[0].id);
    }
  }, [eligibleTables, selectedTableId]);

  useEffect(() => {
    if (!selectedTable) return;
    selectedTableRef.current = selectedTable.id;
    const activeSession = sessionByTableId.get(selectedTable.id) || null;
    const booking = bookingByTableId.get(selectedTable.id);
    setSession(activeSession);
    setPartySize(activeSession?.partySize ?? booking?.numberPeople ?? Math.min(selectedTable.ability, 2));
  }, [bookingByTableId, selectedTable, sessionByTableId]);

  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshSession(sessionId);
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [sessionId, refreshSession]);

  const ensureSession = async () => {
    if (session && session.tableId === selectedTable?.id) return session;
    const userId = getUserIdFromToken();
    if (!selectedTable || !userId) {
      throw new Error("Seleccioná una mesa disponible o con check-in.");
    }
    const created = await createTableSession({
      tableId: selectedTable.id,
      bookingId: selectedBooking?.id ?? null,
      partySize,
      waiterId: userId,
    });
    setSession(created);
    await refreshSession(created.id);
    return created;
  };

  const addItem = (menuItem: IMenu) => {
    setSuccess(null);
    const key = `${menuItem.id}:${forGuest ?? 0}`;
    setTicket((current) => {
      const index = current.findIndex((item) => item.key === key);
      if (index === -1) {
        return [...current, { key, menu: menuItem, quantity: 1, notes: "", customizations: initialCustomizationState(menuItem), guestId: forGuest }];
      }
      return current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity: item.quantity + 1 } : item
      );
    });
  };

  const updateItem = (key: string, patch: Partial<TicketItem>) => {
    setTicket((current) =>
      current
        .map((item) => (item.key === key ? { ...item, ...patch } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const sendOrder = async () => {
    const userId = getUserIdFromToken();
    if (!userId || !selectedTable || ticket.length === 0) {
      setError("Seleccioná una mesa y al menos un plato.");
      return;
    }
    const customerId = selectedBooking?.userId ?? null;

    setSending(true);
    setSuccess(null);
    setError(null);
    try {
      const activeSession = await ensureSession();
      await postOrder({
        customerId,
        deliveryType: "in_place",
        addressId: null,
        paymentType: "cash",
        state: "received",
        tableSessionId: activeSession.id,
        waiterId: userId,
        priority: "normal",
        pacing: ticketCourses.size > 1 ? pacing : "together",
        estimatedPrepMinutes: 25,
        total_amount: total,
        items: ticket.map((item) => ({
          menuId: item.menu.id,
          quantity: item.quantity,
          price:
            parseCurrency(item.menu.price) +
            menuCustomizations(item.menu).reduce(
              (extraSum, customization) =>
                extraSum + customizationDelta(customization, item.customizations[customization.id] ?? false),
              0
            ),
          notes: item.notes,
          state: "received",
          station: "kitchen", // la estación real la define el backend según el plato
          priority: "normal",
          estimatedPrepMinutes: 25,
          customizations: menuCustomizations(item.menu).map((customization) => ({
            customizationId: customization.id,
            isIncluded: item.customizations[customization.id] ?? false,
            notes: customization.description || "",
          })),
          guestIds: item.guestId ? [item.guestId] : undefined,
        })),
      });
      setTicket([]);
      void loadLedger(activeSession.id);
      await refreshSession(activeSession.id);
      if (!session) router.refresh();
      setSuccess(`Pedido enviado a cocina para mesa ${selectedTable.tableNum}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el pedido a cocina.");
    } finally {
      setSending(false);
    }
  };

  const handleOpenSession = async () => {
    setSending(true);
    setError(null);
    try {
      const created = await ensureSession();
      setSuccess(`Mesa ${selectedTable?.tableNum} abierta para ${created.partySize} personas.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir la mesa.");
    } finally {
      setSending(false);
    }
  };

  const handleSplit = async () => {
    if (!session || sessionBusy) return;
    setSessionBusy(true);
    setError(null);
    try {
      const result = await splitTableSessionBill(session.id, splitCount);
      setSuccess(`Cuenta dividida: ${formatARS(result.perPerson)} por persona.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo dividir la cuenta.");
    } finally {
      setSessionBusy(false);
    }
  };

  const handlePayment = async () => {
    const amount = parseCurrency(paymentAmount);
    if (!session || amount <= 0 || sessionBusy) return;
    setSessionBusy(true);
    setError(null);
    try {
      await addTableSessionPayment(session.id, { amount, method: "cash" });
      setPaymentAmount("");
      await refreshSession(session.id);
      setSuccess("Pago parcial registrado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
    } finally {
      setSessionBusy(false);
    }
  };

  const handleFullPayment = async () => {
    if (!session || remainingAmount <= 0 || sessionBusy) return;
    setSessionBusy(true);
    setError(null);
    try {
      await addTableSessionPayment(session.id, { amount: remainingAmount, method: "cash" });
      await refreshSession(session.id);
      setSuccess("Cuenta marcada como cobrada y registrada en caja.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cobrar la cuenta.");
    } finally {
      setSessionBusy(false);
    }
  };

  const handleTip = async () => {
    const amount = parseCurrency(tipAmount);
    if (!session || amount <= 0 || sessionBusy) return;
    setSessionBusy(true);
    setError(null);
    try {
      await addTableSessionTip(session.id, { amount, method: "cash", waiterId: getUserIdFromToken() || undefined });
      setTipAmount("");
      await refreshSession(session.id);
      setSuccess("Propina registrada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la propina.");
    } finally {
      setSessionBusy(false);
    }
  };

  const handleMove = async (tableId: number) => {
    if (!session || !tableId || sessionBusy) return;
    setSessionBusy(true);
    setError(null);
    try {
      const moved = await moveTableSession(session.id, tableId);
      setSession(moved);
      setSelectedTableId(tableId);
      setSuccess("Mesa cambiada correctamente.");
      setWorkRevision((value) => value + 1);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la mesa.");
    } finally {
      setSessionBusy(false);
    }
  };

  const handleClose = async () => {
    if (!session) return;
    setError(null);
    try {
      await closeTableSession(session.id, "Cierre desde panel de mozo");
      setSession(null);
      setTicket([]);
      setSuccess("Mesa cerrada.");
      setWorkRevision((value) => value + 1);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar la mesa.");
    }
  };

  const handleTicket = async () => {
    if (!session) return;
    setError(null);
    try {
      const ticketText = await getTableSessionTicket(session.id);
      setTicketPreview(ticketText);
      setSuccess("Ticket generado para reimpresion.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el ticket.");
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!session) return;
    const reason = cancelReasons[orderId]?.trim() || "Pedido cargado por equivocacion";
    setSending(true);
    setError(null);
    try {
      await cancelOrder(orderId, reason);
      await refreshSession(session.id);
      setSuccess(`Pedido #${orderId} cancelado y retirado de cocina.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar el pedido.");
    } finally {
      setSending(false);
    }
  };

  const handleMarkServed = async (itemId: number) => {
    await updateKitchenItemState(itemId, { state: "delivered" });
    await refreshSession(session?.id);
    setWorkRevision((value) => value + 1);
    setSuccess("Plato marcado como servido.");
  };

  function selectTable(tableId: number) {
    if (sending || sessionBusy || tableId === selectedTableId) return;
    if (!eligibleTables.some((table) => table.id === tableId)) router.refresh();
    selectedTableRef.current = tableId;
    setSelectedTableId(tableId);
    setTicket([]);
    setTicketPreview(null);
  }

  return (
    <div className="staff-shell waiter-screen">
      <StaffHeader area="mozo" title="Servicio de mesas" description="Atendé llamados, serví los platos listos y tomá pedidos en persona." />

      <nav aria-label="Secciones de salón" className="staff-jump">
        <a href="#service-queue">Bandeja</a><a href="#mesas">Mesas</a><a href="#carta-rapida">Carta rápida</a><a href="#ticket">Comanda</a>
      </nav>
      <div className="mb-4">
        <RadarStrip role="waiter" title="Atención ahora" />
      </div>
      <div className="mb-6">
        <WaiterServiceQueue revision={workRevision} selectTable={selectTable} serveDish={handleMarkServed} onCounts={setQueue} />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)]">
        <div className="min-w-0 space-y-5">
          <section className="staff-panel p-4 sm:p-5">
            <h2 className="text-xl font-bold text-gray-950" id="mesas">Mesas</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-[160px_1fr]">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Personas</span>
                <input
                  type="number"
                  min={1}
                  max={selectedBooking ? 20 : selectedTable?.ability ?? 20}
                  disabled={Boolean(session)}
                  value={partySize}
                  onChange={(event) => setPartySize(Number(event.target.value) || 1)}
                  className="w-full rounded-lg border px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Visita</span>
                <input
                  type="text"
                  value={selectedBooking?.user ? `${selectedBooking.user.firstName} ${selectedBooking.user.lastName}`.trim() : selectedBooking ? "Reserva con check-in" : selectedTable ? "Sin reserva" : ""}
                  readOnly
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Seleccioná una mesa"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleOpenSession}
                  disabled={!selectedTable || Boolean(session) || sending}
                  className="rounded-lg bg-primario-600 px-4 py-2 font-semibold text-white disabled:bg-gray-300"
                >
                  {session ? "Mesa abierta" : "Abrir mesa"}
                </button>
              </div>
              {session && (
                <button
                  type="button"
                  onClick={handleTicket}
                  className="rounded-lg border px-4 py-2 font-semibold text-gray-700 hover:bg-stone-50"
                >
                  Reimprimir ticket
                </button>
              )}
            </div>
            {zones.length > 0 && (
              <div className="waiter-chips -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Mi sector">
                {["Todas", ...zones].map((value) => (
                  <button key={value} type="button" aria-pressed={zone === value} onClick={() => chooseZone(value)}
                    className={`customer-press min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${zone === value ? "border-[#17336d] bg-[#17336d] text-white" : "border-stone-300 bg-white text-stone-700"}`}>
                    {value === "Todas" ? "Todas las mesas" : value}
                  </button>
                ))}
              </div>
            )}
            <div className="waiter-tables mt-4 flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible 2xl:grid-cols-5">
              {visibleTables.map((table) => {
                const booking = bookingByTableId.get(table.id);
                const activeSession = sessionByTableId.get(table.id);
                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => selectTable(table.id)}
                    aria-pressed={selectedTableId === table.id}
                    className={`waiter-table customer-press min-h-[5.5rem] min-w-[8.5rem] shrink-0 rounded-xl border p-3 text-left transition sm:min-w-0 ${
                      selectedTableId === table.id
                        ? "border-[#17336d] bg-[#17336d] text-white shadow-md"
                        : "bg-white hover:border-primario-300"
                    }`}
                  >
                    <span className="block font-bold">Mesa {table.tableNum}</span>
                    <span className={`block text-sm ${selectedTableId === table.id ? "text-blue-100" : "text-gray-500"}`}>{table.ability} personas</span>
                    <span className={`mt-2 inline-block rounded-md px-2 py-1 text-xs font-semibold ${selectedTableId === table.id ? "bg-white text-[#17336d]" : activeSession ? "bg-primario-100 text-primario-800" : booking ? "bg-amber-100 text-amber-900" : "bg-green-50 text-green-800"}`}>
                      {activeSession ? "Cuenta activa" : booking ? "Check-in" : "Disponible"}
                    </span>
                  </button>
                );
              })}
            </div>
            {eligibleTables.length === 0 && (
              <div className="mt-4 rounded-lg border border-dashed p-5 text-sm text-gray-500">
                No hay mesas disponibles ni visitas abiertas.
              </div>
            )}
            {session && selectedTable && <TableDiningCode key={`${session.id}-${session.tableId}`} sessionId={session.id} tableNum={selectedTable.tableNum} />}
          </section>

          <section className="staff-panel p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 id="carta-rapida" className="text-xl font-bold text-gray-950">Carta rápida</h2>
              <div className="relative sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-lg border py-2 pl-9 pr-3"
                  type="search"
                    aria-label="Buscar plato"
                    placeholder="Buscar plato…"
                />
              </div>
            </div>

            {session && (
              <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-2">
                <p className="px-1 text-xs font-semibold text-stone-600">Cargando para</p>
                <div className="waiter-chips mt-1 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Comensal">
                  {[{ id: null as number | null, alias: "La mesa" }, ...guestOptions].map((guest) => (
                    <button key={guest.id ?? "mesa"} type="button" aria-pressed={forGuest === guest.id} onClick={() => setForGuest(guest.id)}
                      className={`customer-press min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${forGuest === guest.id ? "border-[#17336d] bg-[#17336d] text-white" : "border-stone-300 bg-white text-stone-700"}`}>
                      {guest.alias}
                    </button>
                  ))}
                  <form className="flex shrink-0 gap-1" onSubmit={(event) => { event.preventDefault(); void addGuest(); }}>
                    <label className="sr-only" htmlFor="new-guest">Nuevo comensal</label>
                    <input id="new-guest" value={newGuest} maxLength={40} placeholder="+ Comensal"
                      onChange={(event) => setNewGuest(event.target.value)} className="min-h-11 w-28 rounded-full border border-stone-300 px-3 text-sm" />
                    {newGuest.trim() && <button type="submit" disabled={ledgerBusy === "guest"} className="min-h-11 rounded-full bg-[#17336d] px-3 text-sm font-semibold text-white">Sumar</button>}
                  </form>
                </div>
              </div>
            )}

            <div className="waiter-chips -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Tipo de plato">
              {menuTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={menuType === type}
                  onClick={() => setMenuType(type)}
                  className={`customer-press min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${
                    menuType === type ? "border-primario-600 bg-primario-600 text-white" : "border-stone-300 bg-white text-stone-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {kitchen?.enabled && kitchen.stations.some((state) => state.saturated) && (
              <p role="status" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                <strong>{kitchen.stations.filter((state) => state.saturated).map((state) => ({ kitchen: "Cocina", grill: "Parrilla", salad: "Ensaladas", dessert: "Postres", bar: "Barra" } as Record<string, string>)[state.station] ?? state.station).join(" y ")} con mucha demanda.</strong>
                {kitchen.suggestions.length > 0 && <> Ofrecé: {kitchen.suggestions.map((id) => menu.find((dish) => dish.id === id)?.nameDish).filter(Boolean).join(", ")}.</>}
              </p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
              {filteredMenu.length === 0 && <p className="col-span-full text-sm text-slate-600">{query.trim() ? "No encontramos platos con esa búsqueda." : "No hay platos disponibles."}</p>}
              {filteredMenu.map((item) => {
                const qty = quantityOf(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    aria-label={`Agregar ${item.nameDish}${qty ? `, ya hay ${qty} en la comanda` : ""}`}
                    className={`waiter-tile customer-press relative flex min-h-[6.5rem] flex-col justify-between rounded-xl border p-3 text-left transition ${
                      qty ? "border-primario-500 bg-primario-50" : "border-stone-200 bg-white hover:border-primario-300"
                    }`}
                  >
                    {qty > 0 && (
                      <span className="absolute right-2 top-2 grid min-w-7 place-items-center rounded-full bg-primario-600 px-2 py-0.5 text-sm font-bold text-white">
                        {qty}
                      </span>
                    )}
                    <span className="pr-8 text-[0.95rem] font-bold leading-tight text-gray-950">{item.nameDish}</span>
                    {kitchen?.enabled && (kitchen.dishes[item.id]?.fast || kitchen.dishes[item.id]?.slow) && (
                      <span className={`mt-1 w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${kitchen.dishes[item.id].slow ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>
                        {kitchen.dishes[item.id].slow ? "Demora" : "Sale en"} ~{kitchen.dishes[item.id].etaMinutes} min
                      </span>
                    )}
                    <span className="mt-2 flex items-end justify-between gap-2">
                      <span className="text-sm font-bold text-primario-700">{formatARS(item.price)}</span>
                      <span className="grid size-9 place-items-center rounded-full bg-primario-600 text-white" aria-hidden="true">
                        <Plus className="size-4" />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className={`staff-panel waiter-sheet p-4 sm:p-5 ${ticketOpen ? "is-open" : ""}`} aria-labelledby="ticket">
          <div className="flex items-center justify-between gap-3">
            <h2 id="ticket" className="text-xl font-bold text-gray-950">Comanda de la mesa</h2>
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primario-700" />
              <button type="button" onClick={() => setTicketOpen(false)} className="customer-press min-h-11 rounded-lg border px-3 text-sm font-semibold lg:hidden">
                Cerrar
              </button>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {selectedTable ? `Mesa ${selectedTable.tableNum}${session ? " - cuenta abierta" : ""}` : "Seleccioná una mesa"}
          </p>
          {liveAlert && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {liveAlert}
            </div>
          )}

          <div className="mt-5 space-y-4">
            {ticket.map((item) => {
              const customizations = menuCustomizations(item.menu);
              return (
                <article key={item.key} className="rounded-lg border border-gray-100 bg-stone-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-950">{item.menu.nameDish}</h3>
                      <p className="text-sm text-gray-500">{formatARS(item.menu.price)}</p>
                      {guestOptions.length > 0 && (
                        <label className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">Para
                          <select value={item.guestId ?? ""} className="min-h-9 rounded-md border bg-white px-1.5"
                            onChange={(event) => {
                              const guestId = event.target.value ? Number(event.target.value) : null;
                              updateItem(item.key, { guestId, key: `${item.menu.id}:${guestId ?? 0}:${Date.now()}` });
                            }}>
                            <option value="">La mesa</option>
                            {guestOptions.map((guest) => <option key={guest.id} value={guest.id}>{guest.alias}</option>)}
                          </select>
                        </label>
                      )}
                    </div>
                    <div className="flex items-center rounded-lg border bg-white">
                      <button
                        type="button"
                        onClick={() => updateItem(item.key, { quantity: item.quantity - 1 })}
                        className="p-2 text-gray-600 hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItem(item.key, { quantity: item.quantity + 1 })}
                        className="p-2 text-gray-600 hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {customizations.length > 0 && (
                    <div className="mt-3 space-y-2 text-sm text-gray-600">
                      {customizations.map((customization) => (
                        <label key={customization.id} className="flex items-start gap-2 rounded-lg bg-white p-2 ring-1 ring-stone-200">
                          <input
                            className="mt-1"
                            type="checkbox"
                            checked={item.customizations[customization.id] ?? false}
                            disabled={customization.isRequired}
                            onChange={() => {
                              const currentValue = item.customizations[customization.id] ?? false;
                              updateItem(item.key, {
                                customizations: {
                                  ...item.customizations,
                                  [customization.id]: !currentValue,
                                },
                              });
                            }}
                          />
                          <span>
                            <span className="block font-semibold text-gray-800">
                              {customization.isDefaultIncluded && !(item.customizations[customization.id] ?? false)
                                ? `Sin ${customization.name}`
                                : customization.name}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {customization.description || (customization.isDefaultIncluded ? "Incluido por defecto" : "Agregado opcional")}
                              {!customization.isDefaultIncluded && Number(customization.additionalPrice) > 0
                                ? ` - +${formatARS(customization.additionalPrice)}`
                                : ""}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {item.menu.ingredients && item.menu.ingredients.length > 0 && (
                    <div className="mt-3 rounded-lg bg-white p-2 text-xs text-gray-500 ring-1 ring-stone-200">
                      <p className="font-semibold text-gray-700">Ingredientes necesarios</p>
                      <p className="mt-1">
                        {item.menu.ingredients.map((ingredient) =>
                          `${ingredient.quantity} ${ingredient.unit} ${ingredient.inventory?.name || "insumo"}`
                        ).join(" | ")}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-2">
                    <label htmlFor={`nota-${item.key}`} className="text-sm font-semibold text-amber-950">Pedido especial para cocina</label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Pedidos frecuentes">
                      {(SPECIAL_REQUESTS[item.menu.typeDish] ?? SPECIAL_REQUESTS.default).map((phrase) => {
                        const active = item.notes.split(" · ").includes(phrase);
                        return (
                          <button key={phrase} type="button" aria-pressed={active}
                            onClick={() => {
                              const parts = item.notes.split(" · ").map((part) => part.trim()).filter(Boolean);
                              const next = active ? parts.filter((part) => part !== phrase) : [...parts, phrase];
                              updateItem(item.key, { notes: next.join(" · ").slice(0, 255) });
                            }}
                            className={`customer-press min-h-9 rounded-full border px-3 text-xs font-semibold ${active ? "border-amber-700 bg-amber-200 text-amber-950" : "border-amber-300 bg-white text-stone-700"}`}>
                            {phrase}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      id={`nota-${item.key}`}
                      value={item.notes}
                      maxLength={255}
                      onChange={(event) => updateItem(item.key, { notes: event.target.value })}
                      className="mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm"
                      placeholder="Otro pedido del cliente: sin sal, bien cocido, etc."
                      rows={2}
                    />
                  </div>
                </article>
              );
            })}

            {ticket.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
                Todavia no agregaste platos.
              </div>
            )}
          </div>

          {ticketCourses.size > 1 && (
            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-gray-800">¿Cómo sale de cocina?</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {([["together", "Todo junto"], ["courses", "Por tiempos"]] as const).map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={pacing === value} onClick={() => setPacing(value)}
                    className={`customer-press min-h-11 rounded-lg border text-sm font-semibold ${pacing === value ? "border-[#17336d] bg-[#17336d] text-white" : "border-stone-300 bg-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {pacing === "courses" && <p className="mt-1 text-xs text-gray-500">Las entradas salen ya; lo siguiente, cuando la mesa termine.</p>}
            </fieldset>
          )}

          <div className="mt-5 flex items-center justify-between border-t pt-4">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold text-primario-700">{formatARS(total)}</span>
          </div>

          <button
            type="button"
            disabled={!selectedTable || ticket.length === 0 || sending}
            onClick={sendOrder}
            className="mt-4 w-full rounded-lg bg-primario-600 px-4 py-3 font-semibold text-white hover:bg-primario-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {sending ? "Enviando..." : "Enviar a cocina"}
          </button>

          {session && (
            <div className="mt-5 space-y-3 border-t pt-4">
              {ledger && ledger.buckets.length > 0 && (
                <section aria-labelledby="ledger-title" className="rounded-lg border border-stone-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id="ledger-title" className="font-bold text-gray-950">Cuenta por comensal</h3>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">Cobro con
                      <select value={settleMethod} onChange={(event) => setSettleMethod(event.target.value as "card" | "cash" | "mp")} className="min-h-9 rounded-md border bg-white px-1.5">
                        <option value="card">Tarjeta</option><option value="cash">Efectivo</option><option value="mp">Mercado Pago</option>
                      </select>
                    </label>
                  </div>
                  <ul className="mt-2 divide-y divide-stone-100 text-sm">
                    {ledger.buckets.map((bucket) => (
                      <li key={bucket.key} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <div className="min-w-0">
                          <p className="font-semibold">{bucket.alias}{bucket.addedByWaiter ? " · con mozo" : ""}</p>
                          <p className="text-xs text-gray-600">
                            {formatARS(bucket.owed)} · {bucket.outstanding === 0 ? "pagado" : bucket.reserved > 0 ? "pagándose desde la mesa" : `falta ${formatARS(bucket.outstanding)}`}
                            {bucket.credit > 0 && <strong className="ml-1 text-green-800">· a favor {formatARS(bucket.credit)}</strong>}
                          </p>
                        </div>
                        {bucket.available > 0 && (
                          <button type="button" disabled={ledgerBusy !== null}
                            onClick={() => settle(bucket.guestId ? [bucket.guestId] : [], !bucket.guestId, bucket.alias)}
                            className="customer-press min-h-10 rounded-lg border border-[#17336d] px-3 text-xs font-semibold text-[#17336d] disabled:opacity-50">
                            {ledgerBusy === bucket.alias ? "Cobrando…" : `Cobrar ${formatARS(bucket.available)}`}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {ledger.totals.available > 0 && (
                    <button type="button" disabled={ledgerBusy !== null}
                      onClick={() => settle(ledger.buckets.filter((bucket) => bucket.guestId).map((bucket) => bucket.guestId as number), true, "toda la mesa")}
                      className="customer-press mt-2 min-h-11 w-full rounded-lg bg-[#17336d] px-3 text-sm font-semibold text-white disabled:opacity-50">
                      Cobrar todo lo pendiente ({formatARS(ledger.totals.available)})
                    </button>
                  )}
                  {ledger.totals.credit > 0 && (
                    <p className="mt-2 rounded-md bg-green-50 p-2 text-xs font-semibold text-green-800">
                      Hay {formatARS(ledger.totals.credit)} a favor de comensales (por un cambio de plato). Devolvelo o descontalo al cerrar.
                    </p>
                  )}
                </section>
              )}
              {heldItems.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-semibold text-amber-900">{heldItems.length} {heldItems.length === 1 ? "plato espera" : "platos esperan"} la marcha</p>
                  <button type="button" disabled={firing}
                    onClick={async () => {
                      setFiring(true);
                      setError(null);
                      try {
                        await fireNextCourse(session.id);
                        await refreshSession(session.id);
                        setSuccess("Cocina recibió el siguiente tiempo.");
                      } catch (problem) {
                        setError(problem instanceof Error ? problem.message : "No se pudo avisar a cocina.");
                      } finally {
                        setFiring(false);
                      }
                    }}
                    className="customer-press mt-2 min-h-11 w-full rounded-lg bg-[#17336d] px-3 text-sm font-semibold text-white disabled:opacity-60">
                    {firing ? "Avisando…" : "Marchar lo siguiente"}
                  </button>
                </div>
              )}
              {readyItems.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="font-bold text-green-800">Listos para retirar</p>
                  <div className="mt-2 space-y-2">
                    {readyItems.map(({ order, item }) => (
                      <div key={item.id} className="rounded-lg bg-white p-2 text-sm text-gray-700 ring-1 ring-green-100">
                        <p className="font-semibold">
                          Mesa {selectedTable?.tableNum} - Pedido #{order.id}: {item.quantity}x {getOrderItemName(item)}
                        </p>
                        {getCustomizationDetails(item).length > 0 && (
                          <p className="mt-1 text-xs text-gray-500">{getCustomizationDetails(item).join(", ")}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => { void handleMarkServed(item.id).catch(() => setError("No se pudo confirmar la entrega.")); }}
                          className="mt-2 rounded-lg border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-700"
                        >
                          Marcar servido
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-lg bg-stone-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-950">Cuenta de la mesa</p>
                  <CreditCard className="h-4 w-4 text-primario-700" />
                </div>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  {accountOrders.map((order: IOrder) => (
                    <div key={order.id} className={`rounded-lg bg-white p-2 ring-1 ${order.cancelledAt ? "ring-red-100 opacity-70" : "ring-stone-200"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold">Pedido #{order.id}{order.cancelledAt ? " - cancelado" : ""}</p>
                        {!order.cancelledAt && order.state !== "delivered" && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order.id)}
                            className="rounded-lg border border-red-100 p-1.5 text-red-600 hover:bg-red-50"
                            title="Cancelar pedido equivocado"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {(order.items || []).map((orderItem) => (
                        <div key={orderItem.id} className="mt-1 text-xs text-gray-600">
                          {orderItem.quantity}x {getOrderItemName(orderItem)}
                          {getCustomizationDetails(orderItem).length > 0 && (
                            <span> - {getCustomizationDetails(orderItem).join(", ")}</span>
                          )}
                        </div>
                      ))}
                      {!order.cancelledAt && order.state !== "delivered" && (
                        <input
                          value={cancelReasons[order.id] || ""}
                          onChange={(event) =>
                            setCancelReasons((current) => ({ ...current, [order.id]: event.target.value }))
                          }
                          className="mt-2 w-full rounded-lg border px-2 py-1 text-xs"
                          placeholder="Motivo si se cancela"
                        />
                      )}
                    </div>
                  ))}
                  {accountOrders.length === 0 && (
                    <p className="rounded-lg border border-dashed p-3 text-center text-xs text-gray-500">
                      Todavia no hay pedidos enviados para esta mesa.
                    </p>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-gray-500">Total</span>
                    <b>{formatARS(accountTotal)}</b>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-gray-500">Pagado</span>
                    <b>{formatARS(paidAmount)}</b>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-gray-500">Saldo</span>
                    <b>{formatARS(remainingAmount)}</b>
                  </div>
                  <div className="rounded-lg bg-white p-2">
                    <span className="block text-gray-500">Propina</span>
                    <b>{formatARS(tipTotal)}</b>
                  </div>
                </div>
                <button type="button" onClick={handleFullPayment} disabled={remainingAmount <= 0 || sessionBusy} className="mt-3 w-full rounded-lg bg-primario-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-300">
                  Marcar saldo como cobrado
                </button>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  min={1}
                  value={splitCount}
                  onChange={(event) => setSplitCount(Number(event.target.value) || 1)}
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Dividir por"
                />
                <button type="button" onClick={handleSplit} disabled={sessionBusy} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">
                  Dividir
                </button>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Monto de pago parcial"
                />
                <button type="button" onClick={handlePayment} disabled={parseCurrency(paymentAmount) <= 0 || sessionBusy} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">
                  Pagar
                </button>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tipAmount}
                  onChange={(event) => setTipAmount(event.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm"
                  placeholder="Monto de propina"
                />
                <button type="button" onClick={handleTip} disabled={parseCurrency(tipAmount) <= 0 || sessionBusy} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">
                  Registrar
                </button>
              </div>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value=""
                disabled={sessionBusy}
                onChange={(event) => event.target.value && handleMove(Number(event.target.value))}
              >
                <option value="">Cambiar mesa...</option>
                {tables
                  .filter((table) => table.id !== selectedTableId && table.status === "available")
                  .map((table) => (
                    <option key={table.id} value={table.id}>
                      Mesa {table.tableNum}
                    </option>
                  ))}
              </select>
              <button type="button" onClick={handleClose} className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">
                Cerrar mesa
              </button>
            </div>
          )}

          {success && (
            <div role="status" className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {ticketPreview && (
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-neutral-950 p-3 text-xs text-white">
              {ticketPreview}
            </pre>
          )}
        </aside>
      </div>

      <div className="waiter-dock lg:hidden" role="region" aria-label="Comanda rápida">
        {queue.calls + queue.dishes > 0 && (
          <button
            type="button"
            onClick={() => document.getElementById("service-queue")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="waiter-dock-alert customer-press"
            aria-label={`Bandeja: ${queue.calls} ${queue.calls === 1 ? "llamado" : "llamados"} y ${queue.dishes} ${queue.dishes === 1 ? "plato listo" : "platos listos"}`}
          >
            <Bell aria-hidden className="size-5" />
            <span className="tabular-nums">{queue.calls + queue.dishes}</span>
          </button>
        )}
        <button type="button" onClick={() => setTicketOpen(true)} className="waiter-dock-info customer-press">
          <span className="text-xs text-blue-100">{selectedTable ? `Mesa ${selectedTable.tableNum}` : "Sin mesa elegida"} · {ticketCount} {ticketCount === 1 ? "plato" : "platos"}</span>
          <strong className="text-lg tabular-nums">{formatARS(total)}</strong>
        </button>
        <button
          type="button"
          onClick={sendOrder}
          disabled={!selectedTable || ticket.length === 0 || sending}
          className="waiter-dock-send customer-press"
        >
          {sending ? "Enviando…" : !selectedTable ? "Elegí mesa" : "Enviar a cocina"}
        </button>
      </div>
    </div>
  );
}
