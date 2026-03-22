import { useEffect, useState } from 'react';
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
    <div className="grid gap-5 sm:grid-cols-2">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} onClick={() => onSelectTrip(trip)} />
      ))}
    </div>
  );
}
