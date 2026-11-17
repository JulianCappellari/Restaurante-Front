type NotificationPayload = {
  type: "pedido" | "reserva";
  recipientName?: string;
  phone?: string | null;
  email?: string | null;
  reference: string;
  details: string;
};

export function buildNotificationMessage(payload: NotificationPayload) {
  const subject = payload.type === "pedido" ? "Actualizacion de pedido" : "Confirmacion de reserva";
  const greeting = payload.recipientName ? `Hola ${payload.recipientName},` : "Hola,";
  return {
    subject,
    body: `${greeting} ${payload.details} Ref: ${payload.reference}. Restaurante App.`,
  };
}

export function buildWhatsAppUrl(payload: NotificationPayload) {
  const message = buildNotificationMessage(payload);
  const phone = String(payload.phone || "").replace(/\D/g, "");
  const text = encodeURIComponent(`${message.subject}: ${message.body}`);
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function buildMailUrl(payload: NotificationPayload) {
  const message = buildNotificationMessage(payload);
  const params = new URLSearchParams({
    subject: message.subject,
    body: message.body,
  });
  return `mailto:${payload.email || ""}?${params.toString()}`;
}
