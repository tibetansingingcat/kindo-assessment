import type { PaymentSuccess } from '../types';

interface ConfirmationProps {
  result: PaymentSuccess;
  tripDate: string;
  onReset: () => void;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function Confirmation({ result, tripDate, onReset }: ConfirmationProps) {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mb-6 text-5xl text-green-500">&#10003;</div>
      <h2 className="text-2xl font-bold text-gray-900">Payment Confirmed</h2>

      <div className="mt-6 space-y-3 rounded-lg bg-gray-50 p-6 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Transaction ID</span>
          <span className="font-mono text-gray-900">{result.transaction_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Trip</span>
          <span className="text-gray-900">{result.trip_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Student</span>
          <span className="text-gray-900">{result.student_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Amount Charged</span>
          <span className="font-semibold text-gray-900">${result.amount_charged.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Trip Date</span>
          <span className="text-gray-900">{formatDate(tripDate)}</span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="mt-6 rounded-md bg-[#00acc9] px-6 py-2 text-sm font-medium text-white hover:bg-[#0097b0]"
      >
        Register Another Student
      </button>
    </div>
  );
}
