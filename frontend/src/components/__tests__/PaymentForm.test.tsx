import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentForm } from '../PaymentForm';
import { mockTrip, mockPaymentSuccess } from '../../test/fixtures';
import { ApiError } from '../../types';
import * as api from '../../api/client';

vi.mock('../../api/client');

describe('PaymentForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderForm() {
    return render(
      <PaymentForm trip={mockTrip} onSuccess={mockOnSuccess} onBack={mockOnBack} />,
    );
  }

  async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/student name/i), 'Emma Wilson');
    await user.type(screen.getByLabelText(/parent name/i), 'Sarah Wilson');
    await user.type(screen.getByLabelText(/card number/i), '1234567890123456');
    await user.type(screen.getByLabelText(/expiry date/i), '12/27');
    await user.type(screen.getByLabelText(/cvv/i), '123');
  }

  it('renders trip summary banner with trip details', () => {
    renderForm();

    expect(screen.getByText('Museum Field Trip')).toBeInTheDocument();
    expect(screen.getByText(/Auckland Museum/)).toBeInTheDocument();
    expect(screen.getByText(/\$45\.00/)).toBeInTheDocument();
  });

  it('renders all form fields with labels and placeholders', () => {
    renderForm();

    expect(screen.getByLabelText(/student name/i)).toHaveAttribute('placeholder', "Child's full name");
    expect(screen.getByLabelText(/parent name/i)).toHaveAttribute('placeholder', 'Your full name');
    expect(screen.getByLabelText(/card number/i)).toHaveAttribute('placeholder', '1234 5678 9012 3456');
    expect(screen.getByLabelText(/expiry date/i)).toHaveAttribute('placeholder', 'MM/YY');
    expect(screen.getByLabelText(/cvv/i)).toHaveAttribute('placeholder', '123');
  });

  it('validates required fields on submit', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    await waitFor(() => {
      expect(screen.getByText(/student name.*(required|enter)/i)).toBeInTheDocument();
    });
  });

  it('validates card number must be 16 digits', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/card number/i), '1234');
    await user.type(screen.getByLabelText(/student name/i), 'Emma Wilson');
    await user.type(screen.getByLabelText(/parent name/i), 'Sarah Wilson');
    await user.type(screen.getByLabelText(/expiry date/i), '12/27');
    await user.type(screen.getByLabelText(/cvv/i), '123');
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    await waitFor(() => {
      expect(screen.getByText(/card number.*16 digits/i)).toBeInTheDocument();
    });
  });

  it('accepts card number with spaces', async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValidForm(user);
    // Clear and re-type with spaces
    await user.clear(screen.getByLabelText(/card number/i));
    await user.type(screen.getByLabelText(/card number/i), '1234 5678 9012 3456');

    vi.mocked(api.submitPayment).mockResolvedValueOnce(mockPaymentSuccess);
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    await waitFor(() => {
      expect(api.submitPayment).toHaveBeenCalled();
    });
  });

  it('validates expiry date format (rejects invalid month)', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/student name/i), 'Emma Wilson');
    await user.type(screen.getByLabelText(/parent name/i), 'Sarah Wilson');
    await user.type(screen.getByLabelText(/card number/i), '1234567890123456');
    await user.type(screen.getByLabelText(/expiry date/i), '13/25');
    await user.type(screen.getByLabelText(/cvv/i), '123');
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    await waitFor(() => {
      expect(screen.getByText(/expiry.*MM\/YY/i)).toBeInTheDocument();
    });
  });

  it('validates CVV must be exactly 3 digits', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText(/student name/i), 'Emma Wilson');
    await user.type(screen.getByLabelText(/parent name/i), 'Sarah Wilson');
    await user.type(screen.getByLabelText(/card number/i), '1234567890123456');
    await user.type(screen.getByLabelText(/expiry date/i), '12/27');
    await user.type(screen.getByLabelText(/cvv/i), '12');
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    await waitFor(() => {
      expect(screen.getByText(/cvv.*3 digits/i)).toBeInTheDocument();
    });
  });

  it('does not call submitPayment when validation fails', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    expect(api.submitPayment).not.toHaveBeenCalled();
  });

  it('disables submit button during submission', async () => {
    const user = userEvent.setup();
    renderForm();

    vi.mocked(api.submitPayment).mockReturnValue(new Promise(() => {})); // never resolves
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit|pay|processing/i })).toBeDisabled();
    });
  });

  it('shows progressive loading messages during submission', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderForm();

    vi.mocked(api.submitPayment).mockReturnValue(new Promise(() => {})); // never resolves
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    await waitFor(() => {
      expect(screen.getByText(/processing payment/i)).toBeInTheDocument();
    });

    vi.advanceTimersByTime(1500);
    await waitFor(() => {
      expect(screen.getByText(/taking a little longer/i)).toBeInTheDocument();
    });

    vi.advanceTimersByTime(3000);
    await waitFor(() => {
      expect(screen.getByText(/still working on it/i)).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('calls onSuccess with result on successful payment', async () => {
    const user = userEvent.setup();
    renderForm();

    vi.mocked(api.submitPayment).mockResolvedValueOnce(mockPaymentSuccess);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockPaymentSuccess);
    });
  });

  it('shows server validation errors mapped to fields', async () => {
    const user = userEvent.setup();
    renderForm();

    vi.mocked(api.submitPayment).mockRejectedValueOnce(
      new ApiError('Validation failed', 400, { student_name: ['This student is already enrolled.'] }),
    );
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    await waitFor(() => {
      expect(screen.getByText(/already enrolled/i)).toBeInTheDocument();
    });
  });

  it('shows error banner on payment declined, form stays populated', async () => {
    const user = userEvent.setup();
    renderForm();

    vi.mocked(api.submitPayment).mockRejectedValueOnce(
      new ApiError('Payment failed.', 400, undefined, {
        message: 'Payment failed.',
        error: 'Payment declined by processor. Please try again.',
      }),
    );
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    await waitFor(() => {
      expect(screen.getByText(/payment declined/i)).toBeInTheDocument();
    });
    // Form should retain values
    expect(screen.getByLabelText(/student name/i)).toHaveValue('Emma Wilson');
  });

  it('shows generic error on network/server error', async () => {
    const user = userEvent.setup();
    renderForm();

    vi.mocked(api.submitPayment).mockRejectedValueOnce(new Error('Network failure'));
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /submit|pay/i }));

    await waitFor(() => {
      expect(screen.getByText(/error|try again/i)).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(mockOnBack).toHaveBeenCalledOnce();
  });
});
