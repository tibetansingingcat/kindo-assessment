import type { Trip } from '../types';

interface TripListProps {
  onSelectTrip: (trip: Trip) => void;
}

export function TripList(_props: TripListProps) {
  return <div data-testid="trip-list">TripList placeholder</div>;
}
