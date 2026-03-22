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
    <div className="min-h-svh print:min-h-0 bg-linear-to-br from-slate-50 via-cyan-50/30 to-slate-100">
      <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-teal-600 text-lg font-bold text-white shadow-lg shadow-cyan-500/20">
            T
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">TripPay</h1>
            <p className="text-xs text-slate-500">School trip registration & payments</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {step === 'select_trip' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Upcoming Trips</h2>
              <p className="mt-1 text-sm text-slate-500">Select a trip to register and pay</p>
            </div>
            <TripList onSelectTrip={handleSelectTrip} />
          </div>
        )}

        {step === 'payment_form' && selectedTrip && (
          <PaymentForm trip={selectedTrip} onSuccess={handlePaymentSuccess} onBack={handleBack} />
        )}

        {step === 'confirmation' && paymentResult && selectedTrip && (
          <Confirmation result={paymentResult} tripDate={selectedTrip.date} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
