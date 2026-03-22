interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div role="status" className="flex flex-col items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00acc9]" />
      {message && <p className="mt-4 text-sm text-gray-500">{message}</p>}
    </div>
  );
}
