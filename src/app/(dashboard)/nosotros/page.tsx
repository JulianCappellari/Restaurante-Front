import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, QrCode, Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "Nosotros | Restaurante App",
  description: "Pedí online, reservá tu mesa o pedí desde el salón con el QR de tu visita.",
};

const ways = [
  {
    title: "Pedido online",
    text: "Elegí tus platos, personalizalos y recibí el pedido donde estés.",
    href: "/menu",
    cta: "Ver la carta",
    icon: Truck,
    photo: "/fotos/17-delivery-empaque.webp",
    alt: "Pedido empaquetado listo para el envío",
  },
  {
    title: "Reserva",
    text: "Consultá los turnos disponibles y asegurá tu mesa antes de venir.",
    href: "/reserva",
    cta: "Reservar mesa",
    icon: CalendarDays,
    photo: "/fotos/19-reservas-mesa-detalle.webp",
    alt: "Mesa puesta para una reserva",
  },
  {
    title: "Pedido en la mesa",
    text: "Escaneá el QR de tu visita, mandá el pedido a cocina y llamá al mozo cuando quieras.",
    href: "/#en-el-salon",
    cta: "Cómo funciona",
    icon: QrCode,
    photo: "/fotos/18-servicio-en-mesa.webp",
    alt: "Mozo sirviendo platos en la mesa",
  },
];

const gallery = [
  { photo: "/fotos/05-salon-reservas.webp", caption: "El salón" },
  { photo: "/fotos/16-cocina-pasta-artesanal.webp", caption: "Pasta hecha en la cocina" },
  { photo: "/fotos/20-portada-mesa-compartida.webp", caption: "Platos para compartir" },
  { photo: "/fotos/08-ravioles-ricota-espinaca.webp", caption: "Ravioles de ricota" },
  { photo: "/fotos/14-flan-mixto.webp", caption: "Flan mixto" },
];

export default function AboutPage() {
  return (
    <div className="bg-cliente-paper">
      {/* 1. Portada a pantalla completa */}
      <section data-customer-inverse className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-cliente-blue text-white">
        <div data-zoom className="absolute inset-0 -z-20">
          <Image src="/fotos/16-cocina-pasta-artesanal.webp" alt="" fill priority sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0e1833] via-[#0e1833]/55 to-[#0e1833]/10" aria-hidden="true" />
        <div className="customer-shell pb-12 pt-32 sm:pb-16">
          <p data-reveal="fade" className="text-sm font-semibold text-blue-100">Nosotros</p>
          <h1 data-split className="mt-2 max-w-[14ch] text-balance text-5xl leading-[0.95] sm:text-7xl lg:text-8xl">
            Cocina de barrio, a tu manera
          </h1>
          <p data-reveal="up" className="mt-5 max-w-[46ch] text-base leading-7 text-blue-100 sm:text-lg">
            Pedí desde tu casa, reservá antes de venir o pedí desde la mesa cuando ya estás en el salón.
          </p>
        </div>
      </section>

      {/* 2. Frase que se enciende al leer */}
      <section className="py-20 sm:py-28">
        <div className="customer-shell">
          <p data-scrub-words className="max-w-[24ch] font-display text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-cliente-ink">
            Cada plato sale de cocina cuando está listo, y vos elegís cuándo pedir, cuándo venir y cómo seguir tu pedido.
          </p>
        </div>
      </section>

      {/* 3. Relato fijado: tres formas de vivir el restaurante */}
      <section data-pin-steps aria-labelledby="formas" className="bg-cliente-sage py-16 sm:py-20">
        <div data-pin-stage className="customer-shell grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
          <div>
            <h2 id="formas" data-split className="max-w-[14ch] text-4xl leading-none sm:text-6xl">Tres formas de disfrutar la carta</h2>
            <ol className="mt-8 space-y-6">
              {ways.map(({ title, text, href, cta, icon: Icon, photo, alt }) => (
                <li key={title} data-step className="border-t border-cliente-ink/20 pt-5">
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cliente-blue text-white"><Icon aria-hidden="true" className="size-5" /></span>
                    <div>
                      <h3 className="text-2xl leading-tight">{title}</h3>
                      <p className="mt-1.5 max-w-[42ch] leading-7 text-cliente-muted">{text}</p>
                      <Link href={href} className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-cliente-blue underline underline-offset-4">
                        {cta} <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                    </div>
                  </div>
                  <figure data-step-inline data-reveal="clip" className="relative mt-5 aspect-[16/10] overflow-hidden rounded-2xl">
                    <Image src={photo} alt={alt} fill sizes="(min-width: 960px) 46vw, 92vw" className="object-cover" />
                  </figure>
                </li>
              ))}
            </ol>
          </div>
          <div data-step-stack className="relative aspect-[4/5] max-h-[78svh] overflow-hidden rounded-3xl bg-cliente-blue">
            {ways.map(({ photo, alt }, index) => (
              <figure key={photo} data-step-media className="absolute inset-0" style={{ zIndex: index }}>
                <Image src={photo} alt={alt} fill sizes="(min-width: 960px) 46vw, 92vw" className="object-cover" />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Galería horizontal fijada */}
      <section data-hscroll aria-labelledby="galeria" className="py-16 sm:py-20">
        <div className="customer-shell mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 id="galeria" data-split className="text-4xl leading-none sm:text-6xl">Pasá a ver</h2>
          <p data-reveal="fade" className="text-sm text-cliente-muted">Fotos ilustrativas del salón y la cocina.</p>
        </div>
        <ul data-hscroll-track className="m-0 list-none">
          {gallery.map(({ photo, caption }) => (
            <li key={photo} data-hscroll-item className="w-[min(82vw,30rem)]">
              <figure className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-cliente-sage">
                <Image src={photo} alt={caption} fill sizes="(min-width: 960px) 480px, 82vw" className="object-cover" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16 text-lg font-semibold text-white">
                  {caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. Cierre */}
      <section className="relative overflow-hidden bg-cliente-butter py-16 sm:py-24">
        <div className="customer-shell grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div>
            <h2 data-split className="max-w-[12ch] text-5xl leading-[0.95] text-cliente-ink sm:text-7xl">¿Te esperamos?</h2>
            <div data-stagger className="mt-8 flex flex-wrap gap-3">
              <Link href="/reserva" className="customer-press inline-flex min-h-12 items-center gap-2 rounded-xl bg-cliente-blue px-5 font-semibold text-white">
                Reservar mesa <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/menu" className="customer-press inline-flex min-h-12 items-center rounded-xl border border-cliente-ink/30 px-5 font-semibold text-cliente-ink hover:bg-white/50">
                Ver la carta
              </Link>
            </div>
          </div>
          <figure data-reveal="scale" className="relative aspect-square overflow-hidden rounded-3xl">
            <div data-parallax="0.08" className="absolute -inset-[10%]">
              <Image src="/fotos/15-helado-artesanal.webp" alt="Helado artesanal" fill sizes="(min-width: 768px) 352px, 92vw" className="object-cover" />
            </div>
          </figure>
        </div>
      </section>
    </div>
  );
}
