import type { Trip, PaymentRequest, PaymentSuccess, PaymentError } from '../types';
import { ApiError } from '../types';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

export async function getTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_BASE}/trips/`);
  if (!res.ok) {
    throw new ApiError('Failed to fetch trips', res.status);
  }
  return res.json();
}

export async function getTrip(id: number): Promise<Trip> {
  try {
    const res = await fetch(`${API_BASE}/trips/${id}/`);
    if (!res.ok) {
      throw new ApiError('Failed to fetch trip', res.status);
    }
    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Network error', 0);
  }
}

export async function submitPayment(data: PaymentRequest): Promise<PaymentSuccess> {
  const res = await fetch(`${API_BASE}/payments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const body = await res.json();

  if (res.ok) {
    return body as PaymentSuccess;
  }

  if (res.status === 400) {
    const isPaymentError = 'message' in body && 'error' in body;
    if (isPaymentError) {
      throw new ApiError(body.message, 400, undefined, body as PaymentError);
    }
    throw new ApiError('Validation failed', 400, body);
  }

  throw new ApiError(body.message || 'Server error', res.status);
}
