import { useState } from 'react';
import type { AppStep, Trip, PaymentSuccess } from './types';
import { TripList } from './components/TripList';
import { PaymentForm } from './components/PaymentForm';
import { Confirmation } from './components/Confirmation';

export default function App() {
  const [step, setStep] = useState<AppStep>('select_trip');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentSuccess | null>(null);

  function handleSelectTrip(trip: Trip) {
    setSelectedTrip(trip);
    setStep('payment_form');
  }

  function handlePaymentSuccess(result: PaymentSuccess) {
    setPaymentResult(result);
    setStep('confirmation');
  }

  function handleBack() {
    setStep('select_trip');
    setSelectedTrip(null);
  }

  function handleReset() {
    setStep('select_trip');
    setSelectedTrip(null);
    setPaymentResult(null);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">School Trip Payments</h1>

      {step === 'select_trip' && <TripList onSelectTrip={handleSelectTrip} />}

      {step === 'payment_form' && selectedTrip && (
        <PaymentForm trip={selectedTrip} onSuccess={handlePaymentSuccess} onBack={handleBack} />
      )}

      {step === 'confirmation' && paymentResult && selectedTrip && (
        <Confirmation result={paymentResult} tripDate={selectedTrip.date} onReset={handleReset} />
      )}
    </div>
  );
}
