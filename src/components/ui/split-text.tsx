"use client"
import { useEffect } from "react"
import SplitType from "split-type"
import { useGsap } from "@/lib/gsap"

interface SplitTextOnceProps {
  selector?: string
}

export function SplitTextOnce({ 
  selector = ".split"
}: SplitTextOnceProps) {
  const gsap = useGsap()
  
  useEffect(() => {
    // Solo en el cliente
    if (typeof document === "undefined") return
    
    try {
      // Verificar si hay elementos que coincidan con el selector
      const elements = document.querySelectorAll(selector)
      if (elements.length === 0) {
        console.warn(`No se encontraron elementos con el selector: ${selector}`)
        return
      }

      // Aplicar SplitType
      const split = new SplitType(selector, { 
        types: "words,chars",
        tagName: 'span'
      })

      // Configurar animación
      const chars = document.querySelectorAll(`${selector} .char`)
      
      if (chars.length > 0) {
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
          onComplete: () => {
            // Limpiar estilos inline después de la animación
            chars.forEach(char => {
              gsap.set(char, { clearProps: "all" })
            })
          }
        })
        
        tl.from(chars, { 
          y: 18, 
          opacity: 0, 
          stagger: 0.015, 
          duration: 0.55,
          ease: "power2.out"
        })
      }

      // Limpieza
      return () => {
        try {
          if (split?.revert) split.revert()
        } catch (error) {
          console.error("Error al limpiar SplitType:", error)
        }
      }
    } catch (error) {
      console.error("Error en SplitTextOnce:", error)
    }
  }, [gsap, selector])

  return null
}
