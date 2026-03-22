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
    <div className="mx-auto max-w-lg">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Payment Confirmed</h2>
        <p className="mt-1 text-sm text-slate-400">Your registration is complete</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-slate-400">Transaction ID</span>
            <span className="font-mono text-sm font-medium text-slate-900">{result.transaction_id}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-slate-400">Trip</span>
            <span className="text-sm font-medium text-slate-900">{result.trip_name}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-slate-400">Student</span>
            <span className="text-sm font-medium text-slate-900">{result.student_name}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-slate-400">Trip Date</span>
            <span className="text-sm font-medium text-slate-900">{formatDate(tripDate)}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-50 px-6 py-4">
            <span className="text-sm font-medium text-slate-600">Amount Charged</span>
            <span className="text-lg font-bold text-slate-900">${result.amount_charged.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="mt-8 w-full rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md active:scale-[0.99]"
      >
        Register Another Student
      </button>
    </div>
  );
}
