"use client";

import { getRadar, type RadarIssue } from "@/actions/service/service-actions";
import { AlarmClock, Bell, ChefHat, CreditCard, Hourglass, Replace, Utensils } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* Radar de demoras: dónde está la espera ahora y quién puede resolverla. */
const TYPE: Record<RadarIssue["type"], { label: string; icon: typeof Bell }> = {
  "sin-pedido": { label: "Mesa sin pedir", icon: Hourglass },
  "llamado-sin-tomar": { label: "Llamado sin tomar", icon: Bell },
  "plato-sin-retirar": { label: "Plato listo sin retirar", icon: Utensils },
  "comanda-sin-empezar": { label: "Comanda sin empezar", icon: ChefHat },
  "plato-demorado": { label: "Plato demorado", icon: AlarmClock },
  "cobro-pendiente": { label: "Cobro sin confirmar", icon: CreditCard },
  "cambio-pendiente": { label: "Cambio de plato pendiente", icon: Replace },
};
const ROLE: Record<RadarIssue["role"], string> = { waiter: "Salón", chef: "Cocina" };

export default function RadarStrip({ role, title = "Radar de demoras", showRole = false, limit = 6 }: {
  role?: "waiter" | "chef" | "manager";
  title?: string;
  showRole?: boolean;
  limit?: number;
}) {
  const [issues, setIssues] = useState<RadarIssue[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setIssues((await getRadar(role)).issues);
      setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "No se pudo cargar el radar.");
    }
  }, [role]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 20_000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (!issues && !error) return null;
  if (issues && issues.length === 0 && !showRole) return null;

  return (
    <section aria-labelledby={`radar-${role ?? "all"}`} className="staff-panel border-red-200 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id={`radar-${role ?? "all"}`} className="flex items-center gap-2 text-lg font-bold text-stone-950">
          <AlarmClock aria-hidden className="size-5 text-red-700" /> {title}
          {issues && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{issues.length}</span>}
        </h2>
        <button type="button" className="staff-control" onClick={load}>Actualizar</button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-800">{error}</p>}
      {issues && issues.length === 0 && <p className="mt-2 text-sm text-stone-600">Sin esperas fuera de lo normal.</p>}
      {issues && issues.length > 0 && (
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {issues.slice(0, limit).map((issue, index) => {
            const { label, icon: Icon } = TYPE[issue.type];
            return (
              <li key={`${issue.type}-${issue.tableNum}-${index}`} className="flex items-start gap-3 rounded-xl bg-red-50 p-3 ring-1 ring-red-100">
                <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-red-700" />
                <div className="min-w-0 text-sm">
                  <p className="font-bold text-stone-950">{issue.tableNum ? `Mesa ${issue.tableNum}` : "Pedido"} · {label}</p>
                  <p className="text-stone-700">{issue.text}{showRole && <span className="ml-1 font-semibold text-red-800">→ {ROLE[issue.role]}</span>}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {issues && issues.length > limit && <p className="mt-2 text-xs text-stone-600">Y {issues.length - limit} más.</p>}
    </section>
  );
}
