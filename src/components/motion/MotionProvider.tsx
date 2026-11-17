"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { isCustomerRoute } from "@/lib/customer-routes";

gsap.registerPlugin(ScrollTrigger, SplitText);

/*
 * Sistema de motion por atributos. Cualquier página del cliente puede usar:
 *   data-split          titular que entra por líneas con máscara
 *   data-reveal         aparición (up | left | right | scale | fade) agrupada con ScrollTrigger.batch
 *   data-reveal="clip"  imagen que se abre con clip-path mientras se desplaza (scrub)
 *   data-stagger        contenedor cuyos hijos entran en cascada
 *   data-parallax="0.12" desplazamiento vertical relativo al scroll
 *   data-zoom           imagen que se acerca suavemente con el scroll
 *   data-scrub-words    párrafo que se enciende palabra por palabra
 *   data-pin-steps      relato fijado con pasos, snap y cambio de imagen (escritorio)
 *   data-hscroll        galería horizontal fijada con animaciones internas (containerAnimation)
 * Con movimiento reducido no se aplica nada y el contenido queda estático y completo.
 */

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const PIN_OK = "(min-width: 960px) and (min-height: 680px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

const revealFrom: Record<string, gsap.TweenVars> = {
  up: { y: 44 },
  left: { x: -56 },
  right: { x: 56 },
  scale: { scale: 0.92 },
  fade: {},
};

export default function MotionProvider() {
  const pathname = usePathname();
  const customer = isCustomerRoute(pathname);
  const progressRef = useRef<HTMLDivElement>(null);
  const [pinKey, setPinKey] = useState(0);

  // Recalcular cuando se cruza el umbral de escritorio (fijar o soltar secciones).
  useEffect(() => {
    const query = window.matchMedia(PIN_OK);
    const onChange = () => setPinKey((value) => value + 1);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Barra superior que cambia al desplazarse: sombra y fondo translúcido.
  useEffect(() => {
    if (!customer) return;
    const nav = document.querySelector<HTMLElement>('nav[aria-label="Navegación principal"]');
    if (!nav) return;
    nav.dataset.scrolled = String(window.scrollY > 8);
    const trigger = ScrollTrigger.create({
      start: 8,
      end: "max",
      onToggle: (self) => { nav.dataset.scrolled = String(self.isActive); },
    });
    return () => {
      trigger.kill();
      delete nav.dataset.scrolled;
    };
  }, [customer, pathname]);

  useEffect(() => {
    if (!customer || !window.matchMedia(MOTION_OK).matches) return;

    const root = document.getElementById("contenido-principal") ?? document.body;
    const pinOk = window.matchMedia(PIN_OK).matches;
    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {});
    let disposed = false;
    let scheduled = 0;

    // Nunca tocar un nodo que React todavía no hidrató (p. ej. dentro de un Suspense):
    // SplitText cambia la estructura y React lo tomaría como un desajuste con el servidor.
    // React marca cada nodo hidratado con una propiedad interna "__reactFiber$…".
    let waitingHydration = false;
    let retries = 0;
    const hydrated = (element: HTMLElement) => Object.keys(element).some((key) => key.startsWith("__reactFiber"));
    const pending = (selector: string) =>
      [...root.querySelectorAll<HTMLElement>(selector)].filter((element) => {
        if (element.dataset.motionDone !== undefined) return false;
        if (!hydrated(element)) { waitingHydration = true; return false; }
        return true;
      });
    const mark = (element: HTMLElement) => { element.dataset.motionDone = ""; };

    const enhance = () => {
      if (disposed) return;
      let created = 0;
      waitingHydration = false;

      ctx.add(() => {
        // Progreso de lectura (no en la portada, que tiene el suyo).
        if (pathname !== "/" && progressRef.current && progressRef.current.dataset.motionDone === undefined) {
          mark(progressRef.current);
          gsap.fromTo(progressRef.current, { scaleX: 0 }, {
            scaleX: 1, ease: "none",
            scrollTrigger: { start: 0, end: "max", scrub: true },
          });
        }

        pending("[data-split]").forEach((element) => {
          mark(element); created++;
          const split = new SplitText(element, { type: "lines", mask: "lines", linesClass: "motion-line" });
          splits.push(split);
          gsap.from(split.lines, {
            yPercent: 110, duration: 1.05, ease: "expo.out", stagger: 0.08,
            scrollTrigger: { trigger: element, start: "top 90%", once: true },
          });
        });

        pending('[data-reveal="clip"]').forEach((element) => {
          mark(element); created++;
          gsap.fromTo(element,
            { clipPath: "inset(14% 10% 14% 10% round 1.5rem)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 1.25rem)", ease: "none",
              scrollTrigger: { trigger: element, start: "top 92%", end: "top 40%", scrub: 0.6 },
            });
        });

        const reveals = pending("[data-reveal]");
        if (reveals.length) {
          reveals.forEach((element) => {
            mark(element); created++;
            gsap.set(element, { opacity: 0, ...(revealFrom[element.dataset.reveal || "up"] ?? revealFrom.up) });
          });
          ScrollTrigger.batch(reveals, {
            start: "top 90%",
            once: true,
            onEnter: (batch) => gsap.to(batch, {
              opacity: 1, x: 0, y: 0, scale: 1, duration: 0.95, ease: "expo.out", stagger: 0.08, overwrite: true,
            }),
          });
        }

        pending("[data-stagger]").forEach((container) => {
          mark(container); created++;
          gsap.from([...container.children], {
            y: 36, opacity: 0, duration: 0.85, ease: "expo.out", stagger: 0.09,
            scrollTrigger: { trigger: container, start: "top 86%", once: true },
          });
        });

        pending("[data-parallax]").forEach((element) => {
          mark(element); created++;
          const amount = Number.parseFloat(element.dataset.parallax || "0.12") * 100;
          gsap.fromTo(element, { yPercent: -amount }, {
            yPercent: amount, ease: "none",
            scrollTrigger: { trigger: element.parentElement ?? element, start: "top bottom", end: "bottom top", scrub: true },
          });
        });

        pending("[data-zoom]").forEach((element) => {
          mark(element); created++;
          gsap.fromTo(element, { scale: 1.16 }, {
            scale: 1, ease: "none",
            scrollTrigger: { trigger: element.parentElement ?? element, start: "top bottom", end: "bottom top", scrub: 0.5 },
          });
        });

        pending("[data-scrub-words]").forEach((element) => {
          mark(element); created++;
          const split = new SplitText(element, { type: "words" });
          splits.push(split);
          gsap.timeline({
            scrollTrigger: { trigger: element, start: "top 80%", end: "bottom 55%", scrub: 0.5 },
          }).fromTo(split.words, { opacity: 0.15 }, { opacity: 1, duration: 0.4, ease: "none", stagger: { amount: 0.6 } });
        });

        pending("[data-pin-steps]").forEach((section) => {
          mark(section); created++;
          if (!pinOk) return;
          const steps = [...section.querySelectorAll<HTMLElement>("[data-step]")];
          const media = [...section.querySelectorAll<HTMLElement>("[data-step-media]")];
          const stage = section.querySelector<HTMLElement>("[data-pin-stage]") ?? section;
          if (steps.length < 2) return;
          section.dataset.pinned = "";
          steps[0].dataset.active = "";
          const last = steps.length - 1;
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: stage, pin: stage, start: "top top+=88",
              end: () => `+=${window.innerHeight * last * 0.85}`,
              scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true, fastScrollEnd: true,
              snap: { snapTo: 1 / last, duration: { min: 0.2, max: 0.5 }, ease: "power2.inOut" },
              onUpdate: (self) => {
                const active = Math.round(self.progress * last);
                steps.forEach((step, index) => {
                  if (index === active) step.dataset.active = "";
                  else delete step.dataset.active;
                });
              },
            },
          });
          media.forEach((item, index) => {
            if (index === 0) return;
            timeline.fromTo(item, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", duration: 1 }, index - 1);
            const image = item.querySelector("img");
            if (image) timeline.fromTo(image, { scale: 1.2 }, { scale: 1, ease: "none", duration: 1 }, index - 1);
          });
        });

        pending("[data-hscroll]").forEach((section) => {
          mark(section); created++;
          if (!pinOk) return;
          const track = section.querySelector<HTMLElement>("[data-hscroll-track]");
          if (!track) return;
          section.dataset.pinned = "";
          const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
          const horizontal = gsap.to(track, {
            x: () => -distance(), ease: "none",
            scrollTrigger: {
              trigger: section, pin: true, start: "top top+=88", end: () => `+=${distance()}`,
              scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
            },
          });
          track.querySelectorAll<HTMLElement>("[data-hscroll-item]").forEach((item) => {
            gsap.fromTo(item, { opacity: 0.35, scale: 0.9 }, {
              opacity: 1, scale: 1, ease: "none",
              scrollTrigger: { trigger: item, containerAnimation: horizontal, start: "left 98%", end: "left 60%", scrub: true },
            });
            const image = item.querySelector("img");
            if (image) {
              gsap.fromTo(image, { xPercent: -7, scale: 1.18 }, {
                xPercent: 7, scale: 1.18, ease: "none",
                scrollTrigger: { trigger: item, containerAnimation: horizontal, start: "left right", end: "right left", scrub: true },
              });
            }
          });
        });
      });

      if (created) {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      }
      // La hidratación no agrega nodos (el observer no la ve): reintentar unas veces.
      if (waitingHydration && retries < 40) {
        retries++;
        window.setTimeout(enhance, 150);
      }
    };

    const schedule = () => {
      window.clearTimeout(scheduled);
      scheduled = window.setTimeout(enhance, 120);
    };

    // El contenido que llega después (carta, cuenta) también se anima.
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length)) schedule();
    });
    void document.fonts.ready.then(() => {
      if (disposed) return;
      enhance();
      observer.observe(root, { childList: true, subtree: true });
      // Una vez terminada la transición de entrada, recalcular medidas.
      window.setTimeout(() => { if (!disposed) ScrollTrigger.refresh(); }, 650);
    });

    return () => {
      disposed = true;
      window.clearTimeout(scheduled);
      observer.disconnect();
      splits.forEach((split) => split.revert());
      ctx.revert();
      if (progressRef.current) delete progressRef.current.dataset.motionDone;
      root.querySelectorAll<HTMLElement>("[data-motion-done]").forEach((element) => {
        delete element.dataset.motionDone;
        delete element.dataset.pinned;
      });
    };
  }, [customer, pathname, pinKey]);

  if (!customer || pathname === "/") return null;
  return <div ref={progressRef} className="page-progress" aria-hidden="true" />;
}
