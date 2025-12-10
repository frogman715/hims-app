import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const params = new URLSearchParams();
  const callbackValue = searchParams?.callbackUrl;
  const redirectValue = searchParams?.redirect;

  const target = typeof callbackValue === "string"
    ? callbackValue
    : typeof redirectValue === "string"
      ? redirectValue
      : undefined;

  if (target && target.startsWith("/")) {
    params.set("callbackUrl", target);
  }

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "redirect" || key === "callbackUrl") {
        continue;
      }
      if (typeof value === "string") {
        params.set(key, value);
      }
    }
  }

  const query = params.toString();
  const destination = query ? `/auth/signin?${query}` : "/auth/signin";
  redirect(destination);
}