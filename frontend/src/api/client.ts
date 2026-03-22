import type { Trip, PaymentRequest, PaymentSuccess } from '../types';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

export async function getTrips(): Promise<Trip[]> {
  // TODO: implement
  throw new Error('Not implemented');
}

export async function getTrip(_id: number): Promise<Trip> {
  // TODO: implement
  throw new Error('Not implemented');
}

export async function submitPayment(_data: PaymentRequest): Promise<PaymentSuccess> {
  // TODO: implement
  throw new Error('Not implemented');
}
