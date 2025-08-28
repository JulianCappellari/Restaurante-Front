"use client"
import { useEffect } from "react"
import Lenis from "@studio-freight/lenis"
import { usePathname } from "next/navigation"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export function SmoothLenis() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined") return

    // registrar ScrollTrigger una vez
    if (!gsap.core.globals().ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger)
    }

    const lenis = new Lenis({
      duration: 0.9,          // libre, sin sensación de secciones
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      syncTouch: true,
      infinite: false,
      gestureOrientation: "vertical",
    })

    // GSAP <-> Lenis: un único “clock”
    lenis.on("scroll", ScrollTrigger.update)
    const update = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    // limpieza
    return () => {
      gsap.ticker.remove(update)
      lenis.destroy()
    }
  }, [pathname])

  return null
}
