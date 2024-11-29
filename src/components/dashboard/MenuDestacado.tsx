import Image from "next/image";
import React from "react";

const MenuDestacado = () => {
  return (
    <div className="relative w-[300px] h-[400px] group">
      {/* Card trasero */}
      <div className="absolute inset-0 bg-primario-400 w-full h-full rounded-md rotate-6 shadow-2xl transition-transform duration-300 group-hover:rotate-0 group-hover:z-0"></div>

      {/* Card delantero con la información */}
      <div className="absolute inset-0 bg-white w-full h-full rounded-md -rotate-6 shadow-2xl transition-transform duration-300 group-hover:rotate-0 group-hover:z-10">
        <Image
          src={"/Fondo-restaurante.jpg"}
          alt="Pizza"
          width={500}
          height={300} // Ajusta la altura según sea necesario
          className="rounded-t-md object-cover h-[180px] w-full" // Reduce la altura de la imagen
        />
        <div className="p-4 flex flex-col h-full justify-start items-center relative top-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pizza</h2>
            <p className="text-gray-600 mt-1 mb-2 ">
              Deliciosa pizza con ingredientes frescos y masa crujiente.
            </p>
            <div className="border-4 border-primario-400 rounded-lg py-2 mt-4">
              <span className="text-xl font-bold text-gray-800">$3500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuDestacado;