'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface SeafarerFormData {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  placeOfBirth: string;
  rank: string;
  phone: string;
  email: string;
  heightCm: string;
  weightKg: string;
  coverallSize: string;
  shoeSize: string;
  waistSize: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
}

interface Seafarer {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  nationality: string | null;
  placeOfBirth: string | null;
  rank: string | null;
  phone: string | null;
  email: string | null;
  heightCm: number | null;
  weightKg: number | null;
  coverallSize: string | null;
  shoeSize: string | null;
  waistSize: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
}

export default function EditSeafarerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<SeafarerFormData>({
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    placeOfBirth: '',
    rank: '',
    phone: '',
    email: '',
    heightCm: '',
    weightKg: '',
    coverallSize: '',
    shoeSize: '',
    waistSize: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    const fetchSeafarer = async () => {
      try {
        const response = await fetch(`/api/seafarers/${id}`);
        if (response.ok) {
          const seafarer: Seafarer = await response.json();
          setFormData({
            fullName: seafarer.fullName,
            dateOfBirth: seafarer.dateOfBirth ? seafarer.dateOfBirth.split('T')[0] : '',
            nationality: seafarer.nationality || '',
            placeOfBirth: seafarer.placeOfBirth || '',
            rank: seafarer.rank || '',
            phone: seafarer.phone || '',
            email: seafarer.email || '',
            heightCm: seafarer.heightCm !== null && seafarer.heightCm !== undefined ? String(seafarer.heightCm) : '',
            weightKg: seafarer.weightKg !== null && seafarer.weightKg !== undefined ? String(seafarer.weightKg) : '',
            coverallSize: seafarer.coverallSize || '',
            shoeSize: seafarer.shoeSize || '',
            waistSize: seafarer.waistSize || '',
            emergencyContactName: seafarer.emergencyContactName || '',
            emergencyContactRelation: seafarer.emergencyContactRelation || '',
            emergencyContactPhone: seafarer.emergencyContactPhone || '',
          });
        } else {
          alert('Failed to fetch seafarer');
          router.push('/crewing/seafarers');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error fetching seafarer');
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchSeafarer();
    }
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        fullName: formData.fullName,
        nationality: formData.nationality || null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        placeOfBirth: formData.placeOfBirth || null,
        rank: formData.rank || null,
        phone: formData.phone || null,
        email: formData.email || null,
        heightCm: formData.heightCm ? Number(formData.heightCm) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        coverallSize: formData.coverallSize || null,
        shoeSize: formData.shoeSize || null,
        waistSize: formData.waistSize || null,
        emergencyContactName: formData.emergencyContactName || null,
        emergencyContactRelation: formData.emergencyContactRelation || null,
        emergencyContactPhone: formData.emergencyContactPhone || null,
      };

      const response = await fetch(`/api/seafarers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/crewing/seafarers');
      } else {
        alert('Failed to update seafarer');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating seafarer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (fetchLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Seafarer</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              <p className="text-sm text-gray-600">Perbarui data identitas dasar kru.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Place of Birth
                </label>
                <input
                  type="text"
                  id="placeOfBirth"
                  name="placeOfBirth"
                  value={formData.placeOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Nationality
                </label>
                <input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="rank" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Rank / Position
                </label>
                <input
                  type="text"
                  id="rank"
                  name="rank"
                  value={formData.rank}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Chief Engineer"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              <p className="text-sm text-gray-600">Update nomor telepon dan email kru.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., +62 812 3456 7890"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="crew.email@example.com"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Physical & Uniform Measurements</h2>
              <p className="text-sm text-gray-600">Catat ukuran kru untuk kebutuhan workwear dan safety gear.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label htmlFor="heightCm" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Height (cm)
                </label>
                <input
                  type="number"
                  id="heightCm"
                  name="heightCm"
                  min="0"
                  value={formData.heightCm}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="weightKg" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  id="weightKg"
                  name="weightKg"
                  min="0"
                  value={formData.weightKg}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="coverallSize" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Coverall Size
                </label>
                <input
                  type="text"
                  id="coverallSize"
                  name="coverallSize"
                  value={formData.coverallSize}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., L, XL, 52"
                />
              </div>
              <div>
                <label htmlFor="shoeSize" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Safety Shoe Size
                </label>
                <input
                  type="text"
                  id="shoeSize"
                  name="shoeSize"
                  value={formData.shoeSize}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 42"
                />
              </div>
              <div>
                <label htmlFor="waistSize" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Waist Size
                </label>
                <input
                  type="text"
                  id="waistSize"
                  name="waistSize"
                  value={formData.waistSize}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 32"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Emergency Contact / Next of Kin</h2>
              <p className="text-sm text-gray-600">Detail kontak darurat untuk kebutuhan komunikasi keluarga.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Contact Name
                </label>
                <input
                  type="text"
                  id="emergencyContactName"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nama keluarga terdekat"
                />
              </div>
              <div>
                <label htmlFor="emergencyContactRelation" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Relationship
                </label>
                <input
                  type="text"
                  id="emergencyContactRelation"
                  name="emergencyContactRelation"
                  value={formData.emergencyContactRelation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Spouse, Father"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-900 mb-2 font-semibold">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., +62 811 1234 5678"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Seafarer'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}