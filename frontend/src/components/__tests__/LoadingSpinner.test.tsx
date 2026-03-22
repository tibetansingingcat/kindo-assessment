import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders a spinner element', () => {
    render(<LoadingSpinner />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders message text when provided', () => {
    render(<LoadingSpinner message="Loading trips..." />);

    expect(screen.getByText('Loading trips...')).toBeInTheDocument();
  });
});
