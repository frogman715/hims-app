"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

// Error message mapping for URL query parameters
const ERROR_MESSAGES: Record<string, string> = {
  SessionError: "Your session has expired or is invalid. Please sign in again.",
  CredentialsSignin: "Invalid email or password. Please try again.",
  OAuthSignin: "Error signing in with OAuth provider.",
  OAuthCallback: "Error in OAuth callback.",
  OAuthCreateAccount: "Could not create OAuth account.",
  EmailCreateAccount: "Could not create email account.",
  Callback: "Error in callback handler.",
  OAuthAccountNotLinked: "Email already in use with a different provider.",
  EmailSignin: "Error sending email verification.",
  CredentialsSignup: "Error creating account.",
  SessionRequired: "Please sign in to access this page.",
  Default: "An error occurred during authentication. Please try again.",
};

// Form-specific error messages
const FORM_ERROR_INVALID_CREDENTIALS = "Invalid email or password";
const FORM_ERROR_GENERAL = "An error occurred. Please try again.";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlErrorProcessedRef = useRef(false);
  const desiredTarget =
    searchParams.get("callbackUrl") ?? searchParams.get("redirect") ?? undefined;
  const safeTarget =
    desiredTarget && desiredTarget.startsWith("/") ? desiredTarget : "/";

  // Helper to determine if an error is from form submission (not URL)
  const isFormError = (errorMsg: string): boolean => {
    return errorMsg === FORM_ERROR_INVALID_CREDENTIALS || errorMsg === FORM_ERROR_GENERAL;
  };

  // Handle error from URL query parameter (only once on mount)
  useEffect(() => {
    if (urlErrorProcessedRef.current) return;
    
    const urlError = searchParams.get("error");
    if (urlError) {
      const errorMessage = ERROR_MESSAGES[urlError] || ERROR_MESSAGES.Default;
      setError(errorMessage);
      urlErrorProcessedRef.current = true;
      
      // Clear the error from URL to prevent it from showing on page reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Only clear form errors, preserve URL-based errors (SessionError, etc.)
    if (!urlErrorProcessedRef.current || isFormError(error)) {
      setError("");
    }
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: safeTarget,
      });

      if (result?.error) {
        setError(FORM_ERROR_INVALID_CREDENTIALS);
      } else {
        router.push(safeTarget);
      }
    } catch {
      setError(FORM_ERROR_GENERAL);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between items-center px-12 py-16">
        <div className="flex-1 flex flex-col justify-center max-w-lg space-y-12">
          {/* Logo Section */}
          <div className="flex justify-center">
            <div className="h-28 w-28 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-2 flex items-center justify-center">
              <Image
                src="/hanmarinereal.png"
                alt="HANMARINE Global Indonesia"
                width={96}
                height={96}
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Text Section */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
                HANMARINE
              </h1>
              <h2 className="text-3xl font-bold text-blue-300">HIMS</h2>
            </div>
            <p className="text-lg text-blue-100 font-medium">
              Maritime Crew Management Platform
            </p>
          </div>

          {/* Certifications */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <p className="text-sm text-blue-200/80 font-medium uppercase tracking-wider">
              International Standards
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-blue-100">MLC 2006</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-blue-100">STCW 2010</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-blue-100">ISM Code</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="text-center">
          <p className="text-sm text-blue-300/70">
            Enterprise-grade crew management trusted by maritime professionals worldwide
          </p>
        </div>
      </div>

      {/* Right side - Sign-in form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-10 space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-2 flex items-center justify-center">
                <Image
                  src="/hanmarinereal.png"
                  alt="HANMARINE Global Indonesia"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">HANMARINE HIMS</h1>
              <p className="text-sm text-blue-200 mt-1">Maritime Crew Management</p>
            </div>
          </div>

          {/* Sign-in Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-8 sm:p-10 space-y-8">
            {/* Card Header */}
            <div className="hidden lg:block space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-slate-600">Sign in to your account</p>
            </div>

            {/* Form section */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email field */}
              <div className="space-y-3">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    aria-invalid={error ? "true" : "false"}
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm font-medium transition duration-200 focus:border-blue-500 focus:ring-0 focus:bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed hover:border-slate-300"
                    placeholder="admin@hanmarine.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <svg className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    minLength={6}
                    disabled={isLoading}
                    aria-invalid={error ? "true" : "false"}
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm font-medium transition duration-200 focus:border-blue-500 focus:ring-0 focus:bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed hover:border-slate-300"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <svg className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex gap-3 rounded-xl border-2 border-red-200 bg-red-50 p-4">
                  <svg
                    className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-red-700 text-sm font-medium">{error}</div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm uppercase tracking-wide transition-all duration-300 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:from-slate-400"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-500 font-medium">
                  Enterprise Security
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500 space-y-2">
              <p className="font-medium">
                © {new Date().getFullYear()} PT. Hanmarine Global Indonesia
              </p>
              <p>All rights reserved. Confidential & Proprietary</p>
            </div>
          </div>

          {/* Additional info */}
          <div className="mt-8 text-center text-xs text-blue-200/60">
            <p>Secure • Encrypted • Compliant with maritime regulations</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"><div className="text-white">Loading...</div></div>}>
      <SignInForm />
    </Suspense>
  );
}
