"use server";

import { cookies } from 'next/headers';

type BookingRequest = {
  userId: number;
  dateTime?: string;
  numberPeople: number;
  tableIds: number[];
};

export async function createBooking(payload: BookingRequest) {
  const API = process.env.NEXT_PUBLIC_API_URL2;
  if (!API) throw new Error('API URL no definida');

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    console.error('[BOOKING][SERVER] No se encontró token de autenticación');
    throw new Error('No autenticado. Por favor, inicia sesión nuevamente.');
  }
  if (!token) throw new Error('No autenticado');

  // Prepare the booking data with proper table associations
  const requestPayload = {
    userId: payload.userId,
    dateTime: payload.dateTime, // Use dateTime if provided, otherwise fallback to date
    numberPeople: payload.numberPeople,
    // Send tableIds as a direct array of numbers
    tableIds: payload.tableIds || []
  };
  
  console.log('[BOOKING] Sending payload:', JSON.stringify(requestPayload, null, 2));

  try {
    // Log the request details for debugging
    console.log('[BOOKING][REQUEST]', JSON.stringify({
      url: `${API}/bookings`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token ? '***' : 'missing'}`
      },
      body: requestPayload
    }, null, 2));

    const response = await fetch(`${API}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestPayload)
    });

    let responseData;
    let responseText = '';
    
    try {
      // First, read the response as text
      responseText = await response.text();
      
      // Then try to parse it as JSON if possible
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.log('[BOOKING][DEBUG] Response is not JSON:', {
          error: parseError,
          rawText: responseText
        });
        responseData = { message: responseText };
      }
      
      // Log the raw response for debugging
      console.log('[BOOKING][DEBUG] Raw response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });
      
    } catch (error) {
      console.error('[BOOKING][ERROR] Error processing response:', {
        error,
        status: response.status,
        statusText: response.statusText,
        responseText: responseText || 'Could not read response text'
      });
      throw new Error('Error al procesar la respuesta del servidor');
    }
    
    if (!response.ok) {
      console.error('[BOOKING][SERVER] Error en la respuesta:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData
      });
      
      // Handle specific error cases
      if (response.status === 500 && responseData?.error) {
        console.error('[BOOKING][SERVER] Server error details:', responseData.error);
        throw new Error(responseData.error.message || 'Error interno del servidor');
      }
      
      throw new Error(
        responseData?.message || 
        responseData?.error?.message || 
        `Error al crear la reserva (${response.status})`
      );
    }

    console.log('Booking created successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error en createBooking:', {
      error,
      payload,
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
    throw error instanceof Error ? error : new Error('Error al crear la reserva');
  }
}
