import { useState } from 'react';
import type { AppStep, Trip, PaymentSuccess } from './types';

export default function App() {
  const [_step, _setStep] = useState<AppStep>('select_trip');
  const [_selectedTrip, _setSelectedTrip] = useState<Trip | null>(null);
  const [_paymentResult, _setPaymentResult] = useState<PaymentSuccess | null>(null);

  // TODO: implement step-based rendering
  return <div data-testid="app">App placeholder</div>;
}
