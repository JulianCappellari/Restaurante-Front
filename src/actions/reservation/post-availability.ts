// src/actions/reservation/post-availability.ts
'use server';
import axios from 'axios';
import { cookies } from 'next/headers';
import type { AvailabilityRequest, AvailabilityResponse } from '@/interfaces/reservation.interface';

export async function checkAvailabilityAction(payload: AvailabilityRequest): Promise<AvailabilityResponse> {
  const API = process.env.NEXT_PUBLIC_API_URL2;
  if (!API) throw new Error('API URL no definida');

  // protección: si API apunta al mismo host:puerto que Next, lo aviso
  if (/^https?:\/\/localhost:3001(\/|$)/i.test(API)) {
    throw new Error('NEXT_PUBLIC_API_URL2 apunta al frontend. Debe apuntar al backend.');
  }

  const token = (await cookies()).get('token')?.value;

  // console.groupCollapsed('%c[AVAIL][SERVER] Request', 'color:#2563eb');
  // console.log('API_BASE:', API);
  // console.log('URL:', `${API}/availability/check`);
  // console.log('payload:', payload);
  // console.log('auth:', token ? `Bearer ${token.slice(0,8)}…` : '(sin token)');
  // console.groupEnd();

  try {
    const { data, status } = await axios.post<AvailabilityResponse>(
      `${API}/availability/check`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 10000,
      }
    );

    // console.groupCollapsed('%c[AVAIL][SERVER] Response', 'color:#16a34a');
    // console.log('status:', status);
    // console.log('available:', (data as any)?.available);
    // console.log('raw:', data);
    // console.groupEnd();
    console.log("Availability response:", data);
    return data;
  } catch (err: any) {
    // console.groupCollapsed('%c[AVAIL][SERVER] Error', 'color:#dc2626');
    // console.log('message:', err?.message);
    // console.log('status:', err?.response?.status);
    // console.log('data:', err?.response?.data);
    // console.groupEnd();
    throw new Error(err?.response?.data?.message || err?.message || 'Error consultando disponibilidad');
  }
}
