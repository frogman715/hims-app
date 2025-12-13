import DashboardClient from './DashboardClient';
import { requireUser } from '@/lib/authz';

export default async function DashboardPage() {
  await requireUser({ redirectIfCrew: '/m/crew' });
  return <DashboardClient />;
}
