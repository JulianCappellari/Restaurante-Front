"use client"

import { useEffect, useRef } from "react"
import { useGsap } from "@/lib/gsap"

type SectionAnimatorProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  yOffset?: number
  duration?: number
}

export function SectionAnimator({
  children,
  className = "",
  delay = 0,
  yOffset = 30,
  duration = 0.8,
}: SectionAnimatorProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const gsap = useGsap()
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!sectionRef.current || !gsap || hasAnimated.current) return

    const element = sectionRef.current
    
    // Configuración inicial
    gsap.set(element, { opacity: 0, y: yOffset })
    
    // Usar IntersectionObserver para detectar cuando el elemento es visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          
          // Animación suave al entrar
          gsap.to(element, {
            y: 0,
            opacity: 1,
            duration: duration,
            delay: delay,
            ease: "power2.out",
            onComplete: () => {
              // Limpiar estilos después de la animación
              gsap.set(element, { clearProps: "opacity,transform" })
            }
          })
        }
      })
    }, {
      threshold: 0.1 // Disparar cuando al menos el 10% del elemento sea visible
    })
    
    observer.observe(element)
    
    return () => {
      observer.disconnect()
      hasAnimated.current = false
    }
  }, [gsap, delay, yOffset, duration])

  return (
    <div ref={sectionRef} className={`section-animator ${className}`}>
      {children}
    </div>
  )
}
