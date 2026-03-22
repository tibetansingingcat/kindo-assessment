interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage(_props: ErrorMessageProps) {
  return <div data-testid="error-message">ErrorMessage placeholder</div>;
}
