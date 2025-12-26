'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CrewSummary {
  id: string;
  fullName: string;
  rank: string | null;
  phone: string | null;
  email: string | null;
  assignments?: Array<{
    vessel?: {
      name: string;
    } | null;
    status: string;
  }>;
  coverallSize?: string | null;
  shoeSize?: string | null;
  waistSize?: string | null;
}

type CrewStatusOption = 'NEW' | 'EX_CREW';

type ReceiptForm = {
  crewName: string;
  crewRank: string;
  phone: string;
  email: string;
  vesselName: string;
  crewStatus: CrewStatusOption;
  lastSignOffDate: string;
  lastSignOffPort: string;
  wearpackSize: string;
  shoeSize: string;
  waistSize: string;
  notes: string;
  deliveryLocation: string;
  deliveryDate: string;
  handedOverByName: string;
  receivedByName: string;
};

type ReceiptItem = {
  certificateName: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  remarks: string;
};

const blankItem: ReceiptItem = {
  certificateName: '',
  certificateNumber: '',
  issueDate: '',
  expiryDate: '',
  remarks: '',
};

export default function NewDocumentReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const seafarerId = params.id as string;

  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crew, setCrew] = useState<CrewSummary | null>(null);
  const [formData, setFormData] = useState<ReceiptForm>({
    crewName: '',
    crewRank: '',
    phone: '',
    email: '',
    vesselName: '',
    crewStatus: 'NEW',
    lastSignOffDate: '',
    lastSignOffPort: '',
    wearpackSize: '',
    shoeSize: '',
    waistSize: '',
    notes: '',
    deliveryLocation: '',
    deliveryDate: '',
    handedOverByName: '',
    receivedByName: '',
  });
  const [items, setItems] = useState<ReceiptItem[]>([{ ...blankItem }]);

  useEffect(() => {
    const fetchCrew = async () => {
      try {
        const response = await fetch(`/api/seafarers/${seafarerId}`);
        if (!response.ok) {
          throw new Error('Failed to load seafarer data');
        }
        const data: CrewSummary = await response.json();
        setCrew(data);
        setFormData((previous) => ({
          ...previous,
          crewName: data.fullName,
          crewRank: data.rank ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          vesselName: deriveActiveVessel(data) ?? '',
          wearpackSize: data.coverallSize ?? '',
          shoeSize: data.shoeSize ?? '',
          waistSize: data.waistSize ?? '',
        }));
      } catch (err) {
        console.error(err);
        setError('Data kru tidak bisa diambil. Silakan kembali ke halaman sebelumnya.');
      } finally {
        setInitializing(false);
      }
    };

    if (seafarerId) {
      fetchCrew();
    }
  }, [seafarerId]);

  const crewStatusOptions: Array<{ value: CrewStatusOption; label: string }> = useMemo(() => (
    [
      { value: 'NEW', label: 'Crew New' },
      { value: 'EX_CREW', label: 'Ex Crew' },
    ]
  ), []);

  const handleInputChange = (key: keyof ReceiptForm, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleItemChange = (index: number, key: keyof ReceiptItem, value: string) => {
    setItems((previous) => previous.map((item, idx) => (
      idx === index ? { ...item, [key]: value } : item
    )));
  };

  const addItemRow = () => {
    setItems((previous) => [...previous, { ...blankItem }]);
  };

  const removeItemRow = (index: number) => {
    setItems((previous) => previous.filter((_, idx) => idx !== index));
  };

  const submitReceipt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        crewName: formData.crewName,
        crewRank: formData.crewRank,
        phone: formData.phone,
        email: formData.email,
        vesselName: formData.vesselName,
        crewStatus: formData.crewStatus,
        lastSignOffDate: formData.lastSignOffDate || null,
        lastSignOffPort: formData.lastSignOffPort,
        wearpackSize: formData.wearpackSize,
        shoeSize: formData.shoeSize,
        waistSize: formData.waistSize,
        notes: formData.notes,
        deliveryLocation: formData.deliveryLocation,
        deliveryDate: formData.deliveryDate || null,
        handedOverByName: formData.handedOverByName,
        receivedByName: formData.receivedByName,
        items: items
          .map((item, index) => ({
            certificateName: item.certificateName.trim(),
            certificateNumber: item.certificateNumber,
            issueDate: item.issueDate || null,
            expiryDate: item.expiryDate || null,
            remarks: item.remarks,
            orderIndex: index,
          }))
          .filter((item) => item.certificateName.length > 0),
      };

      const response = await fetch(`/api/seafarers/${seafarerId}/document-receipts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody?.error ?? 'Gagal menyimpan receipt dokumen.';
        throw new Error(message);
      }

      router.push(`/crewing/seafarers/${seafarerId}/documents`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-700">Menyiapkan form receipt dokumen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white shadow rounded-xl p-8 text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Terjadi kesalahan</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!crew) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Document Receipt</h1>
            <p className="text-gray-700">{crew.fullName}</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/crewing/seafarers/${seafarerId}/documents`)}
              className="px-5 py-2 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-100"
              disabled={submitting}
            >
              Back to Dokumen
            </button>
          </div>
        </div>

        <form onSubmit={submitReceipt} className="bg-white shadow-xl rounded-2xl p-8 space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informasi Awal Crew</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Crew</label>
                <input
                  type="text"
                  value={formData.crewName}
                  onChange={(event) => handleInputChange('crewName', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Jabatan / Rank</label>
                <input
                  type="text"
                  value={formData.crewRank}
                  onChange={(event) => handleInputChange('crewRank', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => handleInputChange('phone', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => handleInputChange('email', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Kapal</label>
                <input
                  type="text"
                  value={formData.vesselName}
                  onChange={(event) => handleInputChange('vesselName', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Crew</h2>
            <div className="flex flex-wrap gap-4">
              {crewStatusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('crewStatus', option.value)}
                  className={`px-5 py-2 rounded-lg border ${
                    formData.crewStatus === option.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {formData.crewStatus === 'EX_CREW' && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date Turun Kapal</label>
                  <input
                    type="date"
                    value={formData.lastSignOffDate}
                    onChange={(event) => handleInputChange('lastSignOffDate', event.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pelabuhan Turun</label>
                  <input
                    type="text"
                    value={formData.lastSignOffPort}
                    onChange={(event) => handleInputChange('lastSignOffPort', event.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ukuran Seragam</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Wearpack</label>
                <input
                  type="text"
                  value={formData.wearpackSize}
                  onChange={(event) => handleInputChange('wearpackSize', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sepatu Safety</label>
                <input
                  type="text"
                  value={formData.shoeSize}
                  onChange={(event) => handleInputChange('shoeSize', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ukuran Pinggang</label>
                <input
                  type="text"
                  value={formData.waistSize}
                  onChange={(event) => handleInputChange('waistSize', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Checklist Dokumen</h2>
              <button
                type="button"
                onClick={addItemRow}
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
              >
                + Tambah Baris
              </button>
            </div>
            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Sertifikat *</label>
                      <input
                        type="text"
                        value={item.certificateName}
                        onChange={(event) => handleItemChange(index, 'certificateName', event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor Sertifikat</label>
                      <input
                        type="text"
                        value={item.certificateNumber}
                        onChange={(event) => handleItemChange(index, 'certificateNumber', event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Issued</label>
                      <input
                        type="date"
                        value={item.issueDate}
                        onChange={(event) => handleItemChange(index, 'issueDate', event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Expired</label>
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(event) => handleItemChange(index, 'expiryDate', event.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan</label>
                    <textarea
                      value={item.remarks}
                      onChange={(event) => handleItemChange(index, 'remarks', event.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {items.length > 1 && (
                    <div className="mt-4 text-right">
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="px-4 py-2 rounded-lg border border-red-500 text-red-600 hover:bg-red-50"
                      >
                        Delete Baris
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan</label>
              <textarea
                value={formData.notes}
                onChange={(event) => handleInputChange('notes', event.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lokasi Penyerahan</label>
                <input
                  type="text"
                  value={formData.deliveryLocation}
                  onChange={(event) => handleInputChange('deliveryLocation', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Jakarta"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date Penyerahan</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(event) => handleInputChange('deliveryDate', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Yang Menyerahkan</label>
                <input
                  type="text"
                  value={formData.handedOverByName}
                  onChange={(event) => handleInputChange('handedOverByName', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Yang Menerima</label>
                <input
                  type="text"
                  value={formData.receivedByName}
                  onChange={(event) => handleInputChange('receivedByName', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-4 justify-end pt-4">
            <button
              type="button"
              onClick={() => router.push(`/crewing/seafarers/${seafarerId}/documents`)}
              className="px-6 py-3 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-100"
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Document Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function deriveActiveVessel(crew: CrewSummary): string | null {
  if (!crew.assignments || crew.assignments.length === 0) {
    return null;
  }
  const current = crew.assignments.find((assignment) => assignment.status === 'ONBOARD' || assignment.status === 'PLANNED');
  if (current?.vessel?.name) {
    return current.vessel.name;
  }
  return crew.assignments[0]?.vessel?.name ?? null;
}
