interface AccessDeniedAlertProps {
  title?: string;
  message?: string;
}

export function AccessDeniedAlert({
  title = 'Access denied',
  message = 'Your role does not allow access to this module. Contact the system administrator if additional access is required.',
}: AccessDeniedAlertProps) {
  return (
    <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
