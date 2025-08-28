// src/components/gallery-grid.tsx
"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type Item = { 
  id: number | string; 
  src: string; 
  alt: string; 
  span?: string; 
  category?: string 
}

export function GalleryGrid({ items }: { items: Item[] }) {
  return (
    <div className="w-full overflow-hidden">
      <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <li 
            key={item.id} 
            className={cn(
              "group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-xl",
              item.span && "sm:col-span-2"
            )}
          >
            <div className="relative aspect-[4/3] sm:aspect-video w-full h-full">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                priority={i < 3}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
              />
              
              {/* Overlay con gradiente y texto */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-bold text-white mb-1">{item.alt}</h3>
                  
                </div>
              </div>
              
              {/* Etiqueta de categoría */}
              <span className="absolute top-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                {item.category || 'Nuevo'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
