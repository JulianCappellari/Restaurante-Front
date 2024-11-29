
import Image from 'next/image'
import React from 'react'
import { AiOutlineHeart, AiOutlineShoppingCart } from 'react-icons/ai'


const FoodCardParticular = () => {
  return (
    <div className="relative w-[800px] h-[400px] bg-white border-[2px] border-black rounded-xl overflow-hidden shadow-2xl flex flex-row">
       
      {/* Like Button */}
      <button className="absolute right-0 p-1 bg-primario-500 shadow-md rounded-none rounded-bl-lg z-10">
        <AiOutlineHeart className="text-gray-200" size={20} />
      </button>

      {/* Discount Badge */}
      <div className="absolute bg-primario-500 text-gray-200 text-sm font-bold px-2 py-1 rounded-r-lg rounded-tr-none z-10">
        10% OFF
      </div>

      {/* Image Placeholder */}
      <div className="relative h-2/3">
        <Image
          src={"/Fondo-restaurante.jpg"}
          alt={"name"}
          layout="fill"
          objectFit="cover"
          className="rounded-t-xl"
        />
      </div>

      {/* Product Information */}
      <div className="p-4">
        <h3 className="text-lg font-extrabold text-gray-800 text-center">
          Producto
        </h3>
        <p className="text-xs text-center text-gray-600">Product Description</p>
        <div className="flex justify-between items-center mt-3 px-4">
          <div>
            <p className="text-lg font-semibold text-gray-800">$10</p>
          </div>
          <span className="text-gray-400">|</span>
          <button className="flex items-center space-x-1 bg-primario-500 hover:bg-primario-700 transition duration-200 rounded-full px-4 py-1 text-gray-100 font-medium shadow-lg">
            <AiOutlineShoppingCart size={16} />
            <span>Agregar</span>
          </button>
        </div>
      </div>
    
    </div>
  )
}

export default FoodCardParticular
