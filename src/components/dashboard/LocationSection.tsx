"use client";

import { FaMapMarkerAlt } from "react-icons/fa";
import Link from "next/link";

type Props = {
  googleMapsUrl?: string;
  address?: string;
};

export default function LocationSection({
  googleMapsUrl = "https://www.google.com/maps/place/TU_UBICACION",
  address = "Calle Falsa 123, Buenos Aires",
}: Props) {
  return (
    <section
      className="w-full rounded-3xl bg-gradient-to-r from-[var(--primario-500)] via-[var(--primario-600)] to-[var(--primario-700)]
                 px-6 py-10 text-center text-white shadow-lg"
      aria-label="Ubicación del restaurante"
    >
      <div className="mx-auto max-w-3xl">
        <h3 className="text-3xl md:text-4xl font-semibold">¡Visítanos!</h3>
        <p className="mt-3 text-lg md:text-xl/relaxed opacity-95">
          Estamos en una zona accesible. Te esperamos para darte la mejor experiencia.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <FaMapMarkerAlt aria-hidden className="text-2xl md:text-3xl text-[var(--primario-100)]" />
          <span className="text-base md:text-lg font-medium">{address}</span>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline bg-white/10 text-white hover:bg-white/20"
            aria-label="Abrir ubicación en Google Maps"
          >
            Abrir en Google Maps
          </Link>
        </div>
      </div>
    </section>
  );
}
