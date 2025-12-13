import { redirect, RedirectType } from "next/navigation";
import { requireUser, resolveDefaultRoute } from "@/lib/authz";

export default async function IndexPage() {
  const { user, isCrew } = await requireUser();
  const target = isCrew ? "/m/crew" : resolveDefaultRoute(user.role);
  redirect(target, RedirectType.replace);
}
