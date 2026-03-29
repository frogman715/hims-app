import { redirect } from "next/navigation";

export default async function DocumentDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/crewing/documents/${id}/view`);
}
