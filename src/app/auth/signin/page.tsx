import { Suspense } from "react";
import SignInClient from "./SignInClient";

function SignInContent() {
  return <SignInClient />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"><div className="text-white">Loading...</div></div>}>
      <SignInContent />
    </Suspense>
  );
}