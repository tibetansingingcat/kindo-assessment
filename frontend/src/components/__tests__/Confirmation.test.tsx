import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Confirmation } from '../Confirmation';
import { mockPaymentSuccess } from '../../test/fixtures';

describe('Confirmation', () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Payment Confirmed" heading', () => {
    render(<Confirmation result={mockPaymentSuccess} tripDate="2026-04-15" onReset={mockOnReset} />);

    expect(screen.getByRole('heading', { name: /payment confirmed/i })).toBeInTheDocument();
  });

  it('renders transaction ID', () => {
    render(<Confirmation result={mockPaymentSuccess} tripDate="2026-04-15" onReset={mockOnReset} />);

    expect(screen.getByText(/TX-1774060539-9883/)).toBeInTheDocument();
  });

  it('renders trip name and student name', () => {
    render(<Confirmation result={mockPaymentSuccess} tripDate="2026-04-15" onReset={mockOnReset} />);

    expect(screen.getByText(/Museum Field Trip/)).toBeInTheDocument();
    expect(screen.getByText(/Emma Wilson/)).toBeInTheDocument();
  });

  it('formats amount as currency (e.g. "$45.00")', () => {
    render(<Confirmation result={mockPaymentSuccess} tripDate="2026-04-15" onReset={mockOnReset} />);

    expect(screen.getByText(/\$45\.00/)).toBeInTheDocument();
  });

  it('calls onReset when "Register Another Student" button is clicked', async () => {
    const user = userEvent.setup();
    render(<Confirmation result={mockPaymentSuccess} tripDate="2026-04-15" onReset={mockOnReset} />);

    await user.click(screen.getByRole('button', { name: /register another student/i }));

    expect(mockOnReset).toHaveBeenCalledOnce();
  });
});
