"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays, Hourglass, Landmark, Truck, UtensilsCrossed } from "lucide-react";
import StaffTabs, { useStaffView, type StaffView } from "./StaffTabs";
import ReceptionFloor from "./ReceptionFloor";
import ReceptionWaitlist from "./ReceptionWaitlist";

type Slots = { salon: ReactNode; reservas: ReactNode; caja: ReactNode; despacho: ReactNode };

export default function ReceptionViews({ slots, counts }: {
  slots: Slots;
  counts: { freeTables: number; pendingArrival: number; deliveries: number };
}) {
  const [view, setView] = useStaffView(["salon", "espera", "reservas", "caja", "despacho"], "salon");
  const [waiting, setWaiting] = useState<number | undefined>(undefined);
  const views: StaffView[] = [
    { id: "salon", label: "Salón", icon: UtensilsCrossed, count: counts.freeTables },
    { id: "espera", label: "Lista de espera", icon: Hourglass, count: waiting, alert: true },
    { id: "reservas", label: "Reservas", icon: CalendarDays, count: counts.pendingArrival, alert: true },
    { id: "caja", label: "Caja", icon: Landmark },
    { id: "despacho", label: "Despacho", icon: Truck, count: counts.deliveries, alert: true },
  ];

  return (
    <>
      <StaffTabs label="Vistas de recepción" views={views} active={view} onChange={setView} />
      <div id={`vista-${view}`} role="tabpanel" aria-labelledby={`tab-${view}`} className="staff-view space-y-5" key={view}>
        {view === "salon" && (
          <>
            <ReceptionFloor />
            {slots.salon}
          </>
        )}
        {view === "espera" && <ReceptionWaitlist onCount={setWaiting} />}
        {view === "reservas" && slots.reservas}
        {view === "caja" && slots.caja}
        {view === "despacho" && slots.despacho}
      </div>
    </>
  );
}
