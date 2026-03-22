import type { PaymentSuccess } from '../types';

interface ConfirmationProps {
  result: PaymentSuccess;
  tripDate: string;
  onReset: () => void;
}

export function Confirmation(_props: ConfirmationProps) {
  return <div data-testid="confirmation">Confirmation placeholder</div>;
}
