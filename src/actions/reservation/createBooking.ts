'use server';
import axios from 'axios';
import { cookies } from 'next/headers';
import type { CreateBookingRequest, CreateBookingResponse } from '@/interfaces/reservation.interface';

export async function createBookingAction(payload: CreateBookingRequest): Promise<CreateBookingResponse> {
  const API = process.env.NEXT_PUBLIC_API_URL2;
  if (!API) throw new Error('API URL no definida');
  const token = (await cookies()).get('token')?.value;

  const { data } = await axios.post<CreateBookingResponse>(`${API}/reservas`, payload, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
    timeout: 10000,
  });
  return data;
}
