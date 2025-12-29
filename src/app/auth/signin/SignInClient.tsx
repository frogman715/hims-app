"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const desiredTarget =
    searchParams.get("callbackUrl") ?? searchParams.get("redirect") ?? undefined;
  const safeTarget =
    desiredTarget && desiredTarget.startsWith("/") ? desiredTarget : "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: safeTarget,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(safeTarget);
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center px-8 py-12">
        <div className="max-w-lg text-center lg:text-left space-y-8">
          <div className="flex justify-center lg:justify-start">
            <div className="h-24 w-24">
              <img
                src="/hanmarinereal.png"
                alt="HANMARINE Global Indonesia"
                className="h-24 w-24 object-contain drop-shadow-lg"
              />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              HANMARINE HIMS
            </h1>
            <p className="text-lg text-blue-100">
              Maritime Crew Management Platform
            </p>
            <div className="flex flex-col lg:flex-row gap-4 text-sm text-blue-200 pt-4">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                MLC 2006
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                STCW 2010
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                ISM Code
              </span>
            </div>
          </div>
          <p className="text-sm text-blue-300 border-t border-blue-700 pt-8">
            Enterprise-grade crew management system trusted by maritime
            professionals
          </p>
        </div>
      </div>

      {/* Right side - Sign-in form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8 space-y-2">
            <div className="flex justify-center">
              <div className="h-16 w-16">
                <img
                  src="/hanmarinereal.png"
                  alt="HANMARINE Global Indonesia"
                  className="h-16 w-16 object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">HANMARINE HIMS</h1>
          </div>

          {/* Sign-in card */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 space-y-6">
            {/* Desktop heading */}
            <div className="hidden lg:block space-y-2 mb-8">
              <h2 className="text-3xl font-bold text-slate-900">
                Welcome Back
              </h2>
              <p className="text-slate-600">Sign in to your HIMS account</p>
            </div>

            {/* Form section */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email field */}
              <div className="space-y-2.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-900"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  aria-invalid={error ? "true" : "false"}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200"
                  placeholder="admin@hanmarine.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password field */}
              <div className="space-y-2.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-900"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  disabled={isLoading}
                  aria-invalid={error ? "true" : "false"}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Error message */}
              {error && (
                <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
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
                  <div className="text-red-600">{error}</div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm transition hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed"
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
                    Signing in...
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
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-500">
                  Protected by enterprise security
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-slate-500">
              <p>
                © {new Date().getFullYear()} PT. Hanmarine Global Indonesia.
                All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
