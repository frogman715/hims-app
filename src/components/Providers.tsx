"use client";

import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppNoticeViewport } from "@/components/feedback/AppNoticeViewport";

function ForcePasswordChangeGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    if (session.user.forcePasswordChange !== true) {
      return;
    }

    if (pathname === "/change-password") {
      return;
    }

    router.replace("/change-password");
  }, [pathname, router, session, status]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ForcePasswordChangeGuard>
        {children}
        <AppNoticeViewport />
      </ForcePasswordChangeGuard>
    </SessionProvider>
  );
}
