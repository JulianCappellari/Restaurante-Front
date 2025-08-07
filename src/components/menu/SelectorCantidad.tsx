"use client";

import { IoAddCircleOutline, IoRemoveCircleOutline } from "react-icons/io5";

interface Props {
  cantidad: number;
  cargarCantidad: (cantidad: number) => void;
}

export const SelectorCantidad = ({ cantidad, cargarCantidad }: Props) => {
  const cargarValor = (valor: number) => {
    if (cantidad + valor < 1) return;
    cargarCantidad(cantidad + valor);
  };

  return (
    <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl p-2 shadow-sm">
      <button 
        onClick={() => cargarValor(-1)}
        disabled={cantidad <= 1}
        className="p-2 text-gray-600 hover:text-primario-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors duration-200 rounded-lg hover:bg-gray-50"
      >
        <IoRemoveCircleOutline size={24} />
      </button>
      
      <span className="w-16 mx-4 text-center text-xl font-bold text-gray-800">
        {cantidad}
      </span>
      
      <button 
        onClick={() => cargarValor(1)}
        className="p-2 text-gray-600 hover:text-primario-600 transition-colors duration-200 rounded-lg hover:bg-gray-50"
      >
        <IoAddCircleOutline size={24} />
      </button>
    </div>
  );
};
