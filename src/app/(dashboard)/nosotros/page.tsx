import React from "react";
import Image from "next/image";
import ButtomGoogleMaps from "@/components/ui/ButtomGoogleMaps";
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from "react-icons/fa";

const AboutPage: React.FC = () => {
  const googleMapsUrl = "https://www.google.com/maps/place/TU_UBICACION";
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-amber-50 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto mb-16">
        <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-xl">
          <Image
            src="/restaurant-interior.jpg" // Reemplaza con tu imagen
            alt="Interior del restaurante"
            layout="fill"
            objectFit="cover"
            className="opacity-90"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white text-center px-4">
              Nuestra Historia
            </h1>
          </div>
        </div>
      </section>

      {/* Nuestra Historia */}
      <section className="max-w-4xl mx-auto mb-20 px-4">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8 text-amber-600">
            Conoce Nuestra Pasión
          </h2>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="relative w-full md:w-1/2 h-64 rounded-xl overflow-hidden shadow-md">
              <Image
                src="/chef-cooking.jpg" // Reemplaza con tu imagen
                alt="Chef cocinando"
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="w-full md:w-1/2">
              <p className="text-lg text-gray-700 mb-4">
                En <span className="font-bold text-amber-600">[Nombre del Restaurante]</span>, 
                comenzamos nuestra aventura hace más de [X años] con el sueño de 
                ofrecer una experiencia gastronómica que combine tradición e innovación.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                Nuestros chefs, con más de [X] años de experiencia, seleccionan 
                cuidadosamente ingredientes frescos y locales para crear platos 
                que celebran la rica cultura culinaria de [país o región].
              </p>
              <p className="text-lg text-gray-700">
                Más que un restaurante, somos una familia que se enorgullece de 
                servir a nuestra comunidad con amor, dedicación y el más alto 
                estándar de calidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ubicación y Contacto */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
        {/* Ubicación */}
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center mb-6">
            <FaMapMarkerAlt className="text-amber-500 text-2xl mr-3" />
            <h2 className="text-3xl font-bold text-gray-800">Ubicación</h2>
          </div>
          
          <div className="relative h-64 w-full rounded-xl overflow-hidden shadow-md mb-6">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.984424898852!2d-122.42393498468165!3d37.77492927975964!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808c8c56e239%3A0x4a827b8306eb8eeb!2s[Nombre%20del%20Restaurante]!5e0!3m2!1ses!2sus!4v1632121852252!5m2!1ses!2sus"
              width="100%"
              height="100%"
              allowFullScreen
              loading="lazy"
              className="absolute inset-0"
            ></iframe>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <FaMapMarkerAlt className="text-amber-500 mr-2" />
              <p className="text-lg text-gray-700">
                Calle Falsa 123, Buenos Aires
              </p>
            </div>
            <div className="flex items-center">
              <FaClock className="text-amber-500 mr-2" />
              <p className="text-lg text-gray-700">
                Horario: Lunes a Domingo, 12:00 - 23:00
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <ButtomGoogleMaps googleMapsUrl={googleMapsUrl} />
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center mb-6">
            <FaEnvelope className="text-amber-500 text-2xl mr-3" />
            <h2 className="text-3xl font-bold text-gray-800">Contacto</h2>
          </div>
          
          <p className="text-lg text-gray-700 mb-8 text-center">
            ¿Tienes preguntas, sugerencias o quieres hacer una reserva? 
            Estamos aquí para ayudarte.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-amber-100 p-3 rounded-full mr-4">
                <FaPhone className="text-amber-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Teléfono</h3>
                <p className="text-gray-600">+54 11 1234-5678</p>
                <p className="text-sm text-gray-500">
                  Disponibles de 10:00 a 22:00
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-amber-100 p-3 rounded-full mr-4">
                <FaEnvelope className="text-amber-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Correo Electrónico</h3>
                <p className="text-gray-600">contacto@restaurante.com</p>
                <p className="text-sm text-gray-500">
                  Respondemos en menos de 24 horas
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-amber-100 p-3 rounded-full mr-4">
                <FaClock className="text-amber-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Horario de Atención</h3>
                <p className="text-gray-600">Lunes a Viernes: 12:00 - 23:00</p>
                <p className="text-gray-600">Sábados y Domingos: 12:00 - 00:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="max-w-7xl mx-auto mt-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Conoce a Nuestro Equipo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105">
              <div className="relative h-64 w-full">
                <Image
                  src={`/chef-${item}.jpg`} // Reemplaza con tus imágenes
                  alt={`Chef ${item}`}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1">Nombre del Chef</h3>
                <p className="text-amber-600 font-medium mb-3">Especialidad</p>
                <p className="text-gray-600">
                  Breve descripción del chef y su experiencia en la cocina.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;