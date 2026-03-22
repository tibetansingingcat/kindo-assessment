import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { mockTrips, mockPaymentSuccess } from '../test/fixtures';
import * as api from '../api/client';

vi.mock('../api/client');

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts on the trip selection screen', async () => {
    vi.mocked(api.getTrips).mockResolvedValueOnce(mockTrips);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Museum Field Trip')).toBeInTheDocument();
    });
  });

  it('navigates to payment form when a trip is selected', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getTrips).mockResolvedValueOnce(mockTrips);

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /register & pay/i })).toHaveLength(2);
    });

    await user.click(screen.getAllByRole('button', { name: /register & pay/i })[0]);

    await waitFor(() => {
      // Payment form should show the trip summary
      expect(screen.getByLabelText(/student name/i)).toBeInTheDocument();
    });
  });

  it('navigates to confirmation on successful payment', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getTrips).mockResolvedValueOnce(mockTrips);
    vi.mocked(api.submitPayment).mockResolvedValueOnce(mockPaymentSuccess);

    render(<App />);

    // Select trip
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /register & pay/i })).toHaveLength(2);
    });
    await user.click(screen.getAllByRole('button', { name: /register & pay/i })[0]);

    // Fill form and submit
    await waitFor(() => {
      expect(screen.getByLabelText(/student name/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/student name/i), 'Emma Wilson');
    await user.type(screen.getByLabelText(/parent name/i), 'Sarah Wilson');
    await user.type(screen.getByLabelText(/card number/i), '1234567890123456');
    await user.type(screen.getByLabelText(/expiry date/i), '12/27');
    await user.type(screen.getByLabelText(/cvv/i), '123');
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    // Should see confirmation
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /payment confirmed/i })).toBeInTheDocument();
    });
  });

  it('navigates back to trip selection from payment form', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getTrips).mockResolvedValue(mockTrips);

    render(<App />);

    // Select trip
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /register & pay/i })).toHaveLength(2);
    });
    await user.click(screen.getAllByRole('button', { name: /register & pay/i })[0]);

    // Click back
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /back/i }));

    // Should see trip list again
    await waitFor(() => {
      expect(screen.getByText('Museum Field Trip')).toBeInTheDocument();
    });
  });

  it('navigates back to trip selection from confirmation via "Register Another"', async () => {
    const user = userEvent.setup();
    vi.mocked(api.getTrips).mockResolvedValue(mockTrips);
    vi.mocked(api.submitPayment).mockResolvedValueOnce(mockPaymentSuccess);

    render(<App />);

    // Select trip
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /register & pay/i })).toHaveLength(2);
    });
    await user.click(screen.getAllByRole('button', { name: /register & pay/i })[0]);

    // Fill and submit
    await waitFor(() => {
      expect(screen.getByLabelText(/student name/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/student name/i), 'Emma Wilson');
    await user.type(screen.getByLabelText(/parent name/i), 'Sarah Wilson');
    await user.type(screen.getByLabelText(/card number/i), '1234567890123456');
    await user.type(screen.getByLabelText(/expiry date/i), '12/27');
    await user.type(screen.getByLabelText(/cvv/i), '123');
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    // Click Register Another
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /register another student/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /register another student/i }));

    // Should see trip list
    await waitFor(() => {
      expect(screen.getByText('Museum Field Trip')).toBeInTheDocument();
    });
  });
});
