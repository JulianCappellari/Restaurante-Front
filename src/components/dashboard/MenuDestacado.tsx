"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

type MenuItemProps = {
  title: string
  description: string
  price: number
  image: string
  currency?: string
  featured?: boolean
  category?: string
  className?: string
}

export default function MenuDestacado({
  title,
  description,
  price,
  image = "/Fondo-restaurante.jpg",
  currency = "ARS",
  featured = false,
  category,
  className
}: MenuItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    // Navigate to menu section or item detail
    if (category) {
      router.push(`/menu#${category.toLowerCase()}`)
    } else {
      router.push(`/menu`)
    }
  }

  return (
    <div 
      className={cn(
        "relative w-full max-w-xs h-[400px] group perspective-1000 cursor-pointer",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* 3D effect background card */}
      <div 
        className={cn(
          "absolute inset-0 bg-primario-300 rounded-xl shadow-2xl transition-all duration-500",
          isHovered ? "rotate-6" : "rotate-3"
        )}
        aria-hidden="true"
      />
      
      {/* Main card */}
      <div className="relative h-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1">
        {/* Featured badge */}
        {featured && (
          <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full z-10">
            Destacado
          </div>
        )}
        
        {/* Image */}
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority
          />
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col h-[calc(100%-12rem)]">
          {category && (
            <span className="text-xs font-medium text-primario-600 mb-1">
              {category}
            </span>
          )}
          <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
            {description}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-lg font-bold text-primario-600">
              $ {price.toLocaleString('es-AR')}
            </span>
            <span className="text-sm text-gray-500 group-hover:text-primario-600 transition-colors">
              Ver más →
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}