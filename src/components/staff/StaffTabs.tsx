"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export type StaffView = {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Número que acompaña a la pestaña (pendientes, registros). */
  count?: number;
  /** Resalta la cuenta cuando requiere atención. */
  alert?: boolean;
};

/** Vista activa sincronizada con `?vista=` sin recargar la página. */
export function useStaffView(ids: string[], fallback: string) {
  const requested = useSearchParams().get("vista");
  const [view, setView] = useState(requested && ids.includes(requested) ? requested : fallback);

  const change = (id: string) => {
    setView(id);
    const url = new URL(window.location.href);
    url.searchParams.set("vista", id);
    window.history.replaceState(window.history.state, "", url);
  };

  return [view, change] as const;
}

export default function StaffTabs({ views, active, onChange, label }: {
  views: StaffView[];
  active: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div className="staff-tabs" role="tablist" aria-label={label}>
      {views.map(({ id, label: name, icon: Icon, count, alert }) => {
        const selected = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={selected}
            aria-controls={`vista-${id}`}
            onClick={() => onChange(id)}
            className="staff-tab"
          >
            {Icon && <Icon aria-hidden className="size-4" />}
            {name}
            {count !== undefined && (
              <span className={`staff-tab-count ${alert && count > 0 ? "is-alert" : ""}`}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
