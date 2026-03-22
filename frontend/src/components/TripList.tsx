import { useEffect, useMemo, useState } from 'react';
import type { Trip } from '../types';
import { getTrips } from '../api/client';
import { TripCard } from './TripCard';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface TripListProps {
  onSelectTrip: (trip: Trip) => void;
}

export function TripList({ onSelectTrip }: TripListProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string>('all');

  const fetchTrips = () => {
    setLoading(true);
    setError(null);
    getTrips()
      .then((data) => {
        setTrips(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load trips. Please try again.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const schools = useMemo(() => {
    const names = [...new Set(trips.map((t) => t.school.name))];
    return names.sort();
  }, [trips]);

  const filteredTrips = selectedSchool === 'all'
    ? trips
    : trips.filter((t) => t.school.name === selectedSchool);

  if (loading) return <LoadingSpinner message="Loading trips..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchTrips} />;
  if (trips.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white py-16 text-center">
        <p className="text-sm text-slate-400">No trips available</p>
      </div>
    );
  }

  return (
    <div>
      {schools.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSchool('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedSchool === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            All Schools
          </button>
          {schools.map((school) => (
            <button
              key={school}
              onClick={() => setSelectedSchool(school)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedSchool === school
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {school}
            </button>
          ))}
        </div>
      )}

      {filteredTrips.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white py-16 text-center">
          <p className="text-sm text-slate-400">No trips for this school</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onClick={() => onSelectTrip(trip)} />
          ))}
        </div>
      )}
    </div>
  );
}
