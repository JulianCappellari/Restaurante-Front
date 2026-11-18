"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { A11y, Autoplay, EffectCoverflow, Keyboard, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useEffect, useState } from "react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

export type CarouselDish = { id: number; name: string; price: string; type: string; photo: string };

/* Carrusel de favoritos (Swiper): efecto coverflow, teclado y paginación. Sin autoplay si se pidió menos movimiento. */
export default function DishCarousel({ dishes }: { dishes: CarouselDish[] }) {
  const [calm, setCalm] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setCalm(query.matches);
    const update = () => setCalm(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <Swiper
      modules={[EffectCoverflow, Pagination, Autoplay, Keyboard, A11y]}
      effect={calm ? "slide" : "coverflow"}
      coverflowEffect={{ rotate: 18, stretch: 0, depth: 140, modifier: 1, slideShadows: false }}
      grabCursor
      centeredSlides
      loop={dishes.length > 4}
      keyboard={{ enabled: true }}
      pagination={{ clickable: true }}
      autoplay={calm ? false : { delay: 3800, disableOnInteraction: true, pauseOnMouseEnter: true }}
      slidesPerView={1.25}
      spaceBetween={16}
      breakpoints={{ 640: { slidesPerView: 2.2, spaceBetween: 20 }, 1024: { slidesPerView: 3.2, spaceBetween: 24 } }}
      a11y={{ prevSlideMessage: "Plato anterior", nextSlideMessage: "Plato siguiente", paginationBulletMessage: "Ir al plato {{index}}" }}
      className="dish-swiper !pb-12"
    >
      {dishes.map((dish) => (
        <SwiperSlide key={dish.id} className="!h-auto">
          <Link href={`/product/${dish.id}`} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-cliente-sage shadow-[0_18px_40px_-18px_rgba(23,51,109,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cliente-blue">
            <Image src={dish.photo} alt="" fill loading="eager" sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 80vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-cliente-blue backdrop-blur">{dish.type}</span>
            <span className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/25 bg-gradient-to-t from-cliente-blue/90 to-cliente-blue/55 p-4 text-white backdrop-blur-md">
              <span className="block text-2xl leading-tight">{dish.name}</span>
              <span className="mt-1 flex items-center justify-between text-sm font-semibold">
                <span className="tabular-nums">{dish.price}</span>
                <span className="inline-flex items-center gap-1">Ver plato <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </span>
            </span>
          </Link>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
