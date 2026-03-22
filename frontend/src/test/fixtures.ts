import type { School, Trip, PaymentSuccess, PaymentRequest } from '../types';

export const mockSchool: School = {
  id: 1,
  name: 'Kowhai Primary',
};

export const mockTrip: Trip = {
  id: 1,
  title: 'Museum Field Trip',
  description: 'A visit to Auckland Museum',
  date: '2026-04-15',
  location: 'Auckland Museum',
  cost: '45.00',
  school: mockSchool,
};

export const mockTrip2: Trip = {
  id: 2,
  title: 'Zoo Adventure',
  description: 'A day at Auckland Zoo',
  date: '2026-05-20',
  location: 'Auckland Zoo',
  cost: '30.00',
  school: mockSchool,
};

export const mockTrips: Trip[] = [mockTrip, mockTrip2];

export const mockPaymentSuccess: PaymentSuccess = {
  message: 'Payment processed successfully.',
  transaction_id: 'TX-1774060539-9883',
  amount_charged: 45.0,
  student_name: 'Emma Wilson',
  trip_name: 'Museum Field Trip',
  card_last_four: '3456',
};

export const mockPaymentRequest: PaymentRequest = {
  trip_id: 1,
  student_name: 'Emma Wilson',
  parent_name: 'Sarah Wilson',
  card_number: '1234567890123456',
  expiry_date: '12/27',
  cvv: '123',
};
