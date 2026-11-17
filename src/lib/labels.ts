export const tableStatusLabel: Record<string, string> = {
  available: "Disponible",
  reserved: "Reservada",
  occupied: "Ocupada",
  maintenance: "Mantenimiento",
};

export const bookingStatusLabel: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  no_show: "No asistio",
  checked_in: "Check-in",
  completed: "Completada",
};

export const genericStatusLabel: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  open: "Abierta",
  closed: "Cerrada",
  draft: "Borrador",
  sent: "Enviada",
  received: "Recibido",
  cancelled: "Cancelado",
  available: "Disponible",
  busy: "Ocupado",
  pending: "Pendiente",
  assigned: "Asignado",
  picked_up: "Retirado",
  delivered: "Entregado",
  failed: "Fallido",
  waiting: "En espera",
  notified: "Notificado",
  converted: "Convertido",
  paused: "Pausada",
  resolved: "Resuelto",
  paid: "Pagado",
  refunded: "Reembolsado",
  issued: "Emitida",
  simulated: "Simulada",
  in: "Entrada",
  out: "Salida",
  waste: "Merma",
  adjustment: "Ajuste",
  sale: "Venta",
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
  cash: "Efectivo",
  card: "Tarjeta",
  mp: "Mercado Pago",
  stripe: "Stripe",
  transfer: "Transferencia",
  percent: "Porcentaje",
  fixed: "Monto fijo",
  free_delivery: "Envio gratis",
  lunch: "Mediodia",
  dinner: "Noche",
};

export const stationLabel: Record<string, string> = {
  kitchen: "Cocina",
  grill: "Parrilla",
  bar: "Bebidas",
  dessert: "Postres",
  salad: "Ensaladas",
  expo: "Despacho",
};

export const kitchenItemStateLabel: Record<string, string> = {
  received: "Recibido",
  preparing: "En preparacion",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const roleLabel: Record<string, string> = {
  Administrator: "Administrador",
  Waiter: "Mozo",
  Customer: "Cliente",
  Receptionist: "Recepcionista",
  Chef: "Chef",
};

export function labelOrValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value !== "string") return String(value);
  return (
    tableStatusLabel[value] ||
    bookingStatusLabel[value] ||
    genericStatusLabel[value] ||
    stationLabel[value] ||
    kitchenItemStateLabel[value] ||
    roleLabel[value] ||
    value
  );
}
