'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReceiptListItem {
  id: string;
  crewId: string;
  crew: {
    id: string;
    fullName: string;
    rank: string | null;
  };
  vesselName: string | null;
  crewStatus: 'NEW' | 'EX_CREW';
  deliveryLocation: string | null;
  deliveryDate: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    certificateName: string;
    certificateNumber: string | null;
  }>;
  createdBy?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface SeafarerOption {
  id: string;
  fullName: string;
  rank: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function mapSeafarerOptions(data: unknown): SeafarerOption[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.reduce<SeafarerOption[]>((accumulator, item) => {
    if (!isRecord(item)) {
      return accumulator;
    }

    const { id, fullName, rank } = item;
    if (typeof id === 'string' && typeof fullName === 'string') {
      accumulator.push({
        id,
        fullName,
        rank: typeof rank === 'string' ? rank : null,
      });
    }

    return accumulator;
  }, []);
}

export default function DocumentReceiptDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [seafarers, setSeafarers] = useState<SeafarerOption[]>([]);
  const [selectedCrewId, setSelectedCrewId] = useState<string>('');
  const [filter, setFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [seafarersRes, receiptsRes] = await Promise.all([
          fetch('/api/seafarers'),
          fetch('/api/document-receipts'),
        ]);

        if (seafarersRes.ok) {
          const seafarersData = await seafarersRes.json();
          setSeafarers(mapSeafarerOptions(seafarersData));
        } else {
          throw new Error('Gagal memuat daftar crew');
        }

        if (receiptsRes.ok) {
          const receiptsData = await receiptsRes.json();
          setReceipts(Array.isArray(receiptsData) ? receiptsData : []);
        } else {
          throw new Error('Gagal memuat tanda terima');
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredReceipts = useMemo(() => {
    if (!filter.trim()) {
      return receipts;
    }
    const lower = filter.trim().toLowerCase();
    return receipts.filter((receipt) => {
      const crewName = receipt.crew?.fullName?.toLowerCase() ?? '';
      const vessel = receipt.vesselName?.toLowerCase() ?? '';
      return crewName.includes(lower) || vessel.includes(lower);
    });
  }, [filter, receipts]);

  const handleCreate = () => {
    if (!selectedCrewId) {
      setError('Pilih crew terlebih dahulu sebelum membuat tanda terima.');
      return;
    }
    router.push(`/crewing/seafarers/${selectedCrewId}/document-receipts/new`);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/document-receipts');
      if (response.ok) {
        const data = await response.json();
        setReceipts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) {
      return '-';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }
    return parsed.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => router.push('/crewing')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-400 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Kembali ke Crewing
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tanda Terima Dokumen Crew</h1>
              <p className="text-gray-700">
                Buat bukti penyerahan dokumen fisik crew dan arsipkan secara digital.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-5 py-2 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            {refreshing ? 'Memuat…' : 'Refresh Data'}
          </button>
        </header>

        <section className="bg-white shadow-xl rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Buat Tanda Terima Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="crewSelector">
                Pilih Crew
              </label>
              <select
                id="crewSelector"
                value={selectedCrewId}
                onChange={(event) => setSelectedCrewId(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">— Pilih crew yang menyerahkan dokumen —</option>
                {seafarers.map((crew) => (
                  <option key={crew.id} value={crew.id}>
                    {crew.fullName}
                    {crew.rank ? ` • ${crew.rank}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleCreate}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700"
                disabled={loading}
              >
                Buat Form
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white shadow-xl rounded-2xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Riwayat Tanda Terima</h2>
            <input
              type="search"
              placeholder="Cari crew atau kapal"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="w-full md:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-gray-600">Memuat data tanda terima...</div>
          ) : filteredReceipts.length === 0 ? (
            <div className="py-10 text-center text-gray-600">Belum ada tanda terima yang tercatat.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Crew
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Kapal / Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Penyerahan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Dokumen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-semibold">{receipt.crew?.fullName ?? '-'}</div>
                        <div className="text-gray-600 text-xs">{receipt.crew?.rank ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{receipt.vesselName ?? '-'}</div>
                        <div className="text-xs text-gray-600">
                          {receipt.crewStatus === 'NEW' ? 'Crew Baru' : 'Ex Crew'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>{receipt.deliveryLocation ?? '—'}</div>
                        <div className="text-xs text-gray-600">{formatDate(receipt.deliveryDate)}</div>
                        <div className="text-xs text-gray-500 mt-1">Dibuat {formatDate(receipt.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <ul className="space-y-1">
                          {receipt.items.slice(0, 3).map((item) => (
                            <li key={item.id} className="text-xs text-gray-700">
                              {item.certificateName}
                              {item.certificateNumber ? ` (${item.certificateNumber})` : ''}
                            </li>
                          ))}
                        </ul>
                        {receipt.items.length > 3 && (
                          <span className="text-xs text-gray-500">+{receipt.items.length - 3} lainnya</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/crewing/seafarers/${receipt.crewId}/documents`)}
                            className="px-3 py-2 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-100 text-xs"
                          >
                            Lihat di Dokumen Crew
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/crewing/seafarers/${receipt.crewId}/document-receipts/new?copy=${receipt.id}`)}
                            className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs"
                          >
                            Duplikasi Form
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
