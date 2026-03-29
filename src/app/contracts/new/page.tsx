import { redirect } from 'next/navigation';

export default async function NewContractPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const crewIdValue = resolvedSearchParams.crewId;
  const crewId = Array.isArray(crewIdValue) ? crewIdValue[0] : crewIdValue;

  if (crewId) {
    redirect(`/contracts?mode=new&crewId=${encodeURIComponent(crewId)}`);
  }

  redirect('/contracts?mode=new');
}
