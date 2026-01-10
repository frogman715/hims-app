'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function SalaryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const summaryCards = [
    {
      title: "Crew Wages",
      description: "Monthly wage processing",
      href: "/accounting/wages",
      icon: "💰",
      color: "from-green-500 to-green-600",
    },
    {
      title: "Allotments",
      description: "Family allotment transfers",
      href: "/accounting/allotments",
      icon: "🏦",
      color: "from-blue-500 to-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white backdrop-blur-lg shadow-2xl border-b border-white/20">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                Crew Salaries & Payroll
              </h1>
              <p className="text-lg text-gray-700 mt-2 font-medium">Manage seafarer compensation and payments</p>
            </div>
            <Link
              href="/accounting"
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              ← Back to Accounting
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Info Card */}
          <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-white p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">👥</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Salary Management Hub</h2>
                <p className="text-gray-700 leading-relaxed">
                  This module provides comprehensive salary management for seafarers. Use the sections below to access
                  wage processing and allotment transfers. All salary calculations follow MLC 2006 standards and
                  Indonesian maritime regulations.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {summaryCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-white p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{card.icon}</div>
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent mb-2`}>
                      {card.title}
                    </h3>
                    <p className="text-gray-600 text-base">{card.description}</p>
                    <div className="mt-4 text-blue-600 font-medium flex items-center gap-2">
                      Open Module
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Information Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Wage Processing</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Monthly wage calculations for active crew</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Automatic currency conversion and exchange rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Overtime and special allowances tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Payment status monitoring and approval workflow</span>
                </li>
              </ul>
            </div>

            <div className="bg-white backdrop-blur-md rounded-2xl shadow-lg border border-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🏦 Allotment Management</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Family allotment transfers to beneficiaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Bank account details and transfer records</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Automatic percentage or fixed amount calculations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Transfer history and proof of payment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
