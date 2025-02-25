import Link from 'next/link'
import React from 'react'
import { ProductosEnElCarrito } from './ui/ProductosEnElCarrito'
import { InformacionOrden } from './ui/infromacion-orden/InformacionOrden'

const cartPage = () => {
  return (
    <div className="flex justify-center items-center mb-72 px-10 sm:px-0">
      <div className="flex flex-col w-[1000px] ">
        <h1 className='antialiased text-4xl font-semibold my-7'>Carrito</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {/* Carrito */}
          <div className="flex flex-col mt-1">
            <span className="text-xl"> Agregar mas items</span>
            <Link href={"/"} className="mb-5 underline">
              Continua comprando
            </Link>
          

          {/* Items */}
          {/* <ProductosEnElCarrito /> */}
          </div>

          {/* Checkout - resumen de la compra */}

            <div className="bg-white rounded-xl shadow-xl p-7 h-fit">
              <h2 className="text-2xl mb-2">Resumen de orden</h2>
              
              {/* <InformacionOrden /> */}

              <div className="mt-5 w-full mb-2">
                <Link href={'/checkout/direccion'} className="flex btn-primary justify-center">
                  Checkout
                </Link>
              </div>
            </div>


        </div>
      </div>
    </div>
  )
}

export default cartPage
