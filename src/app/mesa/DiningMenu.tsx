"use client";

import { dishPhoto } from "@/lib/dish-photos";
import {
  AlertTriangle, Bell, Check, ChevronRight, ClipboardList, Clock3, HandHelping, Languages, QrCode, Receipt,
  Settings2, ShoppingBag, ThumbsDown, ThumbsUp, Utensils, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./dining.css";

type Option = {
  id: number;
  name: string;
  description: string | null;
  additionalPrice: number | string;
  isDefaultIncluded: boolean;
  isRequired: boolean;
  isRemovable: boolean;
};

type Dish = {
  id: number;
  nameDish: string;
  typeDish: string;
  description: string | null;
  imageUrl: string | null;
  price: number | string;
  dishCustomizations: Option[];
  allergens?: string[];
  soldOut?: boolean;
  pairings?: number[];
  course?: string | null;
  prepMinutes?: number | null;
};

type Selection = Record<number, boolean>;
type CartLine = { dish: Dish; quantity: number; selected: Selection; notes: string; shareWith?: number[] };

type Preferences = { allergies: string[]; assisted: boolean; language: "es" | "en" };

type Status = {
  visitId: number;
  tableNum: number;
  callPending: boolean;
  callReason?: string | null;
  callTakenBy?: string | null;
  preferences?: Preferences;
  alias?: string | null;
  guests?: Array<{ id: number; alias: string; me: boolean; addedByWaiter: boolean }>;
  substitutions?: Array<{ id: number; orderItemId: number; status: string; original: string; proposed: string | null; priceDiff: number }>;
  orders: Array<{
    id: number;
    state: string;
    cancelledAt: string | null;
    total_amount: string | number;
    etaMinutes?: number | null;
    items: Array<{
      id: number; quantity: number; state: string; menu: { nameDish: string } | null;
      course?: string | null; held?: boolean; allergyAlert?: string | null; rating?: number | null;
      owners?: string[]; needsChange?: boolean;
    }>;
  }>;
};

type Bucket = {
  key: string; guestId: number | null; alias: string; me: boolean; addedByWaiter: boolean;
  owed: number; covered: number; reserved: number; outstanding: number; available: number; credit: number;
  items: Array<{ orderItemId: number; name: string; quantity: number; amount: number; sharedWith: number; state: string }>;
};
type Bill = {
  totals: { owed: number; covered: number; reserved: number; outstanding: number; available: number; credit: number };
  people: number;
  buckets: Bucket[];
  myRequests: Array<{ id: number; amount: number; tip: number; method: string; status: string }>;
};

/* Restricciones que puede marcar el comensal y cómo se cruzan con los alérgenos del plato. */
const RESTRICTIONS: Array<{ key: string; es: string; en: string }> = [
  { key: "gluten", es: "Sin gluten (celíaco)", en: "Gluten-free" },
  { key: "lactosa", es: "Sin lactosa", en: "Lactose-free" },
  { key: "huevo", es: "Sin huevo", en: "Egg-free" },
  { key: "frutos_secos", es: "Sin frutos secos", en: "No tree nuts" },
  { key: "mani", es: "Sin maní", en: "No peanuts" },
  { key: "soja", es: "Sin soja", en: "No soy" },
  { key: "pescado", es: "Sin pescado", en: "No fish" },
  { key: "mariscos", es: "Sin mariscos", en: "No shellfish" },
  { key: "sesamo", es: "Sin sésamo", en: "No sesame" },
  { key: "vegetariano", es: "Vegetariano", en: "Vegetarian" },
];
const ALLERGEN_LABEL: Record<string, string> = {
  gluten: "gluten", lactosa: "lactosa", huevo: "huevo", frutos_secos: "frutos secos", mani: "maní",
  soja: "soja", pescado: "pescado", mariscos: "mariscos", sesamo: "sésamo", carne: "carne",
};
function conflictsFor(dish: Dish, restrictions: string[]) {
  const allergens = dish.allergens ?? [];
  return restrictions.flatMap((restriction) => {
    if (restriction === "vegetariano") return ["carne", "pescado", "mariscos"].some((item) => allergens.includes(item)) ? ["vegetariano"] : [];
    return allergens.includes(restriction) ? [restriction] : [];
  });
}

/* Textos de la interfaz en español e inglés (los nombres de los platos quedan como en la carta). */
const COPY = {
  es: {
    call: "Llamar al mozo", called: "Mozo avisado", menu: "Menú", orders: "Tus pedidos", bill: "Cuenta", carta: "La carta",
    all: "Todo", soldOut: "Agotado", contains: "Contiene", notForYou: "No apto para vos", pairs: "Suele pedirse con",
    add: "Agregar al carrito", viewCart: "Ver carrito", send: "Confirmar y enviar a cocina", together: "Todo junto",
    togetherHint: "Cocina prepara todo y sale junto.", courses: "Por tiempos", coursesHint: "Primero las entradas; lo siguiente sale cuando terminen.",
    eta: "Listo en aprox.", held: "En espera", fire: "Traer lo siguiente", prefs: "Preferencias", rate: "¿Te gustó?",
  },
  en: {
    call: "Call the waiter", called: "Waiter notified", menu: "Menu", orders: "Your orders", bill: "Bill", carta: "The menu",
    all: "All", soldOut: "Sold out", contains: "Contains", notForYou: "Not suitable for you", pairs: "Often ordered with",
    add: "Add to cart", viewCart: "View cart", send: "Confirm and send to the kitchen", together: "All together",
    togetherHint: "Everything is cooked and served together.", courses: "Course by course", coursesHint: "Starters first; the next course comes when you finish.",
    eta: "Ready in about", held: "On hold", fire: "Bring the next course", prefs: "Preferences", rate: "Did you like it?",
  },
} as const;

const CALL_OPTIONS = [
  { reason: "pedido", label: "Quiero que me tomen el pedido", hint: "El mozo carga tu pedido por vos." },
  { reason: "consulta", label: "Tengo una consulta", hint: "Sobre un plato, ingredientes o la mesa." },
  { reason: "cuenta", label: "Quiero la cuenta", hint: "También podés pagar desde la pestaña Cuenta." },
  { reason: "asistencia", label: "Necesito ayuda", hint: "Te atendemos primero." },
] as const;

const states: Record<string, string> = {
  received: "Recibido", preparing: "En preparación", ready: "Listo", delivered: "Servido", cancelled: "Cancelado",
};
const orderStages = ["received", "preparing", "ready", "delivered"] as const;

const primary = "customer-press inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cliente-blue px-4 py-2 text-sm font-semibold text-white hover:bg-cliente-ink disabled:opacity-55";
const secondary = "customer-press inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cliente-line bg-white px-4 py-2 text-sm font-semibold text-cliente-ink hover:bg-cliente-mist disabled:opacity-55";
const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario-700";
const wholePesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const decimalPesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const formatARS = (amount: number) => (Number.isInteger(amount) ? wholePesos : decimalPesos).format(amount);

class DiningError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(operation: string, body?: object): Promise<T> {
  const response = await fetch(`/api/mesa/${operation}`, {
    cache: "no-store",
    ...(body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json();
  if (!response.ok) throw new DiningError(response.status, payload.error || "No se pudo completar la solicitud.");
  return payload;
}

function createRequestId() {
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const cents = (value: string | number) => Math.round(Number(value) * 100);
const lockedOption = (option: Option) => option.isRequired || (option.isDefaultIncluded && !option.isRemovable);
const optionPrice = (option: Option) => option.isDefaultIncluded || option.isRequired ? 0 : Math.max(0, cents(option.additionalPrice));
const linePrice = (line: CartLine) => (cents(line.dish.price) + line.dish.dishCustomizations.reduce(
  (sum, option) => sum + (line.selected[option.id] ? optionPrice(option) : 0), 0,
)) * line.quantity;
const errorText = (error: unknown) =>
  error instanceof DiningError ? error.message : "Perdimos la conexión. Volvé a intentar.";
const expired = (error: unknown) => error instanceof DiningError && [401, 410].includes(error.status);
const accessFailure = (error: unknown) => ({
  message: errorText(error),
  needsCode: error instanceof DiningError && [401, 404, 410].includes(error.status),
});

export default function DiningMenu() {
  const [menu, setMenu] = useState<Dish[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [accessError, setAccessError] = useState<{ message: string; needsCode: boolean } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [problem, setProblem] = useState("");
  const [orderIssue, setOrderIssue] = useState<"confirm" | "catalog" | "rejected" | null>(null);
  const [orderError, setOrderError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sentOrder, setSentOrder] = useState<number | null>(null);
  const [inCart, setInCart] = useState(false);
  const [category, setCategory] = useState("");
  const [tab, setTab] = useState<"menu" | "orders" | "bill">("menu");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [draft, setDraft] = useState<CartLine | null>(null);
  const [sending, setSending] = useState(false);
  const [calling, setCalling] = useState(false);
  const [pacing, setPacing] = useState<"together" | "courses">("together");
  const [bill, setBill] = useState<Bill | null>(null);
  const [payMode, setPayMode] = useState<"mine" | "guests" | "equal" | "total">("mine");
  const [payFor, setPayFor] = useState<string[]>([]);
  const [aliasDraft, setAliasDraft] = useState("");
  const aliasDialog = useRef<HTMLDialogElement>(null);
  const [answering, setAnswering] = useState<number | null>(null);
  const [tipPercent, setTipPercent] = useState(10);
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "mp">("card");
  const [paying, setPaying] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsDraft, setPrefsDraft] = useState<Preferences>({ allergies: [], assisted: false, language: "es" });
  const [firing, setFiring] = useState(false);
  const prefsDialog = useRef<HTMLDialogElement>(null);
  const callDialog = useRef<HTMLDialogElement>(null);
  const requestId = useRef<string | null>(null);
  const orderLock = useRef(false);
  const lastVisit = useRef<number | null>(null);
  const statusRevision = useRef(0);
  const join = useRef<{ code: string; promise: Promise<unknown> } | null>(null);
  const dishDialog = useRef<HTMLDialogElement>(null);
  const cartDialog = useRef<HTMLDialogElement>(null);
  const orderPanel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scan = () => {
      if (window.location.hash) setBootstrapAttempt((version) => version + 1);
    };
    window.addEventListener("hashchange", scan);
    return () => window.removeEventListener("hashchange", scan);
  }, []);

  useEffect(() => {
    let disposed = false;
    async function openVisit() {
      setLoading(true);
      setAccessError(null);
      try {
        const code = window.location.hash.slice(1);
        if (code) {
          if (join.current?.code !== code) {
            const previous = join.current?.promise.catch(() => {});
            const promise = Promise.resolve(previous).then(() => request("join", { code })).catch((error) => {
              if (join.current?.promise === promise) join.current = null;
              throw error;
            });
            join.current = { code, promise };
          }
          await join.current.promise;
          if (disposed || window.location.hash.slice(1) !== code) return;
          join.current = null;
          window.history.replaceState(null, "", window.location.pathname);
        }
        const [catalog, visit] = await Promise.all([request<Dish[]>("menu"), request<Status>("status")]);
        if (!disposed) {
          if (lastVisit.current !== null && lastVisit.current !== visit.visitId) {
            setCart([]);
            setCategory("");
            setOrderError("");
            setOrderIssue(null);
            setSentOrder(null);
            setInCart(false);
            setProblem("");
            setFeedback("");
            setTab("menu");
            requestId.current = null;
          }
          lastVisit.current = visit.visitId;
          setMenu(catalog);
          setStatus(visit);
        }
      } catch (error) {
        if (!disposed) setAccessError(accessFailure(error));
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    void openVisit();
    return () => { disposed = true; };
  }, [bootstrapAttempt]);

  const visitId = status?.visitId;

  useEffect(() => {
    if (!visitId || accessError) return;
    let active = true;
    let pending = false;
    const poll = async () => {
      if (pending || document.visibilityState !== "visible") return;
      pending = true;
      const revision = statusRevision.current;
      try {
        const fresh = await request<Status>("status");
        if (!active || revision !== statusRevision.current) return;
        if (fresh.visitId !== visitId) setAccessError({ message: "Este navegador abrió otra visita.", needsCode: true });
        else setStatus(fresh);
      } catch (error) {
        if (active && revision === statusRevision.current && expired(error)) setAccessError(accessFailure(error));
      } finally {
        pending = false;
      }
    };
    const timer = window.setInterval(poll, 7000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [visitId, accessError]);

  useEffect(() => {
    if (tab !== "bill" || !visitId) return;
    void loadBill();
    const timer = window.setInterval(() => { void loadBill(); }, 8000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, visitId]);

  useEffect(() => {
    if (!status || status.alias) return;
    let asked = false;
    try { asked = window.sessionStorage.getItem(`mesa-alias-${status.visitId}`) === "1"; } catch { /* sin almacenamiento */ }
    if (!asked && !aliasDialog.current?.open) aliasDialog.current?.showModal();
  }, [status]);

  const total = cart.reduce((sum, line) => sum + linePrice(line), 0);
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const categories = [...new Set(menu.map((dish) => dish.typeDish))];
  const preferences: Preferences = status?.preferences ?? { allergies: [], assisted: false, language: "es" };
  const t = COPY[preferences.language] ?? COPY.es;
  const dishById = new Map(menu.map((dish) => [dish.id, dish]));
  const foodCourses = new Set(cart.map((line) => line.dish.course).filter((course) => course && course !== "bebida"));
  const hasHeld = Boolean(status?.orders.some((order) => order.items.some((item) => item.held)));

  async function reloadStatus() {
    statusRevision.current += 1;
    const revision = statusRevision.current;
    const fresh = await request<Status>("status");
    if (revision === statusRevision.current) setStatus(fresh);
  }

  async function loadBill() {
    try {
      setBill(await request<Bill>("bill"));
    } catch (error) {
      if (expired(error)) setAccessError(accessFailure(error));
      else setProblem(errorText(error));
    }
  }

  async function savePreferences() {
    if (!status || savingPrefs) return;
    setSavingPrefs(true);
    try {
      await request("preferences", { visitId: status.visitId, ...prefsDraft });
      await reloadStatus();
      setFeedback("Guardamos tus preferencias.");
      prefsDialog.current?.close();
    } catch (error) {
      if (expired(error)) setAccessError(accessFailure(error));
      else setProblem(errorText(error));
    } finally {
      setSavingPrefs(false);
    }
  }

  async function payFromTable() {
    if (!status || paying) return;
    setPaying(true);
    setProblem("");
    try {
      await request("pay", {
        visitId: status.visitId, mode: payMode, tipPercent, method: payMethod,
        guestIds: payFor.filter((key) => key !== "table").map(Number), includeTable: payFor.includes("table"),
      });
      setPayFor([]);
      setFeedback("Avisamos al mozo para confirmar tu pago.");
      await loadBill();
    } catch (error) {
      if (expired(error)) setAccessError(accessFailure(error));
      else setProblem(errorText(error));
    } finally {
      setPaying(false);
    }
  }

  async function saveAlias(skip = false) {
    if (!status) return;
    try {
      if (!skip && aliasDraft.trim()) await request("preferences", { visitId: status.visitId, alias: aliasDraft.trim() });
      try { window.sessionStorage.setItem(`mesa-alias-${status.visitId}`, "1"); } catch { /* sin almacenamiento */ }
      aliasDialog.current?.close();
      await reloadStatus();
    } catch (error) {
      setProblem(errorText(error));
    }
  }

  async function answerSubstitution(substitutionId: number, accept: boolean) {
    if (!status || answering) return;
    setAnswering(substitutionId);
    try {
      await request("substitution", { visitId: status.visitId, substitutionId, accept });
      await reloadStatus();
      setFeedback(accept ? "Listo, cocina prepara el cambio." : "Quitamos ese plato de tu pedido.");
    } catch (error) {
      setProblem(errorText(error));
    } finally {
      setAnswering(null);
    }
  }

  async function rateItem(orderItemId: number, rating: 1 | -1) {
    if (!status) return;
    try {
      await request("feedback", { visitId: status.visitId, orderItemId, rating });
      await reloadStatus();
      setFeedback("¡Gracias por tu opinión!");
    } catch (error) {
      setProblem(errorText(error));
    }
  }

  async function fireNext() {
    if (!status || firing) return;
    setFiring(true);
    try {
      await request("fire", { visitId: status.visitId });
      await reloadStatus();
      setFeedback("Avisamos a cocina que pueden preparar lo siguiente.");
    } catch (error) {
      setProblem(errorText(error));
    } finally {
      setFiring(false);
    }
  }

  function openCart() {
    cartDialog.current?.showModal();
    setInCart(true);
  }

  function openDish(dish: Dish) {
    if (orderIssue === "confirm" || orderIssue === "catalog") {
      openCart();
      return;
    }
    const selected = Object.fromEntries(dish.dishCustomizations.map((option) => [option.id, option.isDefaultIncluded || option.isRequired]));
    setDraft({ dish, quantity: 1, selected, notes: "" });
    requestAnimationFrame(() => {
      if (!dishDialog.current?.open) dishDialog.current?.showModal();
    });
  }

  function addDish(line: CartLine) {
    if (cart.length >= 30 || count + line.quantity > 60) {
      setProblem("El pedido está lleno. Enviá el carrito antes de agregar más platos.");
      dishDialog.current?.close();
      return;
    }
    requestId.current = null;
    setOrderIssue(null);
    setOrderError("");
    setCart((current) => [...current, line]);
    setFeedback(`Agregaste ${line.dish.nameDish} al carrito.`);
    setProblem("");
    dishDialog.current?.close();
  }

  async function sendOrder() {
    if (!status || !cart.length || orderLock.current || orderIssue === "catalog") return;
    orderLock.current = true;
    setSending(true);
    setOrderError("");
    setProblem("");
    try {
      requestId.current ??= createRequestId();
      const result = await request<{ orderId: number }>("orders", {
        visitId: status.visitId,
        requestId: requestId.current,
        expectedTotalCents: total,
        pacing: foodCourses.size > 1 ? pacing : "together",
        items: cart.map((line) => ({
          menuId: line.dish.id, quantity: line.quantity, notes: line.notes, shareWith: line.shareWith ?? [],
          customizations: line.dish.dishCustomizations
            .filter((option) => option.isDefaultIncluded || option.isRequired || line.selected[option.id])
            .map((option) => ({ customizationId: option.id, isIncluded: Boolean(line.selected[option.id]) })),
        })),
      });
      requestId.current = null;
      setCart([]);
      cartDialog.current?.close();
      setOrderIssue(null);
      setSentOrder(result.orderId);
      setFeedback(`Pedido #${result.orderId} enviado a cocina.`);
      statusRevision.current += 1;
      setTab("orders");
      try {
        const revision = statusRevision.current;
        const updated = await request<Status>("status");
        if (updated.visitId === status.visitId && revision === statusRevision.current) {
          statusRevision.current += 1;
          setStatus(updated);
        }
      } catch { /* The next automatic refresh will load the confirmed order. */ }
      requestAnimationFrame(() => orderPanel.current?.focus());
    } catch (error) {
      if (expired(error)) {
        setAccessError(accessFailure(error));
      } else if (!(error instanceof DiningError) || error.status >= 500) {
        setOrderIssue("confirm");
        setOrderError("Todavía no pudimos confirmar el envío. Podés reintentar sin duplicar el pedido.");
      } else {
        setOrderIssue(error.status === 409 ? "catalog" : "rejected");
        setOrderError(errorText(error));
      }
    } finally {
      setSending(false);
      orderLock.current = false;
    }
  }

  async function callWaiter(reason: string) {
    if (!status || calling) return;
    setCalling(true);
    setProblem("");
    try {
      await request("call", { visitId: status.visitId, reason: preferences.assisted && reason === "pedido" ? "asistencia" : reason });
      callDialog.current?.close();
      statusRevision.current += 1;
      setStatus((current) => current ? { ...current, callPending: true } : current);
      setFeedback("Avisamos al mozo. Se acercará a tu mesa.");
    } catch (error) {
      if (expired(error)) setAccessError(accessFailure(error));
      else setProblem(errorText(error));
    } finally {
      setCalling(false);
    }
  }

  async function refreshMenu() {
    if (refreshing || orderLock.current || !status) return;
    setRefreshing(true);
    setOrderError("");
    try {
      const [fresh, currentVisit] = await Promise.all([request<Dish[]>("menu"), request<Status>("status")]);
      if (currentVisit.visitId !== status.visitId) {
        setAccessError({ message: "Este navegador abrió otra visita.", needsCode: true });
        return;
      }
      setMenu(fresh);
      setCart([]);
      requestId.current = null;
      setCategory("");
      setProblem("");
      setOrderIssue(null);
      setFeedback("Menú actualizado. Podés elegir los platos nuevamente.");
      cartDialog.current?.close();
      setTab("menu");
    } catch (error) {
      if (expired(error)) setAccessError(accessFailure(error));
      else setOrderError(errorText(error));
    } finally {
      setRefreshing(false);
    }
  }

  if (loading || !status || accessError) {
    return (
      <main data-customer className="dining-access">
        <div className="w-full max-w-md">
          <div className="dining-access-icon">
            {loading ? <Utensils aria-hidden /> : <QrCode aria-hidden />}
          </div>
          <h1 className="mt-5 text-4xl">{loading ? "Abriendo la carta" : accessError?.needsCode ? "Abrí la carta con el QR" : "La carta no pudo cargar"}</h1>
          <p className="mt-3 text-base text-cliente-muted" role={accessError ? "alert" : "status"}>
            {loading ? "Estamos conectando con tu mesa." : accessError?.message}
          </p>
          {!loading && (accessError?.needsCode
            ? <p className="mt-3 text-sm text-cliente-muted">Si el código no funciona, pedile al mozo el QR vigente.</p>
            : <button className={`${primary} ${focus} mt-6`} onClick={() => setBootstrapAttempt((n) => n + 1)}>Volver a intentar</button>)}
        </div>
      </main>
    );
  }

  return (
    <main data-customer className={`min-h-dvh pb-28 ${preferences.assisted ? "dining-assisted" : ""}`}>
      <header data-customer-inverse className="sticky top-0 z-10 bg-cliente-blue text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-7">
          <span className="customer-wordmark inline-flex items-center gap-2 text-lg"><Utensils aria-hidden className="size-4 text-cliente-butter" /> Mesa {status.tableNum}</span>
          <div className="flex items-center gap-2">
            <button type="button" aria-label={t.prefs} title={t.prefs}
              className="customer-press grid size-11 place-items-center rounded-xl border border-white/30 text-white focus-visible:outline-white"
              onClick={() => { setPrefsDraft(preferences); prefsDialog.current?.showModal(); }}>
              <Settings2 aria-hidden className="size-5" />
            </button>
            <button type="button" className="customer-press inline-flex min-h-11 items-center gap-2 rounded-xl bg-cliente-butter px-3 py-2 text-sm font-semibold text-cliente-ink disabled:bg-cliente-sage focus-visible:outline-white" disabled={calling} onClick={() => callDialog.current?.showModal()}>
              {preferences.assisted ? <HandHelping aria-hidden className="size-4" /> : <Bell aria-hidden className="size-4" />}
              {status.callPending ? (status.callTakenBy ? `${status.callTakenBy} viene a tu mesa` : t.called) : calling ? "Avisando…" : t.call}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-7 sm:py-9">
        <h1 className="text-4xl sm:text-5xl">{tab === "menu" ? t.carta : tab === "orders" ? t.orders : t.bill}</h1>
        <nav aria-label="Mesa" className="dining-tabs mt-4 flex gap-5 border-b border-cliente-line">
          <button className={focus} aria-current={tab === "menu" ? "page" : undefined} onClick={() => setTab("menu")}>{t.menu}</button>
          <button className={focus} aria-current={tab === "orders" ? "page" : undefined} onClick={() => setTab("orders")}>
            <ClipboardList aria-hidden className="size-4" /> {t.orders} {status.orders.length > 0 && <span className="dining-order-count">{status.orders.length}</span>}
          </button>
          <button className={focus} aria-current={tab === "bill" ? "page" : undefined} onClick={() => setTab("bill")}>
            <Receipt aria-hidden className="size-4" /> {t.bill}
          </button>
        </nav>
        <p className="sr-only" role="status">{feedback}</p>
        {problem && !inCart && <p className="mt-4 rounded-lg bg-primario-50 p-3 text-sm text-primario-900" role="alert">{problem}</p>}

        {feedback && !inCart && tab === "menu" && <p className="dining-notice mt-4"><Check aria-hidden className="size-4 shrink-0" /> {feedback}</p>}

        {tab === "menu" ? (
          <section aria-label="Platos">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {["", ...categories].map((value) => (
                <button key={value} aria-pressed={value === category}
                  className={`${focus} customer-press min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-semibold ${value === category ? "border-cliente-blue bg-cliente-blue text-white" : "border-cliente-line bg-white text-cliente-ink"}`}
                  onClick={() => setCategory(value)}>{value || t.all}</button>
              ))}
            </div>
            {menu.length === 0 ? <p className="py-7 text-stone-700">El menú no tiene platos disponibles. Podés llamar al mozo.</p> : (
              <ul className="grid border-t border-stone-200 sm:grid-cols-2 sm:gap-x-7">
                {menu.filter((dish) => !category || dish.typeDish === category).map((dish) => {
                  const conflicts = conflictsFor(dish, preferences.allergies);
                  return (
                  <li key={dish.id} className="border-b border-stone-200">
                    <button type="button" onClick={() => openDish(dish)} disabled={dish.soldOut}
                      aria-label={dish.soldOut ? `${dish.nameDish}: ${t.soldOut}` : undefined}
                      className={`${focus} customer-press flex min-h-24 w-full items-center gap-3 rounded-md py-3 text-left hover:bg-cliente-mist disabled:cursor-not-allowed disabled:opacity-60 sm:gap-4`}>
                      {dishPhoto(dish) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={dishPhoto(dish) ?? undefined} alt="" loading="lazy" className="size-16 shrink-0 rounded-xl bg-stone-200 object-cover sm:size-20" referrerPolicy="no-referrer" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block break-words font-semibold">{dish.nameDish}</span>
                        {dish.description && <span className="mt-1 line-clamp-2 block text-sm text-stone-600">{dish.description}</span>}
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold tabular-nums">
                          {formatARS(Number(dish.price))}
                          {dish.soldOut && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-800">{t.soldOut}</span>}
                        </span>
                        {conflicts.length > 0 && (
                          <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                            <AlertTriangle aria-hidden className="size-3.5" /> {t.notForYou}: {conflicts.map((key) => ALLERGEN_LABEL[key] ?? key).join(", ")}
                          </span>
                        )}
                      </span>
                      <ChevronRight aria-hidden className="size-5 shrink-0 text-primario-700" />
                    </button>
                  </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : tab === "bill" ? (
          <section aria-label="Cuenta" className="mt-5 space-y-4">
            {!bill ? <p role="status" className="text-sm text-cliente-muted">Cargando la cuenta…</p> : (() => {
              const me = bill.buckets.find((bucket) => bucket.me);
              const selected = bill.buckets.filter((bucket) => payFor.includes(bucket.key));
              const amount = payMode === "mine" ? me?.available ?? 0
                : payMode === "guests" ? selected.reduce((sum, bucket) => sum + bucket.available, 0)
                : payMode === "equal" ? Math.min(bill.totals.available, Math.ceil(bill.totals.available / Math.max(1, bill.people)))
                : bill.totals.available;
              const tip = Math.round(amount * tipPercent) / 100;
              const toggle = (key: string) => {
                setPayMode("guests");
                setPayFor((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
              };
              return (
              <>
                <dl className="grid grid-cols-3 gap-2 rounded-xl border border-cliente-line bg-white p-4 text-sm">
                  <div><dt className="text-cliente-muted">Mesa</dt><dd className="mt-1 text-lg font-bold tabular-nums">{formatARS(bill.totals.owed)}</dd></div>
                  <div><dt className="text-cliente-muted">Pagado</dt><dd className="mt-1 text-lg font-bold tabular-nums">{formatARS(bill.totals.covered)}</dd></div>
                  <div><dt className="text-cliente-muted">Falta</dt><dd className="mt-1 text-lg font-bold tabular-nums">{formatARS(bill.totals.outstanding)}</dd></div>
                </dl>

                <section aria-label="Consumo de cada comensal" className="space-y-2">
                  {bill.buckets.map((bucket) => {
                    const canSelect = bucket.available > 0 && bill.myRequests.length === 0;
                    return (
                      <article key={bucket.key} className={`rounded-xl border bg-white p-3 ${payFor.includes(bucket.key) ? "border-cliente-blue ring-2 ring-cliente-blue/30" : "border-cliente-line"}`}>
                        <label className={`flex items-start gap-3 ${canSelect ? "cursor-pointer" : ""}`}>
                          <input type="checkbox" className="mt-1 size-5 accent-primario-700" disabled={!canSelect}
                            checked={payFor.includes(bucket.key)} onChange={() => toggle(bucket.key)}
                            aria-label={`Pagar lo de ${bucket.me ? "vos" : bucket.alias}`} />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="font-semibold">{bucket.me ? `${bucket.alias} (vos)` : bucket.alias}</span>
                              <span className="font-bold tabular-nums">{formatARS(bucket.owed)}</span>
                            </span>
                            <span className="mt-1 block text-xs text-cliente-muted">
                              {bucket.items.map((item) => `${item.quantity}× ${item.name}${item.sharedWith > 1 ? ` (compartido entre ${item.sharedWith})` : ""}`).join(" · ") || "Sin consumos"}
                            </span>
                            <span className="mt-1 block text-xs font-semibold">
                              {bucket.outstanding === 0 && bucket.owed > 0 ? <span className="text-green-800">Pagado</span>
                                : bucket.reserved > 0 ? <span className="text-amber-800">Alguien lo está pagando</span>
                                : bucket.owed > 0 ? <span className="text-cliente-blue">Falta {formatARS(bucket.outstanding)}</span> : null}
                              {bucket.credit > 0 && <span className="ml-2 text-green-800">Saldo a favor {formatARS(bucket.credit)}: el mozo te lo devuelve</span>}
                            </span>
                          </span>
                        </label>
                      </article>
                    );
                  })}
                </section>

                {bill.myRequests.length > 0 ? (
                  <p className="dining-notice" role="status">
                    <Check aria-hidden className="size-4 shrink-0" />
                    Pediste pagar {formatARS(bill.myRequests[0].amount)}{bill.myRequests[0].tip > 0 ? ` + ${formatARS(bill.myRequests[0].tip)} de propina` : ""}. El mozo viene a confirmarlo; si no, en 10 minutos se libera para que otro pueda pagarlo.
                  </p>
                ) : bill.totals.owed === 0 ? (
                  <p className="text-sm text-cliente-muted">Todavía no hay consumos en la mesa.</p>
                ) : bill.totals.available <= 0 ? (
                  <p className="dining-notice"><Check aria-hidden className="size-4 shrink-0" /> {bill.totals.outstanding > 0 ? "Lo que falta ya lo está pagando otra persona." : "La cuenta está saldada. ¡Gracias por venir!"}</p>
                ) : (
                  <form className="space-y-4 rounded-xl border border-cliente-line bg-white p-4" onSubmit={(event) => { event.preventDefault(); void payFromTable(); }}>
                    <fieldset>
                      <legend className="text-sm font-semibold">¿Qué pagás?</legend>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {([
                          ["mine", "Lo mío", me?.available ?? 0],
                          ["guests", payFor.length ? `Por ${payFor.length} ${payFor.length === 1 ? "persona" : "personas"}` : "Elegí arriba", selected.reduce((sum, bucket) => sum + bucket.available, 0)],
                          ["equal", `Partes iguales (${bill.people})`, Math.ceil(bill.totals.available / Math.max(1, bill.people))],
                          ["total", "Toda la mesa", bill.totals.available],
                        ] as const).map(([value, label, value2]) => (
                          <button key={value} type="button" aria-pressed={payMode === value} disabled={value2 <= 0}
                            onClick={() => { setPayMode(value); if (value !== "guests") setPayFor([]); }}
                            className={`${focus} customer-press flex min-h-14 flex-col items-start justify-center rounded-lg border px-3 text-left disabled:opacity-50 ${payMode === value ? "border-cliente-blue bg-cliente-mist" : "border-cliente-line bg-white"}`}>
                            <span className="text-sm font-semibold">{label}</span>
                            <span className="text-xs tabular-nums text-cliente-muted">{formatARS(value2)}</span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-cliente-muted">Para pagar por otros, marcalos en la lista de arriba.</p>
                    </fieldset>
                    <fieldset>
                      <legend className="text-sm font-semibold">Propina</legend>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[0, 10, 15, 20].map((value) => (
                          <button key={value} type="button" aria-pressed={tipPercent === value} onClick={() => setTipPercent(value)}
                            className={`${focus} customer-press min-h-11 rounded-full border px-4 text-sm font-semibold ${tipPercent === value ? "border-cliente-blue bg-cliente-blue text-white" : "border-cliente-line bg-white"}`}>
                            {value === 0 ? "Sin propina" : `${value} %`}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend className="text-sm font-semibold">Medio de pago</legend>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {([["card", "Tarjeta"], ["cash", "Efectivo"], ["mp", "Mercado Pago"]] as const).map(([value, label]) => (
                          <button key={value} type="button" aria-pressed={payMethod === value} onClick={() => setPayMethod(value)}
                            className={`${focus} customer-press min-h-11 rounded-lg border px-2 text-sm font-semibold ${payMethod === value ? "border-cliente-blue bg-cliente-blue text-white" : "border-cliente-line bg-white"}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <button type="submit" className={`${primary} ${focus} w-full justify-between`} disabled={paying || amount <= 0}>
                      <span>{paying ? "Enviando…" : "Pedir cobro"}</span>
                      <span className="tabular-nums">{formatARS(amount + tip)}</span>
                    </button>
                    <p className="text-xs text-cliente-muted">El mozo confirma el pago en la mesa. Cuando la cuenta queda en cero, la mesa se cierra sola.</p>
                  </form>
                )}
                <button type="button" className={`${secondary} ${focus} w-full`} disabled={calling} onClick={() => callWaiter("cuenta")}>
                  Pedir ayuda para cerrar la cuenta
                </button>
              </>
              );
            })()}
          </section>
        ) : (
          <div ref={orderPanel} tabIndex={-1} className="mt-5 space-y-4">
            {sentOrder && <p className="dining-notice"><Check aria-hidden className="size-4 shrink-0" /> Pedido #{sentOrder} enviado a cocina.</p>}
            {(status.substitutions ?? []).map((change) => (
              <div key={change.id} className="rounded-xl border border-amber-300 bg-amber-50 p-4" role="alert">
                <p className="font-semibold text-amber-950">No tenemos {change.original} por hoy.</p>
                {change.proposed ? (
                  <>
                    <p className="mt-1 text-sm text-amber-900">
                      Te proponemos {change.proposed}
                      {change.priceDiff !== 0 && ` (${change.priceDiff > 0 ? "+" : "−"}${formatARS(Math.abs(change.priceDiff))})`}.
                      El resto de tu pedido sigue su curso.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className={`${primary} ${focus}`} disabled={answering !== null} onClick={() => answerSubstitution(change.id, true)}>Acepto el cambio</button>
                      <button type="button" className={`${secondary} ${focus}`} disabled={answering !== null} onClick={() => answerSubstitution(change.id, false)}>Prefiero quitarlo</button>
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-amber-900">El mozo te va a ofrecer una alternativa en un momento.</p>
                )}
              </div>
            ))}
            {hasHeld && (
              <div className="rounded-xl border border-cliente-line bg-cliente-sage p-4">
                <p className="text-sm">Hay platos esperando para salir cuando terminen lo anterior.</p>
                <button type="button" className={`${primary} ${focus} mt-3`} disabled={firing} onClick={fireNext}>
                  {firing ? "Avisando…" : t.fire}
                </button>
              </div>
            )}
            {status.orders.length === 0 && (
              <div className="rounded-xl border border-cliente-line p-5">
                <h2 className="text-xl">Todavía no hay pedidos para mostrar</h2>
                <p className="mt-2 text-sm text-cliente-muted">{sentOrder ? "El pedido aparecerá cuando se actualice el seguimiento." : "Los platos que pidas desde este celular aparecen acá."}</p>
                <button className={`${secondary} ${focus} mt-4`} onClick={() => setTab("menu")}>Explorar la carta</button>
              </div>
            )}
            {status.orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">Pedido #{order.id}</h2>
                  <span className="dining-badge" data-state={order.cancelledAt ? "cancelled" : order.state}>{order.cancelledAt ? "Cancelado" : states[order.state] || order.state}</span>
                </header>
                {!order.cancelledAt && orderStages.some((stage) => stage === order.state) && (
                  <ol className="dining-stages" aria-label="Etapas del pedido">
                    {orderStages.map((stage, index) => (
                      <li key={stage} aria-current={order.state === stage ? "step" : undefined}
                        data-reached={index <= orderStages.findIndex((step) => step === order.state) ? "" : undefined}>{states[stage]}</li>
                    ))}
                  </ol>
                )}
                {!order.cancelledAt && order.etaMinutes && !["ready", "delivered"].includes(order.state) && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-cliente-mist px-2.5 py-1 text-sm font-semibold text-cliente-blue">
                    <Clock3 aria-hidden className="size-4" /> {t.eta} {order.etaMinutes} min
                  </p>
                )}
                <ul className="mt-2 divide-y divide-stone-100 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-2">
                      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                        <span className="min-w-0 break-words">
                          {item.quantity} × {item.menu?.nameDish || "Plato"}
                          {(item.owners?.length ?? 0) > 0 && <span className="block text-xs text-stone-500">Para {item.owners?.join(" y ")}</span>}
                        </span>
                        <span className="shrink-0 text-stone-700">{item.needsChange ? "Falta un ingrediente" : item.held ? t.held : states[item.state] || item.state}</span>
                      </div>
                      {item.allergyAlert && <p className="mt-1 text-xs font-semibold text-amber-800">{item.allergyAlert}. Cocina está avisada.</p>}
                      {item.state === "delivered" && (
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-stone-600">
                          {t.rate}
                          {([1, -1] as const).map((value) => (
                            <button key={value} type="button" aria-pressed={item.rating === value}
                              aria-label={value === 1 ? "Me gustó" : "No me gustó"}
                              className={`${focus} customer-press grid size-9 place-items-center rounded-full border ${item.rating === value ? "border-cliente-blue bg-cliente-blue text-white" : "border-stone-300 bg-white"}`}
                              onClick={() => rateItem(item.id, value)}>
                              {value === 1 ? <ThumbsUp aria-hidden className="size-4" /> : <ThumbsDown aria-hidden className="size-4" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-right text-sm font-semibold tabular-nums">{formatARS(Number(order.total_amount))}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-cliente-line bg-cliente-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button className={`${primary} ${focus} mx-auto flex min-h-12 w-full max-w-lg justify-between`} onClick={openCart}>
            <span className="flex items-center gap-2"><ShoppingBag aria-hidden className="size-5" /> {orderIssue === "confirm" ? "Revisar envío" : `${t.viewCart} (${count})`}</span>
            <span className="tabular-nums">{formatARS(total / 100)}</span>
          </button>
        </div>
      )}

      <dialog ref={dishDialog} aria-labelledby="dish-name" className="dining-dialog">
        {draft && (
          <form onSubmit={(event) => { event.preventDefault(); addDish(draft); }}>
            <div className="flex items-start justify-between gap-4">
              <h2 id="dish-name" className="text-2xl font-bold">{draft.dish.nameDish}</h2>
              <button type="button" className={`${focus} grid size-11 shrink-0 place-items-center rounded-xl hover:bg-stone-100`} aria-label="Cerrar plato" onClick={() => dishDialog.current?.close()}><X aria-hidden className="size-5" /></button>
            </div>
            {draft.dish.description && <p className="mb-4 text-sm text-stone-700">{draft.dish.description}</p>}
            {(draft.dish.allergens?.length ?? 0) > 0 && (
              <p className="mb-2 text-sm text-stone-700"><span className="font-semibold">{t.contains}:</span> {draft.dish.allergens?.map((key) => ALLERGEN_LABEL[key] ?? key).join(", ")}</p>
            )}
            {conflictsFor(draft.dish, preferences.allergies).length > 0 && (
              <p className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900" role="alert">
                <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
                {t.notForYou}. Si lo pedís igual, cocina recibe el aviso.
              </p>
            )}
            {(draft.dish.pairings ?? []).map((id) => dishById.get(id)).filter((dish): dish is Dish => Boolean(dish && !dish.soldOut)).length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-cliente-muted">{t.pairs}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(draft.dish.pairings ?? []).map((id) => dishById.get(id)).filter((dish): dish is Dish => Boolean(dish && !dish.soldOut)).map((dish) => (
                    <button key={dish.id} type="button" className={`${focus} customer-press min-h-10 rounded-full border border-cliente-line bg-white px-3 text-sm font-semibold`}
                      onClick={() => { dishDialog.current?.close(); openDish(dish); }}>
                      + {dish.nameDish}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {draft.dish.dishCustomizations.length > 0 && (
              <fieldset className="mt-3 border-y border-stone-200 pb-2">
                <legend className="pr-2 text-sm font-semibold">Ingredientes y extras</legend>
                {draft.dish.dishCustomizations.map((option) => (
                  <label key={option.id} className="flex min-h-11 cursor-pointer items-center gap-3 py-2">
                    <input type="checkbox" checked={Boolean(draft.selected[option.id])} disabled={lockedOption(option)}
                      className={`${focus} size-5 shrink-0 accent-primario-700`}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setDraft((line) => line ? { ...line, selected: { ...line.selected, [option.id]: checked } } : line);
                      }} />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold">{option.name}</span>
                      {option.description && <span className="block text-stone-600">{option.description}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-stone-700">
                      {lockedOption(option) ? "Incluido" : optionPrice(option) > 0 ? `+${formatARS(optionPrice(option) / 100)}` : option.isDefaultIncluded ? (draft.selected[option.id] ? "Incluido" : "Se quita") : "Sin cargo"}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            <label className="mt-4 block text-sm font-semibold">Nota para cocina (opcional)
              <textarea value={draft.notes} rows={2} maxLength={255} className={`${focus} mt-2 block w-full rounded-lg border border-cliente-line p-2 text-base font-normal`}
                onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
            </label>
            {(status.guests ?? []).filter((guest) => !guest.me).length > 0 && (
              <fieldset className="mt-3">
                <legend className="text-sm font-semibold">¿Lo compartís?</legend>
                <p className="text-xs text-cliente-muted">Se divide en partes iguales en la cuenta.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(status.guests ?? []).filter((guest) => !guest.me).map((guest) => {
                    const on = draft.shareWith?.includes(guest.id) ?? false;
                    return (
                      <button key={guest.id} type="button" aria-pressed={on}
                        onClick={() => setDraft({ ...draft, shareWith: on ? (draft.shareWith ?? []).filter((id) => id !== guest.id) : [...(draft.shareWith ?? []), guest.id] })}
                        className={`${focus} customer-press min-h-10 rounded-full border px-3 text-sm font-semibold ${on ? "border-cliente-blue bg-cliente-blue text-white" : "border-cliente-line bg-white"}`}>
                        {guest.alias}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
            <label className="mt-3 flex items-center justify-between text-sm font-semibold">Cantidad
              <select className={`${focus} min-h-11 rounded-lg border border-stone-300 bg-white px-3`} value={draft.quantity}
                onChange={(event) => setDraft({ ...draft, quantity: Number(event.target.value) })}>
                {Array.from({ length: 20 }, (_, index) => <option key={index + 1}>{index + 1}</option>)}
              </select>
            </label>
            <button className={`${primary} ${focus} mt-4 w-full justify-between`} type="submit"><span>{t.add}</span><span>{formatARS(linePrice(draft) / 100)}</span></button>
          </form>
        )}
      </dialog>

      <dialog ref={cartDialog} aria-labelledby="cart-title" onClose={() => setInCart(false)} onCancel={(event) => { if (orderLock.current) event.preventDefault(); }}
        className="dining-dialog">
        <div className="flex items-start justify-between gap-3">
          <div><h2 id="cart-title" className="text-2xl font-bold">Tu carrito</h2><p className="mt-1 text-sm text-stone-700">Mesa {status.tableNum}</p></div>
          <button type="button" disabled={sending} className={`${focus} grid size-11 place-items-center rounded-xl hover:bg-stone-100`} aria-label="Cerrar carrito" onClick={() => cartDialog.current?.close()}><X aria-hidden className="size-5" /></button>
        </div>
        <ul className="mt-4 divide-y divide-stone-200 border-y border-stone-200">
          {cart.map((line, index) => {
            const changes = line.dish.dishCustomizations.flatMap((option) => {
              if (option.isDefaultIncluded && !line.selected[option.id]) return [`Sin ${option.name}`];
              if (!option.isDefaultIncluded && !option.isRequired && line.selected[option.id]) return [option.name];
              return [];
            });
            return (
              <li key={index} className="flex items-start justify-between gap-2 py-3">
                <div className="min-w-0 break-words text-sm">
                  <p className="font-semibold">{line.quantity} × {line.dish.nameDish}</p>
                  {changes.length > 0 && <p className="text-stone-700">{changes.join(", ")}</p>}
                  {line.notes && <p className="text-stone-700">{line.notes}</p>}
                  {(line.shareWith?.length ?? 0) > 0 && (
                    <p className="text-stone-700">Compartido con {(status.guests ?? []).filter((guest) => line.shareWith?.includes(guest.id)).map((guest) => guest.alias).join(", ")}</p>
                  )}
                  <p className="mt-1 tabular-nums">{formatARS(linePrice(line) / 100)}</p>
                </div>
                <button type="button" disabled={sending || refreshing || orderIssue === "confirm" || orderIssue === "catalog"} className={`${secondary} ${focus}`} aria-label={`Quitar ${line.dish.nameDish}`}
                  onClick={() => {
                    requestId.current = null;
                    setOrderIssue(null);
                    setOrderError("");
                    setCart((current) => current.filter((_, lineIndex) => lineIndex !== index));
                  }}>Quitar</button>
              </li>
            );
          })}
        </ul>
        {orderError && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950" role="alert">{orderError}</p>}
        {orderIssue === "catalog" && <p className="mt-3 text-sm text-cliente-muted">Al actualizar la carta, vas a tener que volver a elegir tus platos.</p>}
        {foodCourses.size > 1 && (
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">¿Cómo querés que salga?</legend>
            <div className="mt-2 grid gap-2">
              {([["together", t.together, t.togetherHint], ["courses", t.courses, t.coursesHint]] as const).map(([value, label, hint]) => (
                <label key={value} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border p-3 ${pacing === value ? "border-cliente-blue bg-cliente-mist" : "border-cliente-line"}`}>
                  <input type="radio" name="pacing" value={value} checked={pacing === value} onChange={() => setPacing(value)} className="mt-0.5 size-5 accent-primario-700" />
                  <span><span className="block font-semibold">{label}</span><span className="text-xs text-cliente-muted">{hint}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="my-4 flex justify-between font-semibold"><span>Total</span><span className="tabular-nums">{formatARS(total / 100)}</span></div>
        {orderIssue === "catalog" ? (
          <button type="button" className={`${primary} ${focus} w-full`} disabled={refreshing} onClick={refreshMenu}>
            {refreshing ? "Actualizando…" : "Actualizar carta y vaciar carrito"}
          </button>
        ) : (
          <button type="button" className={`${primary} ${focus} w-full`} disabled={sending || cart.length === 0} onClick={sendOrder}>
            {sending ? "Enviando a cocina…" : orderIssue === "confirm" ? "Reintentar envío" : t.send}
          </button>
        )}
      </dialog>
      <dialog ref={aliasDialog} aria-labelledby="alias-title" className="dining-dialog">
        <form onSubmit={(event) => { event.preventDefault(); void saveAlias(); }}>
          <h2 id="alias-title" className="text-2xl font-bold">¿Cómo te llamamos?</h2>
          <p className="mt-1 text-sm text-cliente-muted">Así la mesa sabe qué pidió cada uno y al final cada uno paga lo suyo. No hace falta crear una cuenta.</p>
          <label className="mt-4 block text-sm font-semibold">Tu nombre o apodo
            <input value={aliasDraft} maxLength={40} autoComplete="given-name" onChange={(event) => setAliasDraft(event.target.value)}
              className={`${focus} mt-2 block min-h-12 w-full rounded-lg border border-cliente-line px-3 text-base font-normal`} />
          </label>
          <button type="submit" className={`${primary} ${focus} mt-4 w-full`} disabled={!aliasDraft.trim()}>Empezar</button>
          <button type="button" className={`${secondary} ${focus} mt-2 w-full`} onClick={() => saveAlias(true)}>Seguir sin nombre</button>
        </form>
      </dialog>

      <dialog ref={callDialog} aria-labelledby="call-title" className="dining-dialog">
        <div className="flex items-start justify-between gap-3">
          <h2 id="call-title" className="text-2xl font-bold">{t.call}</h2>
          <button type="button" className={`${focus} grid size-11 place-items-center rounded-xl hover:bg-stone-100`} aria-label="Cerrar" onClick={() => callDialog.current?.close()}><X aria-hidden className="size-5" /></button>
        </div>
        {status.callPending && <p className="mt-2 text-sm text-cliente-muted">El mozo ya está avisado. Podés cambiar el motivo.</p>}
        <div className="mt-4 grid gap-2">
          {CALL_OPTIONS.map((option) => (
            <button key={option.reason} type="button" disabled={calling} onClick={() => callWaiter(option.reason)}
              className={`${focus} customer-press flex min-h-14 w-full flex-col items-start rounded-xl border p-3 text-left ${status.callReason === option.reason ? "border-cliente-blue bg-cliente-mist" : "border-cliente-line bg-white"}`}>
              <span className="font-semibold">{option.label}</span>
              <span className="text-sm text-cliente-muted">{option.hint}</span>
            </button>
          ))}
        </div>
      </dialog>

      <dialog ref={prefsDialog} aria-labelledby="prefs-title" className="dining-dialog">
        <form onSubmit={(event) => { event.preventDefault(); void savePreferences(); }}>
          <div className="flex items-start justify-between gap-3">
            <h2 id="prefs-title" className="text-2xl font-bold">{t.prefs}</h2>
            <button type="button" className={`${focus} grid size-11 place-items-center rounded-xl hover:bg-stone-100`} aria-label="Cerrar" onClick={() => prefsDialog.current?.close()}><X aria-hidden className="size-5" /></button>
          </div>
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">Alergias y restricciones</legend>
            <p className="text-xs text-cliente-muted">Te avisamos qué platos no son aptos y cocina recibe el aviso.</p>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {RESTRICTIONS.map((item) => (
                <label key={item.key} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" className="size-5 accent-primario-700" checked={prefsDraft.allergies.includes(item.key)}
                    onChange={(event) => setPrefsDraft((draft) => ({
                      ...draft,
                      allergies: event.target.checked ? [...draft.allergies, item.key] : draft.allergies.filter((key) => key !== item.key),
                    }))} />
                  {item[prefsDraft.language]}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="mt-4 flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-cliente-line p-3">
            <input type="checkbox" className="mt-0.5 size-5 accent-primario-700" checked={prefsDraft.assisted}
              onChange={(event) => setPrefsDraft((draft) => ({ ...draft, assisted: event.target.checked }))} />
            <span><span className="block font-semibold">Modo asistido</span>
              <span className="text-sm text-cliente-muted">Letra más grande, más contraste y el mozo te atiende primero.</span></span>
          </label>
          <fieldset className="mt-4">
            <legend className="flex items-center gap-2 text-sm font-semibold"><Languages aria-hidden className="size-4" /> Idioma</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([["es", "Español"], ["en", "English"]] as const).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={prefsDraft.language === value}
                  onClick={() => setPrefsDraft((draft) => ({ ...draft, language: value }))}
                  className={`${focus} customer-press min-h-11 rounded-lg border text-sm font-semibold ${prefsDraft.language === value ? "border-cliente-blue bg-cliente-blue text-white" : "border-cliente-line bg-white"}`}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <button type="submit" className={`${primary} ${focus} mt-5 w-full`} disabled={savingPrefs}>{savingPrefs ? "Guardando…" : "Guardar"}</button>
        </form>
      </dialog>
    </main>
  );
}
