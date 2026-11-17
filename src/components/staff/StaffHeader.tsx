import type { ReactNode } from "react";
import { Bell, CalendarDays, ChefHat, LayoutDashboard } from "lucide-react";

const areas = {
  admin: { label: "Administración", icon: LayoutDashboard },
  recepcion: { label: "Recepción", icon: CalendarDays },
  chef: { label: "Cocina", icon: ChefHat },
  mozo: { label: "Salón", icon: Bell },
};

type Props = {
  area: keyof typeof areas;
  title: string;
  description: string;
  children?: ReactNode;
};

export default function StaffHeader({ area, title, description, children }: Props) {
  const { label, icon: Icon } = areas[area];
  return (
    <header className="staff-header">
      <div className="min-w-0">
        <p className="staff-area"><Icon size={17} aria-hidden /> {label}</p>
        <h1>{title}</h1>
        <p className="staff-description">{description}</p>
      </div>
      {children && <div className="staff-header-actions">{children}</div>}
    </header>
  );
}
