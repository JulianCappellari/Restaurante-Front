// src/features/reservas/types.ts

export type TableStatus = 'available' | 'reserved' | 'occupied' | 'maintenance';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'checked_in' | 'completed';
export type SessionStatus = 'active' | 'closed';

export interface Table {
  id: number;
  tableNum: number;
  ability: 2 | 4;            // capacidad fija 2 o 4
  status: TableStatus;
}

// Reserva con fecha/hora y posibilidad de múltiples mesas (pivot booking_tables)
export interface Booking {
  id: number;
  userId: number;
  bookingDate: string;       // ISO datetime (ej. 2025-09-10T20:00:00.000Z)
  numberPeople: number;
  status: BookingStatus;
  tableIds?: number[];       // mesas asociadas
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TableSession {
  id: number;
  tableId: number;
  bookingId?: number | null;
  startedAt: string;
  endedAt?: string | null;
  partySize: number;
  status: SessionStatus;
  notes?: string | null;
  waiterId?: number | null;
}

// Disponibilidad
export interface AvailabilityRequest {
  dateTime: string;          // ISO datetime
  people: number;
}

export interface AvailableTable {
  id: number;
  tableNum: number;
  availableFrom: string;     // ISO datetime
}

export interface AvailabilityResponseBase {
  available: boolean;
  message?: string;
  tables?: AvailableTable[];                 // cuando hay mesas individuales
  nextAvailableSlots?: AvailableTable[];     // próximos turnos si no hay
  suggestions?: Array<{                      // combinaciones (2+4, 2+2, etc.)
    tableIds: number[];
    breakdown: { two: number; four: number };
    fits: number;                            // capacidad total de la combinación
  }>;
}
export type AvailabilityResponse = AvailabilityResponseBase;

// Crear reserva
export interface CreateBookingRequest {
  userId: number;
  bookingDate: string;       // ISO datetime
  numberPeople: number;
  tableIds: number[];        // 1..n mesas elegidas
}

export interface CreateBookingResponse {
  booking: { id: number; status: BookingStatus };
  tables: Array<{ id: number; tableNum: number }>;
}
