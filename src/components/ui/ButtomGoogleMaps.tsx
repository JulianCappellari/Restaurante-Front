


import Link from 'next/link'
import React from 'react'
import { FaMapMarkerAlt } from 'react-icons/fa'

interface Pops {
    googleMapsUrl: string
}
const ButtomGoogleMaps: React.FC<Pops> = (    { googleMapsUrl }) => {
  return (
    <div>
      <Link
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center bg-white hover:bg-primario-700 hover:text-white text-primario-500 font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          <FaMapMarkerAlt className="mr-2 " />
          Ver en Google Maps
        </Link>
    </div>
  )
}

export default ButtomGoogleMaps
