"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AboutPage() {
  const [vision, setVision] = useState<{
    vision: string;
    mission: string;
    coreValues: string[];
    objectives: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisionMission();
  }, []);

  const fetchVisionMission = async () => {
    try {
      const res = await fetch("/api/about/vision-mission");
      if (res.ok) {
        const data = await res.json();
        setVision(data);
      }
    } catch (error) {
      console.error("Failed to fetch vision & mission:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white backdrop-blur-md mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold mb-4">PT. HANN GLOBAL INDONESIA</h1>
            <p className="text-xl text-blue-100">HANMARINE Integrated Management System</p>
            <p className="text-sm text-blue-200 mt-2">ISO 9001:2015 & MLC 2006 Compliant</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-700">
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-1 text-gray-500">About Us</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Vision Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-l-4 border-blue-600">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              {vision?.vision || "To be the leading maritime crew management company in Indonesia, recognized globally for excellence, integrity, and commitment to seafarers' welfare and international maritime standards."}
            </p>
          </div>

          {/* Mission Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-l-4 border-cyan-600">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              {vision?.mission || "To provide professional maritime crew management services that comply with MLC 2006 and STCW standards, ensuring quality seafarers, excellent service to ship owners, and fostering a safe, respectful working environment for all maritime professionals."}
            </p>
          </div>
        </div>

        {/* Core Values */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Core Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {(vision?.coreValues || [
              "Integrity & Transparency",
              "Excellence & Professionalism",
              "Seafarer Welfare First",
              "Compliance & Safety",
              "Continuous Improvement",
              "Customer Satisfaction"
            ]).map((value: string, index: number) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Objectives */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Quality Objectives</h2>
          <div className="prose max-w-none text-gray-700">
            <p className="text-lg leading-relaxed whitespace-pre-line">
              {vision?.objectives || `Our quality management system is designed to:

• Ensure 100% compliance with MLC 2006, STCW 2010, and ISM Code requirements
• Maintain seafarer satisfaction rating above 90%
• Achieve zero major non-conformities in external audits
• Provide timely crew replacement services within 48 hours of notification
• Maintain accurate documentation with 99.9% accuracy rate
• Foster continuous professional development for all crew members
• Establish long-term partnerships with reputable ship owners and principals`}
            </p>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="bg-gradient-to-r from-blue-900 to-cyan-900 rounded-2xl shadow-2xl p-8 text-white">
          <h2 className="text-2xl font-extrabold mb-6 text-center">Certifications & Compliance</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">ISO 9001</div>
              <div className="text-blue-200">Quality Management</div>
              <div className="text-sm text-blue-300 mt-1">2015 Standard</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">MLC 2006</div>
              <div className="text-cyan-200">Maritime Labour</div>
              <div className="text-sm text-cyan-300 mt-1">Convention Compliant</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">STCW</div>
              <div className="text-blue-200">Training Standards</div>
              <div className="text-sm text-blue-300 mt-1">2010 Manila Amendments</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">ISM Code</div>
              <div className="text-cyan-200">Safety Management</div>
              <div className="text-sm text-cyan-300 mt-1">Certified System</div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-gray-500">
          <p className="text-sm">
            HGQS Procedures Manual - Annex A | Document No: HGQS-PM | Revision: 00 | Effective Date: 2023.07.03
          </p>
        </div>
      </div>
    </div>
  );
}
