import { InfiniteMovingCardsDemo, LayoutGridDemo } from "@/components";
import LocationSection from "@/components/dashboard/LocationSection";
import MenuDestacado from "@/components/dashboard/MenuDestacado";

import Image from "next/image";
import Link from "next/link";
import React from "react";

export const Page = () => {
  return (
    <div className="overflow-hidden">
      {/* Sección de Hero */}
      <div className="relative min-h-screen">
        <Image
          src="/Fondo-restaurante.jpg"
          alt="Fondo de la imagen"
          layout="fill"
          objectFit="cover"
          className="bg-cover bg-center"
        />
        <div className="absolute inset-0 bg-black opacity-40" />
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
          <h1 className="relative -top-10 text-5xl font-bold text-white text-center">
            Bienvenidos a Restaurante App
          </h1>
          <h3 className="relative -top-10 text-2xl text-white text-center">
            Explora todo lo que tenemos para tentar a tu paladar
          </h3>
          <div className="mt-4 flex gap-4">
            <Link href={"/reserva"} className="px-4 py-2 text-lg font-semibold text-white bg-primario-500 rounded hover:bg-primario-700 transition">
              Reservar Mesa
            </Link>
            <Link href={"/reserva"} className="px-4 py-2 text-lg font-semibold text-white bg-secundario-600 rounded hover:bg-secundario-700 transition">
              Hacer un Pedido
            </Link>
          </div>
        </div>
      </div>

      {/* Sección Sobre Nosotros */}
      <section className="relative min-h-[10vh] py-20 bg-gray-50">
        <div className="container mx-auto text-center flex flex-col justify-center items-center">
          <h2 className="text-4xl font-bold text-gray-800">Sobre Nosotros</h2>
          <p className="mt-4 text-lg text-gray-600">
            En Restaurante App, nos apasiona ofrecerte una experiencia culinaria
            inolvidable. Nuestro equipo de chefs elabora cada plato con
            ingredientes frescos y de calidad, asegurando que cada bocado sea
            delicioso.
          </p>
        </div>
      </section>

      {/* Sección Galería */}
      <section className="py-6 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800 relative ">
            Galería
          </h2>
          <div>
            <LayoutGridDemo />
          </div>
        </div>
      </section>

      <section className="py-20 bg-white min-h-[750px]">
        <div className="container mx-auto text-center flex flex-col justify-between">
          <h2 className="text-4xl font-bold text-primario-500  ">
            Menú Destacado
          </h2>
          <div className="border-b-2 border-black mb-16 mt-4 w-full flex justify-center items-center"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 items-center justify-center">
            <MenuDestacado />
            <MenuDestacado />
            <MenuDestacado />

            {/* Agrega más platos aquí */}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800">
            Lo que dicen nuestros clientes
          </h2>
          <InfiniteMovingCardsDemo />
        </div>
      </section>

      {/* Sección de Contacto */}
      <section className="relative min-h-auto py-20 bg-gray-50">
        <div className="flex justify-center items-center gap-4 w-full">
            <LocationSection />
        </div>
      </section>
    </div>
  );
};

export default Page;
