// pages/about.tsx

import React from "react";
import Image from "next/image";
import ButtomGoogleMaps from "@/components/ui/ButtomGoogleMaps";

const AboutPage: React.FC = () => {
  const googleMapsUrl = "https://www.google.com/maps/place/TU_UBICACION";
  return (
    <div className="min-h-[800px] bg-gray-100 p-6 mt-8">
      {/* Nuestra Historia */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-6">
          Nuestra Historia
        </h2>
        <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
          En [Nombre del Restaurante], comenzamos nuestra aventura hace más de
          [X años] con el objetivo de ofrecer una experiencia gastronómica
          única. Desde nuestras humildes raíces, nos hemos comprometido a
          utilizar ingredientes frescos y de alta calidad, creando platos que
          celebran la rica cultura culinaria de [país o región]. Nos apasiona
          servir a nuestros clientes con amor y dedicación, y estamos orgullosos
          de ser parte de la comunidad local.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ubicación */}
        <div className="mb-12 felx flex-col">
          <h2 className="text-3xl font-bold text-center mb-6">Ubicación</h2>
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.984424898852!2d-122.42393498468165!3d37.77492927975964!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808c8c56e239%3A0x4a827b8306eb8eeb!2s[Nombre%20del%20Restaurante]!5e0!3m2!1ses!2sus!4v1632121852252!5m2!1ses!2sus"
                width="100%"
                height="300"
                allowFullScreen
                loading="lazy"
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
          <p className="text-center text-gray-700 mt-4">
            Visítanos en Calle Falsa 123, Buenos Aires. Te esperamos!
          </p>
          <div className="flex justify-center mt-4">
            <ButtomGoogleMaps googleMapsUrl={googleMapsUrl} />
          </div>
        </div>

        {/* Contacto */}
        <div className="mb-12">
          <div className="flex flex-col justify-center items-center">
            <h2 className="text-3xl font-bold text-center mb-6">Contacto</h2>
            <p className="text-lg text-gray-700 text-center max-w-2xl mx-auto">
              Si tienes preguntas o quieres hacer una reserva, no dudes en
              contactarnos.
            </p>
            <div className="flex flex-col items-center mt-4">
              <p className="text-gray-600">Teléfono: 123456789</p>
              <p className="text-gray-600">
                Correo Electrónico: example@example.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
