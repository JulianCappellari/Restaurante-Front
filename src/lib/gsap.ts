"use client"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

let registered = false

// Tipos personalizados para GSAP
declare global {
  interface Window {
    gsap: typeof gsap
    ScrollTrigger: typeof ScrollTrigger
  }
}

/**
 * Hook personalizado para usar GSAP con ScrollTrigger
 * @returns Instancia de GSAP con plugins registrados
 */
export function useGsap(): typeof gsap {
  try {
    // Solo en el cliente
    if (typeof window === "undefined") {
      return gsap
    }

    // Registrar plugins una sola vez
    if (!registered) {
      try {
        gsap.registerPlugin(ScrollTrigger)
        
        // Configuración global de GSAP para mejor rendimiento
        gsap.config({
          nullTargetWarn: false,
          autoSleep: 60, // Desactiva animaciones inactivas después de 60fps
          force3D: true, // Mejor rendimiento en transformaciones
        })
        
        // Hacer disponible globalmente para depuración
        if (process.env.NODE_ENV === 'development') {
          window.gsap = gsap
          window.ScrollTrigger = ScrollTrigger
        }
        
        registered = true
      } catch (error) {
        console.error("Error al registrar plugins de GSAP:", error)
      }
    }

    return gsap
  } catch (error) {
    console.error("Error en useGsap:", error)
    return gsap // Devolver GSAP aunque falle la configuración
  }
}
