"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RiskFormProps {
  riskId?: string;
  initialData?: Partial<{
    title: string;
    description: string;
    source: string;
    probability: number;
    impact: number;
    treatmentStrategy: string;
    treatmentPlan: string;
  }>;
}

export default function RiskFormContent({ riskId, initialData }: RiskFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(
    initialData || {
      title: "",
      description: "",
      source: "REGULATORY",
      probability: 3,
      impact: 3,
      treatmentStrategy: "MITIGATE",
      treatmentPlan: "",
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Record<string, unknown>) => ({
      ...prev,
      [name]: name === "probability" || name === "impact" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = riskId ? "PUT" : "POST";
      const url = riskId ? `/api/risks/${riskId}` : "/api/risks";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || `Failed to ${riskId ? "update" : "create"} risk`);
      }

      const data = await res.json();
      router.push(`/hgqs/risks/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const riskScore = formData.probability * formData.impact;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Risk Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Key Personnel Dependency"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the risk and its context..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      {/* Source */}
      <div className="mb-6">
        <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
          Risk Source
        </label>
        <select
          id="source"
          name="source"
          value={formData.source}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option>REGULATORY</option>
          <option>OPERATIONAL</option>
          <option>STRATEGIC</option>
          <option>FINANCIAL</option>
          <option>ENVIRONMENTAL</option>
        </select>
      </div>

      {/* Probability & Impact */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="probability" className="block text-sm font-medium text-gray-700 mb-2">
            Probability (1-5)
          </label>
          <select
            id="probability"
            name="probability"
            value={formData.probability}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num} - {["Very Unlikely", "Unlikely", "Possible", "Likely", "Almost Certain"][num - 1]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-2">
            Impact (1-5)
          </label>
          <select
            id="impact"
            name="impact"
            value={formData.impact}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num} - {["Negligible", "Minor", "Moderate", "Major", "Catastrophic"][num - 1]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Risk Score Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">Risk Score (Probability × Impact)</p>
        <p className={`text-3xl font-bold ${riskScore >= 15 ? "text-red-600" : riskScore >= 10 ? "text-yellow-600" : "text-green-600"}`}>
          {riskScore}
        </p>
      </div>

      {/* Treatment Strategy */}
      <div className="mb-6">
        <label htmlFor="treatmentStrategy" className="block text-sm font-medium text-gray-700 mb-2">
          Treatment Strategy
        </label>
        <select
          id="treatmentStrategy"
          name="treatmentStrategy"
          value={formData.treatmentStrategy}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option>MITIGATE</option>
          <option>ACCEPT</option>
          <option>TRANSFER</option>
          <option>AVOID</option>
        </select>
      </div>

      {/* Treatment Plan */}
      <div className="mb-6">
        <label htmlFor="treatmentPlan" className="block text-sm font-medium text-gray-700 mb-2">
          Treatment Plan
        </label>
        <textarea
          id="treatmentPlan"
          name="treatmentPlan"
          value={formData.treatmentPlan}
          onChange={handleChange}
          placeholder="Describe the actions to treat this risk..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? "Saving..." : riskId ? "Update Risk" : "Create Risk"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
