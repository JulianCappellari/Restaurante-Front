"use client";

import { Clock, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type React from "react";

type Props = {
  googleMapsUrl?: string;
  address?: string;
};

export default function LocationSection({
  googleMapsUrl = "https://www.google.com/maps",
  address = "Calle Falsa 123, Buenos Aires",
}: Props) {
  return (
    <section
      className="w-full overflow-hidden rounded-lg border bg-neutral-950 text-white shadow-sm"
      aria-label="Ubicacion del restaurante"
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
        <div className="p-6 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            Contacto
          </p>
          <h3 className="mt-3 text-3xl font-bold md:text-4xl">Te esperamos</h3>
          <p className="mt-3 max-w-xl leading-7 text-white/75">
            Venite al salon o arma tu pedido desde el menu. Mantenemos horarios claros y
            una atencion simple para cada visita.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Info icon={MapPin} label="Direccion" value={address} />
            <Info icon={Clock} label="Horario" value="12:00 - 23:00" />
            <Info icon={Phone} label="Telefono" value="+54 11 1234-5678" />
          </div>
        </div>

        <div className="flex items-center bg-white/5 p-6 md:p-10">
          <div className="w-full rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-white/75">Listo para reservar?</p>
            <div className="mt-4 grid gap-3">
              <Link
                href="/reserva"
                className="rounded-lg bg-primario-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-primario-700"
              >
                Reservar mesa
              </Link>
              <Link
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/20 px-4 py-3 text-center font-semibold text-white transition hover:bg-white/10"
                aria-label="Abrir ubicacion en Google Maps"
              >
                Abrir en Google Maps
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white/10 p-4">
      <Icon className="h-5 w-5 text-amber-300" />
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/55">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
