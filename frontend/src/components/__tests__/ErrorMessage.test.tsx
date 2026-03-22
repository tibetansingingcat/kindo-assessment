import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders the error message text', () => {
    render(<ErrorMessage message="Something went wrong" />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders retry button and calls onRetry when provided', async () => {
    const user = userEvent.setup();
    const mockOnRetry = vi.fn();
    render(<ErrorMessage message="Failed to load" onRetry={mockOnRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry|try again/i });
    expect(retryButton).toBeInTheDocument();

    await user.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledOnce();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Something went wrong" />);

    expect(screen.queryByRole('button', { name: /retry|try again/i })).not.toBeInTheDocument();
  });
});
