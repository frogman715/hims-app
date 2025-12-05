"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCrewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    rank: "",
    lastVessel: "",
    phone: "",
    email: "",
    workClothesSize: "",
    waistSize: "",
    shoeSize: "",
    lastSignOffDate: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/crew", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/crew");
      } else {
        console.error("Failed to create crew");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/crew"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Crew
        </Link>
        <h1 className="text-2xl font-semibold">Add New Crew</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Rank *
            </label>
            <select
              name="rank"
              required
              value={formData.rank}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Rank</option>
              <option value="CAPTAIN">Captain</option>
              <option value="CHIEF_ENGINEER">Chief Engineer</option>
              <option value="CHIEF_OFFICER">Chief Officer</option>
              <option value="SECOND_ENGINEER">Second Engineer</option>
              <option value="SECOND_OFFICER">Second Officer</option>
              <option value="THIRD_ENGINEER">Third Engineer</option>
              <option value="THIRD_OFFICER">Third Officer</option>
              <option value="ELECTRICAL_ENGINEER">Electrical Engineer</option>
              <option value="BOATSWAIN">Boatswain</option>
              <option value="ABLE_SEAMAN">Able Seaman</option>
              <option value="ORDINARY_SEAMAN">Ordinary Seaman</option>
              <option value="OILER">Oiler</option>
              <option value="WIPER">Wiper</option>
              <option value="MOTORMAN">Motorman</option>
              <option value="FITTER">Fitter</option>
              <option value="COOK">Cook</option>
              <option value="MESSMAN">Messman</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Last Vessel
            </label>
            <input
              type="text"
              name="lastVessel"
              value={formData.lastVessel}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Work Clothes Size
            </label>
            <input
              type="text"
              name="workClothesSize"
              value={formData.workClothesSize}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., L, XL, XXL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Waist Size
            </label>
            <input
              type="text"
              name="waistSize"
              value={formData.waistSize}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., 32, 34"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Shoe Size
            </label>
            <input
              type="text"
              name="shoeSize"
              value={formData.shoeSize}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., 42/270"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Last Sign Off Date
            </label>
            <input
              type="date"
              name="lastSignOffDate"
              value={formData.lastSignOffDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Crew"}
          </button>
          <Link
            href="/crew"
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}