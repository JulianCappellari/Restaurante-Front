"use client";

import {
  createIntegrationIntent,
  createOpsResource,
  deleteOpsResource,
  getOpsLookups,
  listOpsResource,
  type LookupKey,
  type LookupOption,
  type OpsLookupMap,
  updateOpsResource,
} from "@/actions/advanced/advanced-actions";
import { labelOrValue } from "@/lib/labels";
import {
  Database,
  Download,
  FileText,
  Loader2,
  Pencil,
  PlugZap,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type FieldType =
  | "text"
  | "number"
  | "date"
  | "datetime-local"
  | "time"
  | "select"
  | "checkbox"
  | "textarea"
  | "json";

type FieldDefinition = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  span?: "full";
};

type ResourceConfig = {
  label: string;
  description: string;
  group: string;
  fields: FieldDefinition[];
  defaults: Record<string, string | number | boolean>;
  previewFields: string[];
};

type FormValue = string | boolean;
type FormState = Record<string, FormValue>;
type ResourceRecord = Record<string, unknown> & { id?: number };

const today = new Date().toISOString().slice(0, 10);
const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

const relationLookupByField: Partial<Record<string, LookupKey>> = {
  cashRegisterId: "cashRegisters",
  closedBy: "users",
  comboId: "combos",
  couponId: "coupons",
  courierId: "couriers",
  customerId: "users",
  deliveryZoneId: "deliveryZones",
  inventoryId: "inventory",
  menuId: "menu",
  openedBy: "users",
  orderId: "orders",
  orderItemId: "orderItems",
  purchaseOrderId: "purchaseOrders",
  reportedBy: "users",
  supplierId: "suppliers",
  tableId: "tables",
  tableSessionId: "tableSessions",
  userId: "users",
  waiterId: "users",
};

const lookupForField = (fieldName: string) => relationLookupByField[fieldName];

const commonFields = {
  statusActive: { name: "status", label: "Estado", type: "select", options: ["active", "inactive"] } as FieldDefinition,
  active: { name: "active", label: "Activo", type: "checkbox" } as FieldDefinition,
  notes: { name: "notes", label: "Notas", type: "textarea", span: "full" } as FieldDefinition,
};

const resourceConfigs = {
  categories: {
    label: "Categorias",
    description: "Organiza el menu por rubros visibles y ordenados.",
    group: "Catalogo",
    fields: [
      { name: "name", label: "Nombre", type: "text", placeholder: "Parrilla" },
      { name: "sortOrder", label: "Orden", type: "number" },
      { name: "description", label: "Descripcion", type: "textarea", span: "full" },
      commonFields.statusActive,
    ],
    defaults: { name: "Parrilla", description: "Platos de parrilla", status: "active", sortOrder: 1 },
    previewFields: ["id", "name", "status", "sortOrder"],
  },
  restaurantSettings: {
    label: "Configuracion restaurante",
    description: "Horarios, contacto, impuestos, logo y costos operativos.",
    group: "Sistema",
    fields: [
      { name: "key", label: "Clave", type: "text", placeholder: "restaurant.phone" },
      { name: "value", label: "Valor", type: "textarea", span: "full" },
      { name: "group", label: "Grupo", type: "text" },
      { name: "type", label: "Tipo", type: "select", options: ["string", "number", "boolean", "json"] },
    ],
    defaults: { key: "restaurant.phone", value: "+54 11 5555-5555", group: "contact", type: "string" },
    previewFields: ["id", "key", "value", "group"],
  },
  expenses: {
    label: "Gastos",
    description: "Gastos reales de la operacion para reportes de ganancia neta.",
    group: "Finanzas",
    fields: [
      { name: "date", label: "Fecha", type: "date" },
      { name: "category", label: "Categoria", type: "text" },
      { name: "amount", label: "Importe", type: "number" },
      { name: "paymentMethod", label: "Metodo de pago", type: "select", options: ["cash", "card", "mp", "transfer"] },
      { name: "userId", label: "Usuario", type: "number" },
      { name: "description", label: "Descripcion", type: "textarea", span: "full" },
    ],
    defaults: { date: today, category: "Servicios", description: "Luz", amount: 10000, paymentMethod: "transfer", userId: 1 },
    previewFields: ["id", "date", "category", "amount"],
  },
  cashRegisters: {
    label: "Cajas diarias",
    description: "Apertura, cierre y control de caja por turno.",
    group: "Finanzas",
    fields: [
      { name: "openedBy", label: "Abierta por", type: "number" },
      { name: "openingAmount", label: "Monto inicial", type: "number" },
      { name: "status", label: "Estado", type: "select", options: ["open", "closed"] },
      commonFields.notes,
    ],
    defaults: { openedBy: 1, openingAmount: 5000, status: "open", notes: "Turno noche" },
    previewFields: ["id", "openedBy", "openingAmount", "status"],
  },
  coupons: {
    label: "Cupones",
    description: "Descuentos con vencimiento, limite por cliente y happy hour.",
    group: "Promociones",
    fields: [
      { name: "code", label: "Codigo", type: "text" },
      { name: "type", label: "Tipo", type: "select", options: ["percent", "fixed", "free_delivery"] },
      { name: "value", label: "Valor", type: "number" },
      { name: "minSubtotal", label: "Subtotal minimo", type: "number" },
      { name: "maxUses", label: "Usos totales", type: "number" },
      { name: "maxUsesPerCustomer", label: "Usos por cliente", type: "number" },
      { name: "expiresAt", label: "Vence", type: "datetime-local" },
      { name: "happyHourStart", label: "Happy hour inicio", type: "time" },
      { name: "happyHourEnd", label: "Happy hour fin", type: "time" },
      { name: "birthdayOnly", label: "Solo cumpleanos", type: "checkbox" },
      commonFields.active,
      { name: "description", label: "Descripcion", type: "textarea", span: "full" },
    ],
    defaults: {
      code: "HAPPY20",
      type: "percent",
      value: 20,
      minSubtotal: 8000,
      maxUses: 200,
      maxUsesPerCustomer: 2,
      expiresAt: nextMonth,
      happyHourStart: "18:00",
      happyHourEnd: "20:00",
      birthdayOnly: false,
      active: true,
      description: "20% en happy hour",
    },
    previewFields: ["id", "code", "type", "value", "active"],
  },
  combos: {
    label: "Combos",
    description: "Promos reales con productos asociados.",
    group: "Promociones",
    fields: [
      { name: "name", label: "Nombre", type: "text" },
      { name: "price", label: "Precio", type: "number" },
      { name: "startsAt", label: "Desde", type: "datetime-local" },
      { name: "expiresAt", label: "Hasta", type: "datetime-local" },
      commonFields.active,
      { name: "description", label: "Descripcion", type: "textarea", span: "full" },
    ],
    defaults: { name: "Combo duo", description: "Principal + bebida", price: 12000, active: true, startsAt: "", expiresAt: nextMonth },
    previewFields: ["id", "name", "price", "active"],
  },
  comboItems: {
    label: "Items de combo",
    description: "Selecciona cada menu del combo y la cantidad incluida.",
    group: "Promociones",
    fields: [
      { name: "comboId", label: "Combo", type: "number" },
      { name: "menuId", label: "Plato", type: "number" },
      { name: "quantity", label: "Cantidad", type: "number" },
    ],
    defaults: { comboId: 1, menuId: 1, quantity: 1 },
    previewFields: ["id", "comboId", "menuId", "quantity"],
  },
  inventory: {
    label: "Inventario",
    description: "Stock real por insumo con unidad, minimo y alertas.",
    group: "Inventario",
    fields: [
      { name: "name", label: "Insumo", type: "text", placeholder: "Queso muzzarella" },
      { name: "amount", label: "Stock actual", type: "number" },
      { name: "unit", label: "Unidad", type: "select", options: ["unidad", "kg", "g", "lt", "ml", "pack", "caja"] },
      { name: "minimumThreshold", label: "Stock minimo", type: "number" },
    ],
    defaults: { name: "Queso muzzarella", amount: 10, unit: "kg", minimumThreshold: 3 },
    previewFields: ["id", "name", "amount", "unit", "minimumThreshold"],
  },
  menuIngredients: {
    label: "Ingredientes por plato",
    description: "Cantidad de cada insumo que se descuenta al vender el plato.",
    group: "Inventario",
    fields: [
      { name: "menuId", label: "Plato", type: "number" },
      { name: "inventoryId", label: "Ingrediente", type: "number" },
      { name: "quantity", label: "Cantidad", type: "number" },
      { name: "unit", label: "Unidad", type: "select", options: ["unidad", "kg", "g", "lt", "ml", "pack", "caja"] },
      { name: "costPerUnit", label: "Costo unitario", type: "number" },
    ],
    defaults: { menuId: 1, inventoryId: 1, quantity: 1, unit: "unidad", costPerUnit: 500 },
    previewFields: ["id", "menuId", "inventoryId", "quantity", "costPerUnit"],
  },
  stockMovements: {
    label: "Movimientos de stock",
    description: "Entradas, ventas, ajustes y mermas de inventario. Impactan el stock global.",
    group: "Inventario",
    fields: [
      { name: "inventoryId", label: "Ingrediente", type: "number" },
      { name: "type", label: "Tipo", type: "select", options: ["in", "out", "waste", "adjustment", "sale"] },
      { name: "quantity", label: "Cantidad", type: "number" },
      { name: "unit", label: "Unidad", type: "select", options: ["unidad", "kg", "g", "lt", "ml", "pack", "caja"] },
      { name: "reason", label: "Motivo", type: "text" },
      { name: "referenceType", label: "Referencia", type: "text" },
      { name: "referenceId", label: "ID referencia", type: "number" },
      { name: "userId", label: "Usuario", type: "number" },
    ],
    defaults: { inventoryId: 1, type: "in", quantity: 10, unit: "unidad", reason: "Entrada de mercaderia", referenceType: "purchase", referenceId: 1, userId: 1 },
    previewFields: ["id", "inventoryId", "type", "quantity", "unit", "reason"],
  },
  suppliers: {
    label: "Proveedores",
    description: "Contactos de abastecimiento.",
    group: "Inventario",
    fields: [
      { name: "name", label: "Nombre", type: "text" },
      { name: "contactName", label: "Contacto", type: "text" },
      { name: "phone", label: "Telefono", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "address", label: "Direccion", type: "text" },
      commonFields.statusActive,
    ],
    defaults: { name: "Proveedor Demo", contactName: "Laura", phone: "1122334455", email: "proveedor@demo.com", address: "Av. Siempre Viva 742", status: "active" },
    previewFields: ["id", "name", "phone", "status"],
  },
  purchaseOrders: {
    label: "Ordenes de compra",
    description: "Cabecera de compra. Al marcar recibida, suma sus items al stock.",
    group: "Inventario",
    fields: [
      { name: "supplierId", label: "Proveedor", type: "number" },
      { name: "status", label: "Estado", type: "select", options: ["draft", "sent", "received", "cancelled"] },
      { name: "total", label: "Total", type: "number" },
      { name: "expectedAt", label: "Esperada", type: "datetime-local" },
      commonFields.notes,
    ],
    defaults: { supplierId: 1, status: "draft", total: 10000, expectedAt: nextMonth, notes: "Compra semanal" },
    previewFields: ["id", "supplierId", "status", "total"],
  },
  purchaseOrderItems: {
    label: "Items de orden de compra",
    description: "Insumos comprados, cantidad, unidad y costo unitario que alimentan stock.",
    group: "Inventario",
    fields: [
      { name: "purchaseOrderId", label: "Orden", type: "number" },
      { name: "inventoryId", label: "Ingrediente", type: "number" },
      { name: "quantity", label: "Cantidad", type: "number" },
      { name: "unit", label: "Unidad", type: "select", options: ["unidad", "kg", "g", "lt", "ml", "pack", "caja"] },
      { name: "unitCost", label: "Costo unitario", type: "number" },
    ],
    defaults: { purchaseOrderId: 1, inventoryId: 1, quantity: 10, unit: "unidad", unitCost: 500 },
    previewFields: ["id", "purchaseOrderId", "inventoryId", "quantity", "unit", "unitCost"],
  },
  deliveryZones: {
    label: "Zonas de entrega",
    description: "Areas de cobertura con costo, minimo, demora estimada y referencia de mapa.",
    group: "Delivery",
    fields: [
      { name: "name", label: "Zona", type: "text" },
      { name: "description", label: "Descripcion", type: "text" },
      { name: "cost", label: "Costo", type: "number" },
      { name: "minOrderAmount", label: "Minimo", type: "number" },
      { name: "estimatedMinutes", label: "Demora min.", type: "number" },
      { name: "mapReference", label: "Referencia mapa", type: "text" },
      commonFields.active,
      { name: "neighborhoods", label: "Barrios / calles", type: "textarea", span: "full" },
      { name: "polygon", label: "Poligono JSON", type: "json", span: "full" },
    ],
    defaults: { name: "Centro", description: "Microcentro y alrededores", cost: 1200, minOrderAmount: 8000, estimatedMinutes: 35, mapReference: "Obelisco - radio 3km", active: true, neighborhoods: "Centro, Congreso, San Nicolas", polygon: "{\"type\":\"demo\",\"radiusKm\":3}" },
    previewFields: ["id", "name", "cost", "minOrderAmount", "estimatedMinutes", "active"],
  },
  couriers: {
    label: "Repartidores",
    description: "Equipo de delivery y disponibilidad.",
    group: "Delivery",
    fields: [
      { name: "userId", label: "Usuario", type: "number" },
      { name: "name", label: "Nombre", type: "text" },
      { name: "phone", label: "Telefono", type: "text" },
      { name: "vehicle", label: "Vehiculo", type: "text" },
      { name: "status", label: "Estado", type: "select", options: ["available", "busy", "inactive"] },
    ],
    defaults: { userId: 1, name: "Repartidor Demo", phone: "1100000000", vehicle: "Moto", status: "available" },
    previewFields: ["id", "name", "vehicle", "status"],
  },
  deliveryAssignments: {
    label: "Asignaciones de delivery",
    description: "Tracking, zona y repartidor por pedido.",
    group: "Delivery",
    fields: [
      { name: "orderId", label: "Pedido", type: "number" },
      { name: "courierId", label: "Repartidor", type: "number" },
      { name: "deliveryZoneId", label: "Zona", type: "number" },
      { name: "status", label: "Estado", type: "select", options: ["pending", "assigned", "picked_up", "delivered", "failed"] },
      { name: "trackingCode", label: "Tracking", type: "text" },
      { name: "cost", label: "Costo", type: "number" },
    ],
    defaults: { orderId: 1, courierId: 1, deliveryZoneId: 1, status: "assigned", trackingCode: "DEL-DEMO", cost: 1200 },
    previewFields: ["id", "orderId", "courierId", "status", "trackingCode"],
  },
  waitlist: {
    label: "Lista de espera",
    description: "Clientes esperando una mesa disponible.",
    group: "Reservas",
    fields: [
      { name: "userId", label: "Usuario", type: "number" },
      { name: "name", label: "Nombre", type: "text" },
      { name: "phone", label: "Telefono", type: "text" },
      { name: "date", label: "Fecha", type: "date" },
      { name: "shift", label: "Turno", type: "select", options: ["lunch", "dinner"] },
      { name: "people", label: "Personas", type: "number" },
      { name: "status", label: "Estado", type: "select", options: ["waiting", "notified", "converted", "cancelled"] },
    ],
    defaults: { userId: 1, name: "Cliente en espera", phone: "1100000000", date: today, shift: "dinner", people: 4, status: "waiting" },
    previewFields: ["id", "name", "date", "shift", "status"],
  },
  recurringBookings: {
    label: "Reservas recurrentes",
    description: "Reservas semanales para clientes frecuentes.",
    group: "Reservas",
    fields: [
      { name: "userId", label: "Usuario", type: "number" },
      { name: "dayOfWeek", label: "Dia semana", type: "number" },
      { name: "shift", label: "Turno", type: "select", options: ["lunch", "dinner"] },
      { name: "people", label: "Personas", type: "number" },
      { name: "startsAt", label: "Desde", type: "date" },
      { name: "endsAt", label: "Hasta", type: "date" },
      { name: "status", label: "Estado", type: "select", options: ["active", "paused", "cancelled"] },
    ],
    defaults: { userId: 1, dayOfWeek: 5, shift: "dinner", people: 2, startsAt: today, endsAt: "", status: "active" },
    previewFields: ["id", "userId", "dayOfWeek", "shift", "status"],
  },
  tableBlocks: {
    label: "Bloqueos de mesa",
    description: "Mesas fuera de disponibilidad por evento o mantenimiento.",
    group: "Reservas",
    fields: [
      { name: "tableId", label: "Mesa", type: "number" },
      { name: "date", label: "Fecha", type: "date" },
      { name: "shift", label: "Turno", type: "select", options: ["lunch", "dinner"] },
      { name: "status", label: "Estado", type: "select", options: ["active", "cancelled"] },
      { name: "reason", label: "Motivo", type: "textarea", span: "full" },
    ],
    defaults: { tableId: 1, date: today, shift: "dinner", reason: "Evento privado", status: "active" },
    previewFields: ["id", "tableId", "date", "shift", "status"],
  },
  missingIngredientReports: {
    label: "Ingredientes faltantes",
    description: "Avisos enviados desde cocina al inventario.",
    group: "Cocina",
    fields: [
      { name: "menuId", label: "Plato", type: "number" },
      { name: "inventoryId", label: "Ingrediente", type: "number" },
      { name: "orderItemId", label: "Item pedido", type: "number" },
      { name: "status", label: "Estado", type: "select", options: ["open", "resolved"] },
      { name: "message", label: "Mensaje", type: "textarea", span: "full" },
    ],
    defaults: { menuId: 1, inventoryId: 1, orderItemId: 1, message: "Falta queso para milanesa", status: "open" },
    previewFields: ["id", "menuId", "inventoryId", "status"],
  },
  kitchenEvents: {
    label: "Historial de produccion",
    description: "Eventos de cambio de estado por item y estacion.",
    group: "Cocina",
    fields: [
      { name: "orderId", label: "Pedido", type: "number" },
      { name: "orderItemId", label: "Item", type: "number" },
      { name: "event", label: "Evento", type: "text" },
      { name: "fromState", label: "Desde", type: "text" },
      { name: "toState", label: "Hasta", type: "text" },
      { name: "station", label: "Estacion", type: "select", options: ["kitchen", "grill", "bar", "dessert", "salad", "expo"] },
      { name: "userId", label: "Usuario", type: "number" },
    ],
    defaults: { orderId: 1, orderItemId: 1, event: "state_change", fromState: "received", toState: "preparing", station: "kitchen", userId: 1 },
    previewFields: ["id", "orderId", "orderItemId", "event", "toState"],
  },
  paymentAllocations: {
    label: "Pagos parciales",
    description: "Pagos por pedido, mesa o cierre de caja.",
    group: "Finanzas",
    fields: [
      { name: "orderId", label: "Pedido", type: "number" },
      { name: "tableSessionId", label: "Sesion mesa", type: "number" },
      { name: "cashRegisterId", label: "Caja", type: "number" },
      { name: "amount", label: "Importe", type: "number" },
      { name: "method", label: "Metodo", type: "select", options: ["cash", "card", "mp", "stripe"] },
      { name: "status", label: "Estado", type: "select", options: ["pending", "paid", "refunded", "failed"] },
    ],
    defaults: { orderId: 1, tableSessionId: "", cashRegisterId: 1, amount: 5000, method: "cash", status: "paid" },
    previewFields: ["id", "orderId", "tableSessionId", "amount", "status"],
  },
  tips: {
    label: "Propinas",
    description: "Propinas por mozo, mesa o pedido.",
    group: "Finanzas",
    fields: [
      { name: "orderId", label: "Pedido", type: "number" },
      { name: "tableSessionId", label: "Sesion mesa", type: "number" },
      { name: "waiterId", label: "Mozo", type: "number" },
      { name: "amount", label: "Importe", type: "number" },
      { name: "method", label: "Metodo", type: "select", options: ["cash", "card", "mp"] },
    ],
    defaults: { orderId: 1, tableSessionId: "", waiterId: 2, amount: 1500, method: "cash" },
    previewFields: ["id", "waiterId", "amount", "method"],
  },
  invoices: {
    label: "Facturacion",
    description: "Tickets y comprobantes para pedidos o mesas.",
    group: "Finanzas",
    fields: [
      { name: "orderId", label: "Pedido", type: "number" },
      { name: "tableSessionId", label: "Sesion mesa", type: "number" },
      { name: "customerId", label: "Cliente", type: "number" },
      { name: "number", label: "Numero", type: "text" },
      { name: "type", label: "Tipo", type: "select", options: ["A", "B", "C", "ticket"] },
      { name: "subtotal", label: "Subtotal", type: "number" },
      { name: "tax", label: "Impuesto", type: "number" },
      { name: "total", label: "Total", type: "number" },
      { name: "status", label: "Estado", type: "select", options: ["issued", "cancelled"] },
    ],
    defaults: { orderId: 1, tableSessionId: "", customerId: 1, number: "T-DEMO", type: "ticket", subtotal: 10000, tax: 2100, total: 12100, status: "issued" },
    previewFields: ["id", "number", "type", "total", "status"],
  },
  couponUsages: {
    label: "Usos de cupon",
    description: "Historial y limites aplicados por cliente.",
    group: "Promociones",
    fields: [
      { name: "couponId", label: "Cupon", type: "number" },
      { name: "userId", label: "Cliente", type: "number" },
      { name: "orderId", label: "Pedido", type: "number" },
      { name: "discountAmount", label: "Descuento", type: "number" },
    ],
    defaults: { couponId: 1, userId: 1, orderId: 1, discountAmount: 2000 },
    previewFields: ["id", "couponId", "userId", "discountAmount"],
  },
  integrationEvents: {
    label: "Eventos de integracion",
    description: "Registro de Mercado Pago, Stripe, impresora, QR y mapas.",
    group: "Sistema",
    fields: [
      { name: "provider", label: "Proveedor", type: "text" },
      { name: "type", label: "Tipo", type: "text" },
      { name: "status", label: "Estado", type: "select", options: ["simulated", "pending", "sent", "failed"] },
      { name: "externalReference", label: "Referencia", type: "text" },
      { name: "request", label: "Request JSON", type: "json", span: "full" },
      { name: "response", label: "Response JSON", type: "json", span: "full" },
    ],
    defaults: { provider: "mercadopago", type: "intent", status: "simulated", externalReference: "mp-demo", request: "{\"amount\":1000}", response: "{\"mode\":\"simulated\"}" },
    previewFields: ["id", "provider", "type", "status"],
  },
  auditLogs: {
    label: "Auditoria",
    description: "Cambios sensibles hechos por usuarios internos.",
    group: "Sistema",
    fields: [
      { name: "userId", label: "Usuario", type: "number" },
      { name: "action", label: "Accion", type: "text" },
      { name: "entity", label: "Entidad", type: "text" },
      { name: "entityId", label: "ID entidad", type: "text" },
      { name: "ip", label: "IP", type: "text" },
      { name: "metadata", label: "Metadata JSON", type: "json", span: "full" },
    ],
    defaults: { userId: 1, action: "create", entity: "menu", entityId: "1", ip: "127.0.0.1", metadata: "{\"source\":\"admin\"}" },
    previewFields: ["id", "action", "entity", "entityId"],
  },
} satisfies Record<string, ResourceConfig>;

type ResourceId = keyof typeof resourceConfigs;

const resourceIds = Object.keys(resourceConfigs) as ResourceId[];

const batchResourceConfigs: Partial<Record<ResourceId, { parentFields: string[]; lineFields: string[]; title: string }>> = {
  comboItems: {
    parentFields: ["comboId"],
    lineFields: ["menuId", "quantity"],
    title: "Menus incluidos en el combo",
  },
  menuIngredients: {
    parentFields: ["menuId"],
    lineFields: ["inventoryId", "quantity", "unit", "costPerUnit"],
    title: "Ingredientes necesarios para el plato",
  },
  purchaseOrderItems: {
    parentFields: ["purchaseOrderId"],
    lineFields: ["inventoryId", "quantity", "unit", "unitCost"],
    title: "Insumos comprados en esta orden",
  },
};

const integrations = [
  { id: "mercadopago", label: "Mercado Pago", description: "Checkout y cobros locales." },
  { id: "stripe", label: "Stripe", description: "Pagos online internacionales." },
  { id: "thermal-printer", label: "Impresora termica", description: "Tickets de cocina y caja." },
  { id: "qr-table", label: "QR por mesa", description: "Carta y pedido por mesa." },
  { id: "billing", label: "Facturacion", description: "Comprobantes y tickets." },
  { id: "pedidosya", label: "PedidosYa", description: "Preparado para marketplace." },
  { id: "rappi", label: "Rappi", description: "Preparado para marketplace." },
  { id: "google-maps", label: "Google Maps", description: "Zonas, rutas y tracking." },
];

const settingPresets = [
  { label: "Telefono", key: "restaurant.phone", value: "+54 11 5555-5555", group: "contact", type: "string" },
  { label: "Direccion", key: "restaurant.address", value: "Av. Corrientes 1234, CABA", group: "contact", type: "string" },
  { label: "Horarios", key: "restaurant.hours", value: "{\"lunch\":\"12:00-15:30\",\"dinner\":\"20:00-00:30\"}", group: "hours", type: "json" },
  { label: "Logo", key: "restaurant.logo", value: "/logo.png", group: "branding", type: "string" },
  { label: "IVA", key: "tax.default", value: "21", group: "taxes", type: "number" },
  { label: "Delivery", key: "delivery.base_cost", value: "1200", group: "delivery", type: "number" },
] as const;

const fieldLabel: Record<string, string> = {
  id: "ID",
  name: "Nombre",
  status: "Estado",
  sortOrder: "Orden",
  key: "Clave",
  value: "Valor",
  description: "Descripcion",
  group: "Grupo",
  date: "Fecha",
  category: "Categoria",
  amount: "Importe",
  openedBy: "Abierta por",
  openingAmount: "Monto inicial",
  code: "Codigo",
  type: "Tipo",
  active: "Activo",
  price: "Precio",
  comboId: "Combo",
  menuId: "Plato",
  inventoryId: "Ingrediente",
  quantity: "Cantidad",
  unit: "Unidad",
  minimumThreshold: "Stock minimo",
  costPerUnit: "Costo unitario",
  phone: "Telefono",
  supplierId: "Proveedor",
  total: "Total",
  purchaseOrderId: "Orden",
  unitCost: "Costo unitario",
  cost: "Costo",
  minOrderAmount: "Minimo",
  estimatedMinutes: "Demora",
  neighborhoods: "Barrios",
  mapReference: "Referencia mapa",
  vehicle: "Vehiculo",
  orderId: "Pedido",
  courierId: "Repartidor",
  deliveryZoneId: "Zona",
  trackingCode: "Tracking",
  shift: "Turno",
  userId: "Usuario",
  dayOfWeek: "Dia",
  tableId: "Mesa",
  orderItemId: "Item",
  event: "Evento",
  toState: "Hasta",
  tableSessionId: "Mesa",
  number: "Numero",
  provider: "Proveedor",
  action: "Accion",
  entity: "Entidad",
  entityId: "Entidad ID",
  discountAmount: "Descuento",
};

function makeInitialForm(resource: ResourceId): FormState {
  const config = resourceConfigs[resource];
  return config.fields.reduce<FormState>((values, field) => {
    const value = (config.defaults as Record<string, string | number | boolean>)[field.name];
    values[field.name] = field.type === "checkbox" ? Boolean(value) : String(value ?? "");
    return values;
  }, {});
}

function makeInitialBatchLine(resource: ResourceId): FormState {
  const config = resourceConfigs[resource];
  const batchConfig = batchResourceConfigs[resource];
  if (!batchConfig) return {};
  return config.fields
    .filter((field) => batchConfig.lineFields.includes(field.name))
    .reduce<FormState>((values, field) => {
      const value = (config.defaults as Record<string, string | number | boolean>)[field.name];
      values[field.name] = field.type === "checkbox" ? Boolean(value) : String(value ?? "");
      return values;
    }, {});
}

function formFromRow(config: ResourceConfig, row: ResourceRecord): FormState {
  return config.fields.reduce<FormState>((values, field) => {
    const raw = row[field.name];

    if (field.type === "checkbox") {
      values[field.name] = Boolean(raw);
      return values;
    }

    if (raw === null || raw === undefined) {
      values[field.name] = "";
      return values;
    }

    if (field.type === "json") {
      values[field.name] = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
      return values;
    }

    if (field.type === "datetime-local") {
      values[field.name] = String(raw).slice(0, 16);
      return values;
    }

    if (field.type === "date") {
      values[field.name] = String(raw).slice(0, 10);
      return values;
    }

    values[field.name] = String(raw);
    return values;
  }, {});
}

function parsePayload(config: ResourceConfig, form: FormState) {
  return config.fields.reduce<Record<string, unknown>>((payload, field) => {
    const raw = form[field.name];

    if (field.type === "checkbox") {
      payload[field.name] = Boolean(raw);
      return payload;
    }

    if (raw === "" || raw === undefined) return payload;

    if (field.type === "number") {
      payload[field.name] = Number(raw);
      return payload;
    }

    if (field.type === "json") {
      payload[field.name] = JSON.parse(String(raw));
      return payload;
    }

    payload[field.name] = raw;
    return payload;
  }, {});
}

function renderValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return labelOrValue(value);
}

function lookupLabel(fieldName: string, value: unknown, lookups: OpsLookupMap) {
  const lookupKey = lookupForField(fieldName);
  if (!lookupKey || value === null || value === undefined || value === "") return null;
  const option = lookups[lookupKey]?.find((item) => item.value === String(value));
  if (!option) return null;
  return `${option.label} (#${value})`;
}

function renderCellValue(fieldName: string, value: unknown, lookups: OpsLookupMap) {
  return lookupLabel(fieldName, value, lookups) || renderValue(value);
}

function recordDisplayName(config: ResourceConfig, row: ResourceRecord, lookups: OpsLookupMap) {
  const preferredFields = [
    "name",
    "nameDish",
    "code",
    "number",
    "provider",
    "trackingCode",
    "externalReference",
    "category",
    "action",
    ...config.previewFields.filter((field) => field !== "id"),
  ];

  for (const field of preferredFields) {
    const value = renderCellValue(field, row[field], lookups);
    if (value !== "-") return value;
  }

  return row.id ? `registro #${row.id}` : "registro";
}

export default function AdvancedOpsPanel() {
  const [resource, setResource] = useState<ResourceId>("categories");
  const [form, setForm] = useState<FormState>(() => makeInitialForm("categories"));
  const [rows, setRows] = useState<ResourceRecord[]>([]);
  const [integrationRows, setIntegrationRows] = useState<ResourceRecord[]>([]);
  const [lookups, setLookups] = useState<OpsLookupMap>({});
  const [lookupLoading, setLookupLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [batchLines, setBatchLines] = useState<FormState[]>(() => [makeInitialBatchLine("categories")]);

  const activeConfig = resourceConfigs[resource];
  const activeBatchConfig = !editingId ? batchResourceConfigs[resource] : undefined;
  const visibleFormFields = activeBatchConfig
    ? activeConfig.fields.filter((field) => activeBatchConfig.parentFields.includes(field.name))
    : activeConfig.fields;

  const filteredResources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return resourceIds;
    return resourceIds.filter((id) => {
      const config = resourceConfigs[id];
      return `${config.label} ${config.description} ${config.group}`.toLowerCase().includes(normalized);
    });
  }, [query]);

  const groups = useMemo(() => {
    return filteredResources.reduce<Record<string, ResourceId[]>>((acc, id) => {
      const group = resourceConfigs[id].group;
      acc[group] = [...(acc[group] || []), id];
      return acc;
    }, {});
  }, [filteredResources]);

  const editingLabel = useMemo(() => {
    if (!editingId) return null;
    const row = rows.find((item) => Number(item.id) === editingId);
    return row ? recordDisplayName(activeConfig, row, lookups) : `registro #${editingId}`;
  }, [activeConfig, editingId, lookups, rows]);

  const refreshLookups = useCallback(async () => {
    setLookupLoading(true);
    try {
      setLookups(await getOpsLookups());
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const loadRows = useCallback(async (targetResource: ResourceId = resource, silent = false) => {
    setLoading(true);
    try {
      const data = await listOpsResource<ResourceRecord>(targetResource);
      if (targetResource === resource) setRows(data);
      if (!silent) setMessage(data.length ? `${data.length} registros cargados.` : "No hay registros todavia.");
      return data;
    } catch (error) {
      if (targetResource === resource) setRows([]);
      if (!silent) setMessage(error instanceof Error ? error.message : "No se pudieron cargar los registros.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [resource]);

  const loadIntegrations = useCallback(async () => {
    try {
      const data = await listOpsResource<ResourceRecord>("integrationEvents");
      setIntegrationRows(data.slice(0, 8));
    } catch {
      setIntegrationRows([]);
    }
  }, []);

  useEffect(() => {
    loadRows(resource, true).then((data) => {
      setMessage(data.length ? `${data.length} registros encontrados.` : "No hay registros todavia.");
    });
    setEditingId(null);
  }, [loadRows, resource]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  useEffect(() => {
    refreshLookups();
  }, [refreshLookups]);

  const selectResource = (value: ResourceId) => {
    setResource(value);
    setForm(makeInitialForm(value));
    setBatchLines([makeInitialBatchLine(value)]);
    setRows([]);
    setEditingId(null);
    setMessage(null);
  };

  const createRow = async () => {
    setCreating(true);
    try {
      if (activeBatchConfig) {
        const parentPayload = parsePayload(
          { ...activeConfig, fields: activeConfig.fields.filter((field) => activeBatchConfig.parentFields.includes(field.name)) },
          form
        );
        const lineConfig = {
          ...activeConfig,
          fields: activeConfig.fields.filter((field) => activeBatchConfig.lineFields.includes(field.name)),
        };
        const payloads = batchLines
          .map((line) => ({ ...parentPayload, ...parsePayload(lineConfig, line) }))
          .filter((payload) => activeBatchConfig.lineFields.some((field) => payload[field] !== undefined));

        if (!payloads.length) throw new Error("Agrega al menos una linea.");
        await Promise.all(payloads.map((payload) => createOpsResource(resource, payload)));
        setMessage(`${payloads.length} registros creados correctamente.`);
      } else {
        const payload = parsePayload(activeConfig, form);
        await createOpsResource(resource, payload);
        setMessage("Registro creado correctamente.");
      }
      setForm(makeInitialForm(resource));
      setBatchLines([makeInitialBatchLine(resource)]);
      await refreshLookups();
      await loadRows(resource, true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el registro.");
    } finally {
      setCreating(false);
    }
  };

  const updateRow = async () => {
    if (!editingId) return;
    setCreating(true);
    try {
      const payload = parsePayload(activeConfig, form);
      await updateOpsResource(resource, editingId, payload);
      setMessage(`${editingLabel || `Registro #${editingId}`} actualizado correctamente.`);
      setEditingId(null);
      setForm(makeInitialForm(resource));
      await refreshLookups();
      await loadRows(resource, true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar el registro.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (row: ResourceRecord) => {
    const rowId = Number(row.id);
    if (!rowId) return;
    setEditingId(rowId);
    setForm(formFromRow(activeConfig, row));
    setBatchLines([makeInitialBatchLine(resource)]);
    setMessage(`Editando ${recordDisplayName(activeConfig, row, lookups)}.`);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(makeInitialForm(resource));
    setBatchLines([makeInitialBatchLine(resource)]);
    setMessage(null);
  };

  const deleteRow = async (row: ResourceRecord) => {
    const rowId = Number(row.id);
    if (!rowId) return;
    setDeletingId(rowId);
    try {
      await deleteOpsResource(resource, rowId);
      if (editingId === rowId) cancelEdit();
      setMessage(`${recordDisplayName(activeConfig, row, lookups)} eliminado.`);
      await refreshLookups();
      await loadRows(resource, true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar el registro.");
    } finally {
      setDeletingId(null);
    }
  };

  const runIntegration = async (provider: string) => {
    setCreating(true);
    try {
      const result = await createIntegrationIntent(provider, {
        type: provider === "thermal-printer" ? "print" : "intent",
        amount: 1000,
        tableId: 1,
        destination: "Demo",
      });
      setMessage(`Integracion ${provider} lista: ${JSON.stringify(result).slice(0, 160)}...`);
      await loadIntegrations();
      if (resource === "integrationEvents") await loadRows(resource, true);
    } catch {
      setMessage(`No se pudo preparar la integracion ${provider}.`);
    } finally {
      setCreating(false);
    }
  };

  const reportUrl = (format: "csv" | "pdf") =>
    `${process.env.NEXT_PUBLIC_API_URL2 || ""}/reports/advanced?period=month&format=${format}`;

  return (
    <section className="staff-panel overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="mt-1 text-2xl font-bold text-gray-950">Módulos de gestión</h2>
            <p className="mt-1 max-w-3xl text-sm text-gray-600">
              Buscá un módulo para crear registros, revisar datos o consultar las integraciones.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={reportUrl("csv")}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-stone-50"
            >
              <Download className="h-4 w-4" />
              Excel CSV
            </a>
            <a
              href={reportUrl("pdf")}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-stone-50"
            >
              <Download className="h-4 w-4" />
              PDF
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="border-b border-stone-100 bg-white p-4 xl:border-b-0 xl:border-r">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              aria-label="Buscar módulo"
              placeholder="Buscar módulo…"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primario-300 focus:bg-white focus:ring-2 focus:ring-primario-100"
            />
          </label>

          <div className="mt-4 max-h-56 space-y-3 overflow-auto pr-1 xl:max-h-[34rem]">
            {Object.keys(groups).length === 0 && <p role="status" className="p-2 text-sm text-slate-600">No encontramos módulos.</p>}
            {Object.entries(groups).map(([group, ids]) => (
              <div key={group}>
                <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                  {group}
                </p>
                <div className="space-y-1.5">
                  {ids.map((id) => {
                    const config = resourceConfigs[id];
                    const selected = resource === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => selectResource(id)}
                        className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                          selected
                            ? "bg-primario-50 text-primario-800 ring-1 ring-primario-200"
                            : "text-gray-700 hover:bg-stone-50"
                        }`}
                      >
                        <span className="block text-sm font-bold">{config.label}</span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-gray-500">
                          {config.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-5 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    <Database className="h-3.5 w-3.5" />
                    {activeConfig.group}
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-gray-950">{activeConfig.label}</h3>
                  <p className="mt-1 text-sm text-gray-600">{activeConfig.description}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {resource === "restaurantSettings" && (
                  <div className="md:col-span-2">
                    <p className="mb-2 text-sm font-bold text-gray-950">Plantillas rapidas</p>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {settingPresets.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() =>
                            setForm({
                              key: preset.key,
                              value: preset.value,
                              group: preset.group,
                              type: preset.type,
                            })
                          }
                          className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-left text-sm hover:border-primario-200 hover:bg-primario-50"
                        >
                          <span className="block font-bold text-gray-900">{preset.label}</span>
                          <span className="block truncate text-xs text-gray-500">{preset.key}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {visibleFormFields.map((field) => (
                  <FieldInput
                    key={field.name}
                    field={field}
                    lookupLoading={lookupLoading}
                    lookupOptions={lookupForField(field.name) ? lookups[lookupForField(field.name)!] || [] : undefined}
                    value={form[field.name]}
                    onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))}
                  />
                ))}
                {activeBatchConfig && (
                  <BatchLineEditor
                    resource={resource}
                    title={activeBatchConfig.title}
                    fields={activeConfig.fields.filter((field) => activeBatchConfig.lineFields.includes(field.name))}
                    lines={batchLines}
                    lookups={lookups}
                    lookupLoading={lookupLoading}
                    onChange={setBatchLines}
                  />
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={editingId ? updateRow : createRow}
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-lg bg-primario-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primario-700 disabled:opacity-60"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingId ? `Guardar ${editingLabel || `#${editingId}`}` : "Crear registro"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-stone-50"
                  >
                    <X className="h-4 w-4" />
                    Cancelar edicion
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setForm(makeInitialForm(resource));
                    setEditingId(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-stone-50"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => loadRows(resource)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-stone-50 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  Cargar registros
                </button>
                {resource === "combos" && (
                  <button
                    type="button"
                    onClick={() => selectResource("comboItems")}
                    className="inline-flex items-center gap-2 rounded-lg border border-primario-200 bg-primario-50 px-4 py-2 text-sm font-semibold text-primario-700 hover:bg-primario-100"
                  >
                    Configurar menus y cantidades
                  </button>
                )}
                {resource === "purchaseOrders" && (
                  <button
                    type="button"
                    onClick={() => selectResource("purchaseOrderItems")}
                    className="inline-flex items-center gap-2 rounded-lg border border-primario-200 bg-primario-50 px-4 py-2 text-sm font-semibold text-primario-700 hover:bg-primario-100"
                  >
                    Cargar insumos comprados
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primario-700" />
                <p className="text-sm font-bold text-gray-950">Resumen funcional</p>
              </div>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <p>
                  Modulo activo: <b className="text-gray-900">{activeConfig.label}</b>
                </p>
                <p>Campos configurados: {activeConfig.fields.length}</p>
                <p>Registros en memoria: {rows.length}</p>
              </div>
              {message && (
                <div className="mt-4 rounded-lg border border-stone-200 bg-white p-3 text-sm text-gray-700">
                  {message}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-3">
              <div>
                <h3 className="font-bold text-gray-950">Registros del módulo</h3>
                <p className="text-xs text-gray-500">Se cargan automaticamente al entrar y despues de cada cambio.</p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {rows.length}
              </span>
            </div>

            {rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-[0.12em] text-gray-500">
                    <tr>
                      {activeConfig.previewFields.map((field) => (
                        <th key={field} className="px-4 py-3 font-bold">
                          {fieldLabel[field] || field}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {rows.slice(0, 50).map((row, index) => (
                      <tr key={String(row.id ?? index)} className="hover:bg-stone-50/70">
                        {activeConfig.previewFields.map((field) => (
                          <td key={field} className="max-w-[220px] truncate px-4 py-3 text-gray-700">
                            {renderCellValue(field, row[field], lookups)}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(row)}
                              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-stone-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRow(row)}
                              disabled={deletingId === Number(row.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                              {deletingId === Number(row.id) ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                Carga registros para verlos aca.
              </div>
            )}
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-bold text-gray-950">Integraciones</h3>
                <p className="text-sm text-gray-600">
                  Disparadores conectados al backend para pagos, impresora, QR, mapas y marketplaces.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selectResource("integrationEvents")}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-stone-50"
                >
                  Ver CRUD de eventos
                </button>
                <button
                  type="button"
                  onClick={() => loadIntegrations()}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-stone-50"
                >
                  Actualizar historial
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {integrations.map((provider) => (
                <div
                  key={provider.id}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-3 transition hover:border-primario-200 hover:bg-primario-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span>
                      <span className="flex items-center gap-2 text-sm font-bold text-gray-950">
                        <PlugZap className="h-4 w-4 text-primario-700" />
                        {provider.label}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">{provider.description}</span>
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-500 ring-1 ring-stone-200">
                      Demo
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => runIntegration(provider.id)}
                    disabled={creating}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-gray-700 ring-1 ring-stone-200 hover:bg-stone-100 disabled:opacity-60"
                  >
                    <PlugZap className="h-3.5 w-3.5" />
                    Probar integracion
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-stone-200 bg-white">
              <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2">
                <p className="text-sm font-bold text-gray-950">Ultimos eventos</p>
                <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-gray-600">
                  {integrationRows.length}
                </span>
              </div>
              {integrationRows.length > 0 ? (
                <div className="divide-y divide-stone-100">
                  {integrationRows.map((event) => (
                    <div key={String(event.id)} className="grid gap-2 px-3 py-2 text-sm sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                      <span className="font-semibold text-gray-900">{renderValue(event.provider)}</span>
                      <span className="text-gray-500">{renderValue(event.type)} - {renderValue(event.status)}</span>
                      <span className="text-xs text-gray-400">{renderValue(event.externalReference)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-4 text-sm text-gray-500">
                  Todavia no hay eventos. Proba una integracion para generar historial.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BatchLineEditor({
  resource,
  title,
  fields,
  lines,
  lookups,
  lookupLoading,
  onChange,
}: {
  resource: ResourceId;
  title: string;
  fields: FieldDefinition[];
  lines: FormState[];
  lookups: OpsLookupMap;
  lookupLoading: boolean;
  onChange: (lines: FormState[]) => void;
}) {
  const updateLine = (index: number, fieldName: string, value: FormValue) => {
    onChange(lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [fieldName]: value } : line)));
  };

  return (
    <div className="md:col-span-2 rounded-lg border border-primario-100 bg-primario-50/40 p-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-gray-950">{title}</p>
          <p className="text-xs text-gray-500">Carga varias lineas y se crean todas juntas.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...lines, makeInitialBatchLine(resource)])}
          className="inline-flex items-center gap-2 rounded-lg border border-primario-200 bg-white px-3 py-2 text-xs font-bold text-primario-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar linea
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {lines.map((line, index) => (
          <div key={index} className="rounded-lg border border-stone-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
                Linea {index + 1}
              </span>
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange(lines.filter((_, lineIndex) => lineIndex !== index))}
                  className="rounded-lg border border-red-100 px-2 py-1 text-xs font-semibold text-red-600"
                >
                  Quitar
                </button>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {fields.map((field) => (
                <FieldInput
                  key={field.name}
                  field={field}
                  lookupLoading={lookupLoading}
                  lookupOptions={lookupForField(field.name) ? lookups[lookupForField(field.name)!] || [] : undefined}
                  value={line[field.name]}
                  onChange={(value) => updateLine(index, field.name, value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  lookupLoading,
  lookupOptions,
  value,
  onChange,
}: {
  field: FieldDefinition;
  lookupLoading?: boolean;
  lookupOptions?: LookupOption[];
  value: FormValue | undefined;
  onChange: (value: FormValue) => void;
}) {
  const wrapperClass = field.span === "full" ? "md:col-span-2" : "";
  const inputClass =
    "mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primario-300 focus:ring-2 focus:ring-primario-100";

  if (field.type === "checkbox") {
    return (
      <label className={`flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 ${wrapperClass}`}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 rounded border-stone-300 text-primario-600 focus:ring-primario-500"
        />
        <span className="text-sm font-semibold text-gray-700">{field.label}</span>
      </label>
    );
  }

  if (lookupOptions) {
    const selectedValue = String(value ?? "");
    const hasCurrentValue =
      selectedValue === "" || lookupOptions.some((option) => option.value === selectedValue);

    return (
      <label className={wrapperClass}>
        <span className="text-sm font-semibold text-gray-700">{field.label}</span>
        <select value={selectedValue} onChange={(event) => onChange(event.target.value)} className={inputClass}>
          <option value="">
            {lookupLoading ? "Cargando opciones..." : `Seleccionar ${field.label.toLowerCase()}`}
          </option>
          {!hasCurrentValue && (
            <option value={selectedValue}>{`${field.label} #${selectedValue} (sin nombre cargado)`}</option>
          )}
          {lookupOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.hint ? `${option.label} - ${option.hint}` : option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className={wrapperClass}>
        <span className="text-sm font-semibold text-gray-700">{field.label}</span>
        <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className={inputClass}>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {labelOrValue(option)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea" || field.type === "json") {
    return (
      <label className={wrapperClass}>
        <span className="text-sm font-semibold text-gray-700">{field.label}</span>
        <textarea
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          rows={field.type === "json" ? 4 : 3}
          placeholder={field.placeholder}
          className={field.type === "json" ? `${inputClass} font-mono` : `${inputClass} font-sans`}
        />
      </label>
    );
  }

  return (
    <label className={wrapperClass}>
      <span className="text-sm font-semibold text-gray-700">{field.label}</span>
      <input
        type={field.type}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        className={inputClass}
      />
    </label>
  );
}
