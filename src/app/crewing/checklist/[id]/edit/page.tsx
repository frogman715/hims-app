import { redirect } from "next/navigation";

export default async function EditChecklistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/crewing/checklist/${id}`);
}
