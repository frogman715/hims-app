import { Suspense } from "react";
import SignInClient from "./SignInClient";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900/20" />}>
      <SignInClient />
    </Suspense>
  );
}