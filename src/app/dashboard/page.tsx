import DashboardClient from './DashboardClient';
import { requireUser } from '@/lib/authz';

export default async function DashboardPage() {
  // Note: requireUser handles redirects internally if authentication fails
  // Any other errors will be caught by the ErrorBoundary in the layout
  await requireUser({ redirectIfCrew: '/m/crew' });
  return <DashboardClient />;
}
