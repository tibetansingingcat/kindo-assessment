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
  if (trips.length === 0) return <p className="py-12 text-center text-gray-500">No trips available</p>;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} onClick={() => onSelectTrip(trip)} />
      ))}
    </div>
  );
}
