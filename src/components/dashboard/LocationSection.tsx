
import React from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import ButtomGoogleMaps from "../ui/ButtomGoogleMaps";

const LocationSection: React.FC = () => {
  const googleMapsUrl = "https://www.google.com/maps/place/TU_UBICACION"; 

  return (
    <section className="bg-gradient-to-r from-primario-400 via-primario-600 to-primario-400 py-12 px-8 text-center text-white w-full h-auto">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold mb-4">
          Visítanos en Nuestra Ubicación!
        </h2>
        <p className="text-lg md:text-xl mb-8">
          Nos encontramos en un lugar accesible y cómodo, ¡esperamos tu visita
          para brindarte la mejor experiencia!
        </p>

        <div className="flex items-center justify-center mb-6">
          <FaMapMarkerAlt className="text-4xl md:text-5xl text-primario-200 mr-3" />
          <span className="text-xl md:text-2xl font-medium">
            Calle Falsa 123, Buenos Aires
          </span>
        </div>

        <ButtomGoogleMaps googleMapsUrl={googleMapsUrl} />
      </div>
    </section>
  );
};

export default LocationSection;
