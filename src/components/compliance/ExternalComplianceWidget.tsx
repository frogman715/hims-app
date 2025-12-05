'use client';

import { useEffect, useState } from 'react';

interface ExternalComplianceStats {
  dephub: {
    total: number;
    verified: number;
    expired: number;
    pending: number;
  };
  schengen: {
    total: number;
    verified: number;
    expired: number;
    pending: number;
  };
}

interface Props {
  className?: string;
}

export default function ExternalComplianceWidget({ className = '' }: Props) {
  const [stats, setStats] = useState<ExternalComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/external-compliance/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching compliance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">External Compliance Systems</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">External Compliance Systems</h3>
        <p className="text-sm text-gray-500 mt-1">Real-time integration status</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Note about KOSMA */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 text-sm mb-1">KOSMA Certificate</h4>
              <p className="text-xs text-blue-700 mb-2">
                KOSMA adalah sertifikat pelatihan Korea (bukan compliance tracking). Data sertifikat KOSMA dikelola di <strong>Documents Management</strong>.
              </p>
              <div className="flex gap-2">
                <a
                  href="/crewing/documents?type=KOSMA"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition font-medium"
                >
                  View KOSMA Documents →
                </a>
                <a
                  href="https://www.marinerights.or.kr/fro_end_kor/html/main/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Apply Training
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Dephub Certificate */}
        <div className="border-l-4 border-green-500 pl-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="font-semibold text-gray-900">Dephub Indonesia</h4>
            </div>
            <div className="flex gap-2">
              <a
                href="https://pelaut.dephub.go.id/login-perusahaan"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition font-medium"
              >
                Verify Certificate →
              </a>
              <a
                href="https://pelaut.dephub.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:text-green-800 hover:underline"
              >
                Portal
              </a>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.dephub.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.dephub.verified}</div>
              <div className="text-xs text-gray-500">Verified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.dephub.expired}</div>
              <div className="text-xs text-gray-500">Expired</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.dephub.pending}</div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Validasi sijil dan sertifikat pelaut Indonesia
          </p>
        </div>

        {/* Schengen Visa Netherlands */}
        <div className="border-l-4 border-purple-500 pl-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-semibold text-gray-900">Schengen Visa NL</h4>
            </div>
            <div className="flex gap-2">
              <a
                href="https://consular.mfaservices.nl/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition font-medium"
              >
                Apply Visa →
              </a>
              <a
                href="https://consular.mfaservices.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-800 hover:underline"
              >
                Portal
              </a>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.schengen.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.schengen.verified}</div>
              <div className="text-xs text-gray-500">Approved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.schengen.expired}</div>
              <div className="text-xs text-gray-500">Expired</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.schengen.pending}</div>
              <div className="text-xs text-gray-500">Processing</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Visa Schengen Belanda untuk crew kapal tanker
          </p>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <a
          href="/compliance/external"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
        >
          View All Compliance Records →
        </a>
      </div>
    </div>
  );
}
