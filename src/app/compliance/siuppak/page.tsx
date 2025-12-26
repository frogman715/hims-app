'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SiuppakReportsPage() {
  const [reportType, setReportType] = useState<'bulanan' | 'semester' | 'tahunan'>('semester');
  const [period, setPeriod] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        period: period,
        year: year,
      });

      const response = await fetch(`/api/compliance/siuppak?${params}`);
      
      if (response.ok) {
        // Download Excel file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LAPORAN_${reportType.toUpperCase()}_SIUPPAK_${year}${period ? '_' + period : ''}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to generate report'}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href="/crewing" 
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Crewing Department
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Report SIUPPAK</h1>
          <p className="text-gray-700 mt-2">
            Crew Recruitment and Placement Activity Report for Transportation Audit
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Tentang Report SIUPPAK</h3>
              <p className="text-sm text-blue-700">
                Report ini digenerate otomatis dari data crew movements (sign on/off), vessel assignments, dan principal agreements. 
                Excel file follows official Transportation Ministry format with 40 data columns for SIUPPAK audit.
              </p>
            </div>
          </div>
        </div>

        {/* Report Generator */}
        <div className="bg-white rounded-lg shadow border border-gray-300 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Report</h2>

          {/* Report Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Jenis Report <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setReportType('bulanan')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === 'bulanan'
                    ? 'border-blue-500 bg-blue-100 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">📅</div>
                <div className="font-semibold">Monthan</div>
                <div className="text-sm text-gray-700 mt-1">Report per bulan</div>
              </button>

              <button
                onClick={() => setReportType('semester')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === 'semester'
                    ? 'border-blue-500 bg-blue-100 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold">Semester</div>
                <div className="text-sm text-gray-700 mt-1">Report 6 bulan</div>
              </button>

              <button
                onClick={() => setReportType('tahunan')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === 'tahunan'
                    ? 'border-blue-500 bg-blue-100 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="font-semibold">Yearan</div>
                <div className="text-sm text-gray-700 mt-1">Report per tahun</div>
              </button>
            </div>
          </div>

          {/* Period Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-blue-500"
              >
                {[2025, 2024, 2023, 2022].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {reportType !== 'tahunan' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {reportType === 'bulanan' ? 'Month' : 'Semester'} <span className="text-red-500">*</span>
                </label>
                {reportType === 'bulanan' ? (
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Month</option>
                    <option value="01">Januari</option>
                    <option value="02">Februari</option>
                    <option value="03">Maret</option>
                    <option value="04">April</option>
                    <option value="05">Mei</option>
                    <option value="06">Juni</option>
                    <option value="07">Juli</option>
                    <option value="08">Agustus</option>
                    <option value="09">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                  </select>
                ) : (
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:border-blue-500"
                  >
                    <option value="">Pilih Semester</option>
                    <option value="1">Semester 1 (Januari - Juni)</option>
                    <option value="2">Semester 2 (Juli - Desember)</option>
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerateReport}
              disabled={loading || (reportType !== 'tahunan' && !period)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate & Download Excel
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report Structure Info */}
        <div className="mt-8 bg-white rounded-lg shadow border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Struktur Report</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Sheet 1: Report {reportType.charAt(0).toUpperCase() + reportType.slice(1)}</h4>
              <div className="text-sm text-gray-800 space-y-1">
                <p><strong>40 Kolom Data:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Info Perusahaan: Nama, SIUKAK 281.40/2023, Penanggung Jawab, Alamat, Kontak</li>
                  <li>Data Pelaut: Nama, Kewarganegaraan, Kode Pelaut, Buku Pelaut, No. PKL, Paspor, Jabatan</li>
                  <li>Data Kapal: Nama Kapal, IMO/MMSI, Bendera, Jenis Kapal, Principal, CBA Number</li>
                  <li>Movement Data: Sign On/Off Date & Port, Daerah Pelayaran, DN/LN, Jenis Kelamin</li>
                  <li>Nearest Family: Name & Phone Number</li>
                </ul>
              </div>
            </div>

            {reportType === 'tahunan' && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Sheet 2: Data Principal & CBA</h4>
                <div className="text-sm text-gray-800">
                  <p>List of ship owners/operators with CBA number and agreement is valid period</p>
                </div>
              </div>
            )}

            {reportType === 'tahunan' && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Sheet 3: Statistik Monthan</h4>
                <div className="text-sm text-gray-800">
                  <p>Breakdown per bulan: A* (diberangkatkan), B* (dipulangkan), DN/LN, Gender</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reference File Info */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-sm text-gray-800">
              <strong>Format Reference:</strong> LAPORAN SEMESTER KEGIATAN PEREKRUTAN DAN PENEMPATAN AWAK KAPAL-DEPERLA.xlsx
              <br />
              <span className="text-xs">Generated report follows official Transportation format for SIUPPAK audit compliance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
