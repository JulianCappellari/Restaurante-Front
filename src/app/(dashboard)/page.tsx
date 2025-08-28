import { GalleryGrid, InfiniteMovingCardsDemo, LayoutGridDemo } from "@/components";
import LocationSection from "@/components/dashboard/LocationSection";
import MenuDestacado from "@/components/dashboard/MenuDestacado";
import Image from "next/image";
import Link from "next/link";

const galleryItems = [
  { 
    id: 1, 
    src: "/Fondo-restaurante.jpg", 
    alt: "Salón principal", 
    span: "sm:col-span-2",
    category: "Ambiente"
  },
  { 
    id: 2, 
    src: "/Fondo-restaurante.jpg", 
    alt: "Plato de la casa",
    category: "Especialidad"
  },
  { 
    id: 3, 
    src: "/Fondo-restaurante.jpg", 
    alt: "Mesa preparada",
    category: "Eventos"
  },
  { 
    id: 4, 
    src: "/Fondo-restaurante.jpg", 
    alt: "Sector barra", 
    span: "sm:col-span-2 lg:col-span-1",
    category: "Barra"
  },
  { 
    id: 5, 
    src: "/Fondo-restaurante.jpg", 
    alt: "Postre del chef",
    category: "Postres"
  },
  { 
    id: 6, 
    src: "/Fondo-restaurante.jpg", 
    alt: "Terraza exterior",
    category: "Terraza"
  }
]

export default function Page() {
  return (
    <main id="main" className="overflow-hidden">
      {/* HERO */}
      <section aria-labelledby="hero-heading" className="relative isolate min-h-[80svh]">
        <Image
          src="/Fondo-restaurante.jpg"
          alt="Ambiente del restaurante"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 flex min-h-[80svh] items-center">
          <div className="container text-center text-white">
            <h1 id="hero-heading" className="text-4xl font-bold sm:text-5xl md:text-6xl">
              Bienvenidos a Restaurante App
            </h1>
            <p className="mt-4 text-lg sm:text-xl/relaxed opacity-90">
              Explora todo lo que tenemos para tentar a tu paladar
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/reserva" className="px-4 py-2 text-lg font-semibold text-white bg-primario-500 rounded hover:bg-primario-700 transition">
                Reservar mesa
              </Link>
              <Link href="/menu" className="px-4 py-2 text-lg font-semibold text-white bg-secundario-600 rounded hover:bg-secundario-700 transition">
                Hacer un pedido
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section aria-labelledby="about-heading" className="bg-muted py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="about-heading" className="text-3xl font-bold sm:text-4xl">
              Sobre nosotros
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              En Restaurante App nos enfocamos en una experiencia culinaria memorable. Cada plato se elabora con
              ingredientes frescos y de calidad. Buscamos sabor, consistencia y servicio ágil.
            </p>
          </div>
        </div>
      </section>

      {/* GALERÍA */}
      <section aria-labelledby="gallery-heading" className="bg-background py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="gallery-heading" className="text-3xl font-bold sm:text-4xl">Galería</h2>
          <p className="mt-3 text-muted-foreground">Ambiente, platos y momentos en nuestro restaurante.</p>
        </div>

        <div className="mt-10">
          <GalleryGrid items={galleryItems} />
        </div>
      </div>
    </section>

      {/* MENÚ DESTACADO */}
      <section className="py-20 bg-white min-h-[750px]">
        <div className="container mx-auto text-center flex flex-col justify-between">
          <h2 className="text-4xl font-bold text-primario-500  ">
            Menú Destacado
          </h2>
          <div className="border-b-2 border-black mb-16 mt-4 w-full flex justify-center items-center"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 items-center justify-center px-4">
            <MenuDestacado 
              title="Pizza Margherita"
              description="Clásica pizza italiana con salsa de tomate, mozzarella fresca, albahaca y aceite de oliva."
              price={4500}
              image="/Fondo-restaurante.jpg"
              category="Pizzas"
              featured={true}
            />
            <MenuDestacado 
              title="Milanesa Napolitana"
              description="Milanesa de carne con salsa de tomate, jamón y queso gratinado. Acompañada de puré de papas."
              price={3800}
              image="/Fondo-restaurante.jpg"
              category="Carnes"
            />
            <MenuDestacado 
              title="Ensalada César"
              description="Lechuga romana, crutones, queso parmesano y aderezo césar. Opción con pollo o vegetariana."
              price={3200}
              image="/Fondo-restaurante.jpg"
              category="Ensaladas"
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section aria-labelledby="reviews-heading" className="bg-muted py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="reviews-heading" className="text-3xl font-bold sm:text-4xl">
              Lo que dicen nuestros clientes
            </h2>
          </div>
          <div className="mt-10">
            <InfiniteMovingCardsDemo />
          </div>
        </div>
      </section>

      {/* CONTACTO / UBICACIÓN */}
      <section aria-labelledby="location-heading" className="bg-muted py-16 md:py-20">
        <div className="container">
          <h2 id="location-heading" className="sr-only">Ubicación y contacto</h2>
          <div className="flex w-full items-center justify-center">
            <LocationSection />
          </div>
        </div>
      </section>
    </main>
  );
}
