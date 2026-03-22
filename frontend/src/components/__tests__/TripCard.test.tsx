import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripCard } from '../TripCard';
import { mockTrip } from '../../test/fixtures';

describe('TripCard', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trip title, school name, location, and description', () => {
    render(<TripCard trip={mockTrip} onClick={mockOnClick} />);

    expect(screen.getByText('Museum Field Trip')).toBeInTheDocument();
    expect(screen.getByText('Kowhai Primary')).toBeInTheDocument();
    expect(screen.getByText('Auckland Museum')).toBeInTheDocument();
    expect(screen.getByText('A visit to Auckland Museum')).toBeInTheDocument();
  });

  it('formats date as human-readable (e.g. "15 April 2026")', () => {
    render(<TripCard trip={mockTrip} onClick={mockOnClick} />);

    expect(screen.getByText(/15 April 2026/)).toBeInTheDocument();
  });

  it('formats cost as currency (e.g. "$45.00")', () => {
    render(<TripCard trip={mockTrip} onClick={mockOnClick} />);

    expect(screen.getByText(/\$45\.00/)).toBeInTheDocument();
  });

  it('renders a "Register & Pay" button', () => {
    render(<TripCard trip={mockTrip} onClick={mockOnClick} />);

    expect(screen.getByRole('button', { name: /register & pay/i })).toBeInTheDocument();
  });

  it('calls onClick when button is clicked', async () => {
    const user = userEvent.setup();
    render(<TripCard trip={mockTrip} onClick={mockOnClick} />);

    await user.click(screen.getByRole('button', { name: /register & pay/i }));

    expect(mockOnClick).toHaveBeenCalledOnce();
  });
});
