import type { ReactNode } from 'react';

interface FeatureUnavailableAlertProps {
  title?: string;
  message?: string;
  details?: ReactNode;
}

export function FeatureUnavailableAlert({
  title = 'Feature unavailable',
  message = 'This module is not available in the current workspace.',
  details,
}: FeatureUnavailableAlertProps) {
  return (
    <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700" role="alert">
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{message}</p>
      {details ? <div className="mt-2 text-amber-800">{details}</div> : null}
    </div>
  );
}
