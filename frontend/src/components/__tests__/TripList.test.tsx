import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripList } from '../TripList';
import { mockTrips } from '../../test/fixtures';
import * as api from '../../api/client';

vi.mock('../../api/client');

describe('TripList', () => {
  const mockOnSelectTrip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching trips', () => {
    vi.mocked(api.getTrips).mockReturnValue(new Promise(() => {})); // never resolves

    render(<TripList onSelectTrip={mockOnSelectTrip} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders trip cards after successful fetch', async () => {
    vi.mocked(api.getTrips).mockResolvedValueOnce(mockTrips);

    render(<TripList onSelectTrip={mockOnSelectTrip} />);

    await waitFor(() => {
      expect(screen.getByText('Museum Field Trip')).toBeInTheDocument();
    });
    expect(screen.getByText('Zoo Adventure')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(api.getTrips).mockRejectedValueOnce(new Error('Network error'));

    render(<TripList onSelectTrip={mockOnSelectTrip} />);

    await waitFor(() => {
      expect(screen.getByText(/could not load trips/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no trips available', async () => {
    vi.mocked(api.getTrips).mockResolvedValueOnce([]);

    render(<TripList onSelectTrip={mockOnSelectTrip} />);

    await waitFor(() => {
      expect(screen.getByText(/no trips available/i)).toBeInTheDocument();
    });
  });

  it('calls onSelectTrip with the correct trip when Register & Pay clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getTrips).mockResolvedValueOnce(mockTrips);

    render(<TripList onSelectTrip={mockOnSelectTrip} />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /register & pay/i })).toHaveLength(2);
    });

    const buttons = screen.getAllByRole('button', { name: /register & pay/i });
    await user.click(buttons[0]);

    expect(mockOnSelectTrip).toHaveBeenCalledWith(mockTrips[0]);
  });
});
