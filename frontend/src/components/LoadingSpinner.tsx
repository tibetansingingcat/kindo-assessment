interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div role="status" className="flex flex-col items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-cyan-500" />
      {message && <p className="mt-4 text-sm text-slate-400">{message}</p>}
    </div>
  );
}
