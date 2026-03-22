import type { Trip } from '../types';

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatCost(cost: string): string {
  return `$${parseFloat(cost).toFixed(2)}`;
}

export function TripCard({ trip, onClick }: TripCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-bold text-gray-900">{trip.title}</h3>
      <p className="mt-1 text-sm text-gray-500">{trip.school.name}</p>
      <div className="mt-4 space-y-1 text-sm text-gray-600">
        <p>{formatDate(trip.date)}</p>
        <p>{trip.location}</p>
        <p className="text-lg font-semibold text-gray-900">{formatCost(trip.cost)}</p>
      </div>
      {trip.description && <p className="mt-3 text-sm text-gray-600">{trip.description}</p>}
      <button
        onClick={onClick}
        className="mt-4 w-full rounded-md bg-[#00acc9] px-4 py-2 text-sm font-medium text-white hover:bg-[#0097b0] sm:w-auto"
      >
        Register &amp; Pay
      </button>
    </div>
  );
}
