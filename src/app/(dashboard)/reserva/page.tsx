'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface ReservationForm {
  firstName: string;
  lastName: string;
  email: string;
  bookingDate: string;
  numberPeople: number;
}

const schema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  email: z.string().email('Correo electrónico inválido'),
  bookingDate: z.string().nonempty('Fecha requerida'),
  numberPeople: z.number().min(1, 'Número de personas requerido').max(20, 'Máximo 20 personas'),
});

const ReservationPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReservationForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ReservationForm) => {
    console.log(data);
    // Aquí puedes hacer la llamada a la API para guardar la reserva
  };

  return (
    <div className="min-h-[800px] flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Reserva de Mesa</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1" htmlFor="firstName">
              Nombre
            </label>
            <input
              type="text"
              id="firstName"
              {...register('firstName')}
              className={`border rounded-lg p-2 w-full focus:outline-none focus:ring ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1" htmlFor="lastName">
              Apellido
            </label>
            <input
              type="text"
              id="lastName"
              {...register('lastName')}
              className={`border rounded-lg p-2 w-full focus:outline-none focus:ring ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              {...register('email')}
              className={`border rounded-lg p-2 w-full focus:outline-none focus:ring ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1" htmlFor="bookingDate">
              Fecha de Reserva
            </label>
            <input
              type="date"
              id="bookingDate"
              {...register('bookingDate')}
              className={`border rounded-lg p-2 w-full focus:outline-none focus:ring ${
                errors.bookingDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.bookingDate && (
              <p className="text-red-500 text-xs mt-1">{errors.bookingDate.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1" htmlFor="numberPeople">
              Número de Personas
            </label>
            <input
              type="number"
              id="numberPeople"
              {...register('numberPeople', { valueAsNumber: true })}
              min="1"
              max="20"
              className={`border rounded-lg p-2 w-full focus:outline-none focus:ring ${
                errors.numberPeople ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.numberPeople && (
              <p className="text-red-500 text-xs mt-1">{errors.numberPeople.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-primario-500 hover:bg-primario-600 text-white font-semibold rounded-lg py-2 mt-4 transition duration-200"
          >
            Reservar Mesa
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReservationPage;
