import type { Trip } from '../types';

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
}

export function TripCard(_props: TripCardProps) {
  return <div data-testid="trip-card">TripCard placeholder</div>;
}
