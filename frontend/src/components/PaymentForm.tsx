import type { Trip, PaymentSuccess } from '../types';

interface PaymentFormProps {
  trip: Trip;
  onSuccess: (result: PaymentSuccess) => void;
  onBack: () => void;
}

export function PaymentForm(_props: PaymentFormProps) {
  return <div data-testid="payment-form">PaymentForm placeholder</div>;
}
