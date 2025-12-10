"use client";

import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const desiredTarget = searchParams.get("callbackUrl") ?? searchParams.get("redirect") ?? undefined;
  const safeTarget = desiredTarget && desiredTarget.startsWith("/") ? desiredTarget : "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: safeTarget,
    });

    if (result?.error) {
      setError("Invalid credentials");
    } else {
      router.push(safeTarget);
    }
  };

  const maritimeSvg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'>
      <defs>
        <linearGradient id='wave' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stop-color='%230ea5e9' stop-opacity='0.55'/>
          <stop offset='100%' stop-color='%230f172a' stop-opacity='0'/>
        </linearGradient>
      </defs>
      <rect width='1600' height='900' fill='%2307142b'/>
      <path d='M0 580 Q200 520 400 560 T800 560 T1200 540 T1600 560 V900 H0 Z' fill='url(%23wave)'/>
      <path d='M0 640 Q240 600 480 640 T960 640 T1440 620' stroke='%2338bdf8' stroke-width='4' stroke-linecap='round' fill='none' opacity='0.35'/>
      <g opacity='0.35'>
        <path d='M960 360 H1080 L1120 420 H880 Z' fill='%23134e4a'/>
        <path d='M920 420 H1140 L1100 440 H880 Z' fill='%23225664' opacity='0.85'/>
      </g>
    </svg>
  `);

  const maritimeBackground = {
    backgroundImage: `radial-gradient(circle at 20% 20%, rgba(59,130,246,0.35), transparent 62%), radial-gradient(circle at 78% 8%, rgba(14,165,233,0.28), transparent 58%), url("data:image/svg+xml,${maritimeSvg}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  } as const;

  return (
    <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 -z-10" style={maritimeBackground} />

      <div className="max-w-md w-full mx-auto space-y-10 bg-white/92 backdrop-blur-2xl border border-white/40 shadow-[0_35px_90px_rgba(8,47,73,0.25)] rounded-[34px] p-12">
        <div>
          <div className="relative mx-auto mb-8 h-36 w-36">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/80 via-white/40 to-white/10 blur-xl" />
            <div className="absolute inset-1 rounded-[30px] border border-white/60 bg-white/80 shadow-[0_20px_45px_rgba(2,6,23,0.18)]" />
            <div className="relative flex h-full w-full items-center justify-center rounded-[28px] bg-white">
              <Image
                src="/hanmarinereal.png"
                alt="HANMARINE Global Indonesia"
                width={148}
                height={148}
                priority
                unoptimized
                className="h-28 w-auto object-contain"
              />
            </div>
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            HANMARINE HIMS
          </h2>
          <p className="mt-3 text-center text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            Maritime Crew Management Platform
          </p>
          <p className="mt-3 text-center text-sm text-slate-500">
            MLC 2006 • STCW 2010 • ISM Code Compliant
          </p>
        </div>
        <form className="space-y-7" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/25 focus:outline-none transition"
                placeholder="admin@hanmarine.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-900 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                className="block w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/25 focus:outline-none transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              <svg className="h-5 w-5 flex-none" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10A8 8 0 11.001 9.999 8 8 0 0118 10zm-9-3a1 1 0 112 0v3a1 1 0 11-2 0V7zm0 6a1 1 0 102 0 1 1 0 00-2 0z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition hover:scale-[1.02] hover:shadow-[0_18px_40px_rgba(37,99,235,0.35)] focus:outline-none focus:ring-4 focus:ring-indigo-500/40"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In to Dashboard
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Protected by enterprise-grade security
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            © {new Date().getFullYear()} PT. Hanmarine Global Indonesia. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
