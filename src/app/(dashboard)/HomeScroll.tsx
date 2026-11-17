"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin, SplitText);

// Las mismas condiciones se repiten en home.module.css: el carril horizontal solo existe
// cuando el JS lo fija, así que ambas reglas deben coincidir.
const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const DESKTOP_PINNED = "(min-width: 960px) and (min-height: 680px) and (pointer: fine)";

export default function HomeScroll() {
  useGSAP(() => {
    const home = document.getElementById("contenido-portada");
    if (!home) return;

    const q = <T extends HTMLElement = HTMLElement>(selector: string) => home.querySelector<T>(selector);
    const hero = q("[data-home-hero]");
    const title = q<HTMLElement>("[data-hero-title]");
    const heroCopy = q<HTMLElement>("[data-hero-copy]");
    const heroActions = q<HTMLElement>("[data-hero-actions]");
    const figure = q<HTMLElement>("[data-hero-figure]");
    const crop = q<HTMLElement>("[data-hero-crop]");
    const intro = q<HTMLElement>("[data-home-intro]");
    const introText = q<HTMLElement>("[data-scrub-text]");
    const categories = q<HTMLElement>("[data-home-categories]");
    const track = q<HTMLElement>("[data-h-track]");
    const categoryEntries = [...home.querySelectorAll<HTMLElement>("[data-category-entry]")];
    const dining = q<HTMLElement>("[data-home-dining]");
    const stage = q<HTMLElement>("[data-dining-stage]");
    const scene = stage?.querySelector<HTMLImageElement>("img");
    const screens = [...home.querySelectorAll<HTMLElement>("[data-dining-screen]")];
    const steps = [...home.querySelectorAll<HTMLElement>("[data-dining-step]")];
    const booking = q<HTMLElement>("[data-home-booking]");
    const bookingTitle = q<HTMLElement>("[data-booking-title]");
    const magnet = q<HTMLElement>("[data-magnet]");
    const progress = q<HTMLElement>("[data-home-progress]");
    if (!hero || !title || !heroCopy || !heroActions || !figure || !crop || !intro || !introText || !categories || !track
      || !dining || !stage || !scene || !booking || !bookingTitle || !progress) return;

    const nav = document.querySelector<HTMLElement>('nav[aria-label="Navegación principal"]');
    const navHeight = () => nav?.offsetHeight ?? 0;
    const media = gsap.matchMedia();
    let heroSplit: SplitText | undefined;
    let introSplit: SplitText | undefined;
    let disposed = false;

    media.add(MOTION_OK, () => {
      // 1. Entrada de portada: la foto se abre desde un recorte y los textos suben en cascada.
      gsap.timeline({ defaults: { ease: "expo.out" } })
        .fromTo(figure, { clipPath: "inset(14% 9% 14% 9% round 1.6rem)", opacity: 0.35 },
          { clipPath: "inset(0% 0% 0% 0% round 0.95rem)", opacity: 1, duration: 1.3, clearProps: "clipPath,opacity" }, 0)
        .fromTo([heroCopy, heroActions], { y: 26, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.85, stagger: 0.12, clearProps: "transform,opacity" }, 0.2);

      // Titular dividido en líneas con máscara; se anima cuando la tipografía está lista.
      void document.fonts.ready.then(() => {
        if (disposed) return;
        heroSplit = new SplitText(title, { type: "lines", mask: "lines", linesClass: "home-line" });
        gsap.fromTo(heroSplit.lines, { yPercent: 105 }, {
          yPercent: 0, duration: 0.95, stagger: 0.09, ease: "expo.out", clearProps: "transform",
        });
        ScrollTrigger.refresh();
      });

      // 2. Acercamiento de la foto mientras se recorre la portada.
      gsap.to(crop, {
        scale: 1.16, yPercent: 4, ease: "none",
        scrollTrigger: {
          id: "home-closeup", trigger: hero, start: () => `top top+=${navHeight()}`,
          end: () => `bottom top+=${navHeight()}`, scrub: 0.45, invalidateOnRefresh: true,
        },
      });

      // 3. Texto que se enciende palabra por palabra al leerse.
      introSplit = new SplitText(introText, { type: "words" });
      gsap.timeline({
        scrollTrigger: {
          id: "home-intro", trigger: intro, start: "top 72%", end: "bottom 60%", scrub: 0.5,
        },
      }).fromTo(introSplit.words, { opacity: 0.16 }, {
        opacity: 1, duration: 0.4, ease: "none", stagger: { amount: 0.6 },
      });

      // 4. Aparición de la carta (vista móvil y de escritorio con movimiento reducido).
      gsap.fromTo(categoryEntries, { y: 14, opacity: 0.72 }, {
        y: 0, opacity: 1, duration: 0.42, stagger: 0.08, ease: "power3.out", clearProps: "transform,opacity",
        scrollTrigger: { id: "home-menu", trigger: categories, start: "top 84%", once: true },
      });

      gsap.fromTo(bookingTitle, { y: 18, opacity: 0.7 }, {
        y: 0, opacity: 1, duration: 0.6, ease: "power3.out", clearProps: "transform,opacity",
        scrollTrigger: { id: "home-booking", trigger: booking, start: "top 88%", once: true },
      });

      // 5. Progreso de lectura en la parte superior.
      gsap.fromTo(progress, { scaleX: 0 }, {
        scaleX: 1, ease: "none",
        scrollTrigger: { id: "home-progress", trigger: home, start: "top top", end: "bottom bottom", scrub: true, refreshPriority: -1 },
      });

    });

    // Escena de movimiento: parallax suave en móvil, tablet y pantallas sin puntero preciso.
    const COMPACT_OR_TOUCH = `${MOTION_OK} and (max-width: 959px), ${MOTION_OK} and (max-height: 679px), ${MOTION_OK} and (pointer: coarse)`;
    media.add(COMPACT_OR_TOUCH, () => {
      gsap.fromTo(scene, { scale: 1.07 }, {
        scale: 1.16, yPercent: -2, ease: "none",
        scrollTrigger: { id: "home-dining-mobile", trigger: dining, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // 6. Carta horizontal fijada: las categorías se recorren con la rueda en escritorio.
    media.add(`${MOTION_OK} and ${DESKTOP_PINNED}`, () => {
      categories.dataset.hPinned = "";
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const horizontal = gsap.to(track, {
        x: () => -distance(), ease: "none",
        scrollTrigger: {
          id: "home-categories-h", trigger: categories, start: () => `top top+=${navHeight()}`,
          // Recorrido más largo que la distancia real: el carril avanza con calma.
          end: () => `+=${Math.max(distance() * 1.6, window.innerHeight * 0.6)}`,
          pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
        },
      });

      // containerAnimation: cada tarjeta reacciona a su posición dentro del carril horizontal.
      categoryEntries.forEach((entry) => {
        const photo = entry.querySelector("img");
        const content = entry.querySelector<HTMLElement>("h3, p")?.parentElement;
        if (photo) {
          gsap.fromTo(photo, { xPercent: -6, scale: 1.14 }, {
            xPercent: 6, scale: 1.14, ease: "none",
            scrollTrigger: { trigger: entry, containerAnimation: horizontal, start: "left right", end: "right left", scrub: true },
          });
        }
        if (content) {
          gsap.fromTo(content, { y: 28, opacity: 0.4 }, {
            y: 0, opacity: 1, ease: "none",
            scrollTrigger: { trigger: entry, containerAnimation: horizontal, start: "left 100%", end: "left 65%", scrub: true },
          });
        }
      });
      return () => { delete categories.dataset.hPinned; };
    });

    // 7. Botón magnético: sigue al puntero con un retraso breve (solo con mouse).
    media.add(`${MOTION_OK} and (pointer: fine)`, () => {
      if (!magnet) return;
      const xTo = gsap.quickTo(magnet, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = gsap.quickTo(magnet, "y", { duration: 0.5, ease: "power3.out" });
      const move = (event: PointerEvent) => {
        const rect = magnet.getBoundingClientRect();
        xTo((event.clientX - rect.left - rect.width / 2) * 0.22);
        yTo((event.clientY - rect.top - rect.height / 2) * 0.28);
      };
      const leave = () => { xTo(0); yTo(0); };
      magnet.addEventListener("pointermove", move);
      magnet.addEventListener("pointerleave", leave);
      return () => {
        magnet.removeEventListener("pointermove", move);
        magnet.removeEventListener("pointerleave", leave);
        gsap.set(magnet, { clearProps: "transform" });
      };
    });

    // 8. Mesa: escena fijada con tres pasos sincronizados con la rueda (escritorio con puntero).
    const diningPinned = `${MOTION_OK} and ${DESKTOP_PINNED}`;
    media.add(diningPinned, () => {
      let wheelDirection = 0;
      let settling: gsap.core.Tween | undefined;
      const resetInput = () => {
        wheelDirection = 0;
        settling?.kill();
        settling = undefined;
      };

      home.dataset.diningMotion = "pinned";
      let activeStep = -1;
      const stops = [0, 0.5, 1] as const;
      const snap = ScrollTrigger.snapDirectional([...stops]);
      const timeline = gsap.timeline({
        onUpdate() {
          const next = Math.round(this.progress() * (steps.length - 1));
          if (next === activeStep) return;
          steps[activeStep]?.removeAttribute("data-current");
          steps[next]?.setAttribute("data-current", "");
          activeStep = next;
        },
        scrollTrigger: {
          id: "home-dining", trigger: dining, pin: stage,
          start: () => `top top+=${navHeight()}`,
          end: () => `+=${stage.offsetHeight * 1.12}`,
          pinSpacing: true, anticipatePin: 1, scrub: 0.42, invalidateOnRefresh: true,
          onLeave: resetInput, onLeaveBack: resetInput,
        },
      });

      gsap.set(screens.slice(1), { autoAlpha: 0, yPercent: 14 });
      timeline
        .addLabel("carta", stops[0])
        .addLabel("pedido", stops[1])
        .addLabel("seguimiento", stops[2])
        .fromTo(scene, { scale: 1.08 }, { scale: 1.22, xPercent: -4, duration: 1, ease: "none" }, 0)
        .to(screens[0], { autoAlpha: 0, yPercent: -10, duration: 0.18, ease: "none" }, 0.15)
        .fromTo(screens[1], { autoAlpha: 0, yPercent: 14 }, { autoAlpha: 1, yPercent: 0, duration: 0.18, ease: "none", immediateRender: false }, 0.22)
        .to(screens[1], { autoAlpha: 0, yPercent: -10, duration: 0.18, ease: "none" }, 0.65)
        .fromTo(screens[2], { autoAlpha: 0, yPercent: 14 }, { autoAlpha: 1, yPercent: 0, duration: 0.18, ease: "none", immediateRender: false }, 0.72);
      steps[0]?.setAttribute("data-current", "");

      const trigger = timeline.scrollTrigger;
      const trackWheel = (event: WheelEvent) => {
        resetInput();
        if (!event.ctrlKey && trigger?.isActive) wheelDirection = Math.sign(event.deltaY);
      };
      const settleChapter = () => {
        const direction = wheelDirection;
        wheelDirection = 0;
        if (!direction || !trigger?.isActive || stage.contains(document.activeElement)) return;
        const target = snap(trigger.progress, direction);
        if (Math.abs(target - trigger.progress) > 0.36) return;
        const destination = trigger.start + (trigger.end - trigger.start) * target;
        if (Math.abs(destination - window.scrollY) < 3) return;
        settling = gsap.to(window, {
          duration: 0.28, ease: "power2.out",
          scrollTo: { y: destination, autoKill: true },
          onComplete: () => { settling = undefined; },
        });
      };

      window.addEventListener("wheel", trackWheel, { passive: true });
      window.addEventListener("keydown", resetInput);
      window.addEventListener("pointerdown", resetInput, { passive: true });
      ScrollTrigger.addEventListener("scrollEnd", settleChapter);

      return () => {
        resetInput();
        ScrollTrigger.removeEventListener("scrollEnd", settleChapter);
        window.removeEventListener("wheel", trackWheel);
        window.removeEventListener("keydown", resetInput);
        window.removeEventListener("pointerdown", resetInput);
        delete home.dataset.diningMotion;
        steps.forEach((step) => step.removeAttribute("data-current"));
      };
    });

    return () => {
      disposed = true;
      heroSplit?.revert();
      introSplit?.revert();
      media.revert();
    };
  }, []);

  return null;
}
