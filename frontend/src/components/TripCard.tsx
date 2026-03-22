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
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-500/5">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{trip.title}</h3>
          <p className="mt-0.5 text-sm text-slate-400">{trip.school.name}</p>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
          {formatCost(trip.cost)}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          {formatDate(trip.date)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {trip.location}
        </span>
      </div>

      {trip.description && (
        <p className="mb-5 text-sm leading-relaxed text-slate-500">{trip.description}</p>
      )}

      <div className="mt-auto pt-2" />

      <button
        onClick={onClick}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/30 hover:brightness-110 active:scale-[0.98]"
      >
        Register & Pay
      </button>
    </div>
  );
}
