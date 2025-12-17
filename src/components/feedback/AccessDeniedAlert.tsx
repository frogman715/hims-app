interface AccessDeniedAlertProps {
  title?: string;
  message?: string;
}

export function AccessDeniedAlert({
  title = 'Tidak memiliki akses',
  message = 'Peran Anda tidak mengizinkan akses ke modul ini. Silakan hubungi administrator bila diperlukan.',
}: AccessDeniedAlertProps) {
  return (
    <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
