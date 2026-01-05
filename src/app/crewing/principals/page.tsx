"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Vessel {
  id: string;
  name: string;
  imoNumber: string | null;
  flag: string;
  type: string;
  dwt: number | null;
  gt: number | null;
  status: string;
}

interface Principal {
  id: string;
  name: string;
  country: string;
  address: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  registrationNumber: string | null;
  agreementDate: string | null;
  agreementExpiry: string | null;
  status: string;
  vessels: Vessel[];
  _count?: {
    vessels: number;
    assignments: number;
  };
}

export default function PrincipalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showVesselForm, setShowVesselForm] = useState(false);
  const [selectedPrincipal, setSelectedPrincipal] = useState<Principal | null>(null);
  const [editingPrincipal, setEditingPrincipal] = useState<Principal | null>(null);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    country: "INDONESIA",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
    taxId: "",
    registrationNumber: "",
    agreementDate: "",
    agreementExpiry: "",
    status: "ACTIVE",
  });

  const [vesselFormData, setVesselFormData] = useState({
    name: "",
    imoNumber: "",
    flag: "PANAMA",
    type: "TANKER",
    dwt: "",
    gt: "",
    status: "ACTIVE",
    principalId: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchPrincipals();
  }, [session, status, router]);

  const fetchPrincipals = async () => {
    try {
      const response = await fetch("/api/principals");
      if (response.ok) {
        const data = await response.json();
        setPrincipals(data);
      }
    } catch (error) {
      console.error("Error fetching principals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPrincipal
        ? `/api/principals/${editingPrincipal.id}`
        : "/api/principals";
      const method = editingPrincipal ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        alert(`Principal ${editingPrincipal ? "updated" : "created"} successfully!`);
        // Refresh data after successful update
        setTimeout(() => {
          fetchPrincipals();
        }, 500);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to save principal"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving principal");
    }
  };

  const handleVesselSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleVesselSubmit called with data:", vesselFormData);
    try {
      const url = editingVessel
        ? `/api/vessels/${editingVessel.id}`
        : "/api/vessels";
      const method = editingVessel ? "PUT" : "POST";
      console.log(`Sending ${method} request to ${url}`);

      const payload = {
        ...vesselFormData,
        dwt: vesselFormData.dwt ? parseFloat(vesselFormData.dwt) : null,
        gt: vesselFormData.gt ? parseFloat(vesselFormData.gt) : null,
      };

      console.log("Payload:", payload);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        resetVesselForm();
        alert(`Vessel ${editingVessel ? "updated" : "created"} successfully!`);
        // Refresh data after successful update
        setTimeout(() => {
          fetchPrincipals();
        }, 500);
      } else {
        const error = await response.json();
        console.error("Error response:", error);
        alert(`Error: ${error.error || "Failed to save vessel"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving vessel");
    }
  };

  const handleEdit = (principal: Principal) => {
    setEditingPrincipal(principal);
    setFormData({
      name: principal.name,
      country: principal.country || "INDONESIA",
      address: principal.address || "",
      contactPerson: principal.contactPerson || "",
      phone: principal.phone || "",
      email: principal.email || "",
      taxId: principal.taxId || "",
      registrationNumber: principal.registrationNumber || "",
      agreementDate: principal.agreementDate
        ? principal.agreementDate.split("T")[0]
        : "",
      agreementExpiry: principal.agreementExpiry
        ? principal.agreementExpiry.split("T")[0]
        : "",
      status: principal.status || "ACTIVE",
    });
    setShowForm(true);
  };

  const handleEditVessel = (vessel: Vessel, principal: Principal) => {
    setEditingVessel(vessel);
    setSelectedPrincipal(principal);
    setVesselFormData({
      name: vessel.name,
      imoNumber: vessel.imoNumber || "",
      flag: vessel.flag,
      type: vessel.type,
      dwt: vessel.dwt?.toString() || "",
      gt: vessel.gt?.toString() || "",
      status: vessel.status,
      principalId: principal.id,
    });
    setShowVesselForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this principal?")) return;

    try {
      const response = await fetch(`/api/principals/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPrincipals();
        alert("Principal deleted successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to delete principal"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error deleting principal");
    }
  };

  const handleDeleteVessel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vessel?")) return;

    try {
      const response = await fetch(`/api/vessels/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPrincipals();
        alert("Vessel deleted successfully!");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to delete vessel"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error deleting vessel");
    }
  };

  const handleAddVessel = (principal: Principal) => {
    console.log("handleAddVessel called with principal:", principal);
    setSelectedPrincipal(principal);
    setVesselFormData({
      name: "",
      imoNumber: "",
      flag: "PANAMA",
      type: "TANKER",
      dwt: "",
      gt: "",
      status: "ACTIVE",
      principalId: principal.id,
    });
    setEditingVessel(null);
    setShowVesselForm(true);
    console.log("showVesselForm set to true");
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPrincipal(null);
    setFormData({
      name: "",
      country: "INDONESIA",
      address: "",
      contactPerson: "",
      phone: "",
      email: "",
      taxId: "",
      registrationNumber: "",
      agreementDate: "",
      agreementExpiry: "",
      status: "ACTIVE",
    });
  };

  const resetVesselForm = () => {
    setShowVesselForm(false);
    setEditingVessel(null);
    setSelectedPrincipal(null);
    setVesselFormData({
      name: "",
      imoNumber: "",
      flag: "PANAMA",
      type: "TANKER",
      dwt: "",
      gt: "",
      status: "ACTIVE",
      principalId: "",
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Principals Management
              </h1>
              <p className="text-gray-700">
                Manage ship owners and their vessels
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/crewing"
                className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:border-blue-500 hover:text-blue-700 transition-all duration-200 shadow-md hover:shadow-md"
              >
                ← Back to Crewing
              </Link>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
              >
                {showForm ? "Cancel" : "+ Add Principal"}
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Principal Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border-2 border-gray-100">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
              {editingPrincipal ? "Edit Principal" : "Add New Principal"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="e.g., ABC Shipping Co."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="INDONESIA">Indonesia</option>
                    <option value="SINGAPORE">Singapore</option>
                    <option value="JAPAN">Japan</option>
                    <option value="KOREA">South Korea</option>
                    <option value="CHINA">China</option>
                    <option value="HONG_KONG">Hong Kong</option>
                    <option value="GREECE">Greece</option>
                    <option value="NORWAY">Norway</option>
                    <option value="UK">United Kingdom</option>
                    <option value="USA">United States</option>
                    <option value="PANAMA">Panama</option>
                    <option value="LIBERIA">Liberia</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="Company address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPerson: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="Contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="+62 xxx xxx xxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="email@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) =>
                      setFormData({ ...formData, taxId: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="Tax identification number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="Company registration number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Agreement Date
                  </label>
                  <input
                    type="date"
                    value={formData.agreementDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        agreementDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Agreement Expiry
                  </label>
                  <input
                    type="date"
                    value={formData.agreementExpiry}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        agreementExpiry: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  {editingPrincipal ? "Update Principal" : "Create Principal"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add/Edit Vessel Form */}
        {showVesselForm && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border-2 border-green-100">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
              {editingVessel ? "Edit Vessel" : "Add New Vessel"}
            </h2>
            <p className="text-gray-700 mb-6">
              Principal: <span className="font-semibold">{selectedPrincipal?.name}</span>
            </p>
            <form onSubmit={handleVesselSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vessel Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={vesselFormData.name}
                    onChange={(e) =>
                      setVesselFormData({
                        ...vesselFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                    placeholder="e.g., MV PACIFIC STAR"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    IMO Number
                  </label>
                  <input
                    type="text"
                    value={vesselFormData.imoNumber}
                    onChange={(e) =>
                      setVesselFormData({
                        ...vesselFormData,
                        imoNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                    placeholder="IMO1234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Flag *
                  </label>
                  <select
                    value={vesselFormData.flag}
                    onChange={(e) =>
                      setVesselFormData({
                        ...vesselFormData,
                        flag: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  >
                    <option value="PANAMA">Panama</option>
                    <option value="LIBERIA">Liberia</option>
                    <option value="MARSHALL_ISLANDS">Marshall Islands</option>
                    <option value="SINGAPORE">Singapore</option>
                    <option value="BAHAMAS">Bahamas</option>
                    <option value="MALTA">Malta</option>
                    <option value="INDONESIA">Indonesia</option>
                    <option value="SOUTH_KOREA">South Korea</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vessel Type *
                  </label>
                  <select
                    value={vesselFormData.type}
                    onChange={(e) =>
                      setVesselFormData({
                        ...vesselFormData,
                        type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  >
                    <option value="TANKER">Tanker</option>
                    <option value="BULK_CARRIER">Bulk Carrier</option>
                    <option value="CONTAINER">Container Ship</option>
                    <option value="GENERAL_CARGO">General Cargo</option>
                    <option value="LNG_CARRIER">LNG Carrier</option>
                    <option value="LPG_CARRIER">LPG Carrier</option>
                    <option value="CHEMICAL_TANKER">Chemical Tanker</option>
                    <option value="REEFER">Reefer</option>
                    <option value="RO_RO">Ro-Ro</option>
                    <option value="PASSENGER">Passenger Ship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    DWT (Deadweight Tonnage)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={vesselFormData.dwt}
                    onChange={(e) =>
                      setVesselFormData({
                        ...vesselFormData,
                        dwt: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                    placeholder="e.g., 50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    GT (Gross Tonnage)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={vesselFormData.gt}
                    onChange={(e) =>
                      setVesselFormData({
                        ...vesselFormData,
                        gt: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                    placeholder="e.g., 30000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={vesselFormData.status}
                    onChange={(e) =>
                      setVesselFormData({
                        ...vesselFormData,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="UNDER_REPAIR">Under Repair</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={resetVesselForm}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  {editingVessel ? "Update Vessel" : "Create Vessel"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Principals List */}
        {principals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-100">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              No Principals Yet
            </h3>
            <p className="text-gray-700 mb-6">
              Add your first principal to get started
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              + Add Principal
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {principals.map((principal) => (
              <div
                key={principal.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden hover:border-blue-300 transition-all duration-200"
              >
                {/* Principal Header */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b-2 border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                          {principal.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-2xl font-extrabold text-gray-900">
                            {principal.name}
                          </h3>
                          <p className="text-gray-700">{principal.country}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {principal.contactPerson && (
                          <div>
                            <div className="text-sm text-gray-700 mb-1">
                              Contact Person
                            </div>
                            <div className="font-semibold text-gray-900">
                              {principal.contactPerson}
                            </div>
                          </div>
                        )}
                        {principal.phone && (
                          <div>
                            <div className="text-sm text-gray-700 mb-1">
                              Phone
                            </div>
                            <div className="font-semibold text-gray-900">
                              {principal.phone}
                            </div>
                          </div>
                        )}
                        {principal.email && (
                          <div>
                            <div className="text-sm text-gray-700 mb-1">
                              Email
                            </div>
                            <div className="font-semibold text-gray-900">
                              {principal.email}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-gray-700 mb-1">
                            Status
                          </div>
                          <span
                            className={`inline-block px-3 py-2 rounded-full text-xs font-semibold ${
                              principal.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {principal.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Principal Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(principal)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all duration-200"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleAddVessel(principal)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all duration-200"
                      >
                        + Add Vessel
                      </button>
                      <a
                        href={`/api/forms/ac-01/${principal.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 transition-all duration-200 text-center"
                      >
                        📄 AC-01 Form
                      </a>
                      <button
                        onClick={() => handleDelete(principal.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all duration-200"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vessels List */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900">
                      Vessels ({principal.vessels?.length || 0})
                    </h4>
                  </div>

                  {principal.vessels && principal.vessels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {principal.vessels.map((vessel) => (
                        <div
                          key={vessel.id}
                          className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border-2 border-gray-300 hover:border-green-400 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="text-lg font-bold text-gray-900 mb-1">
                                {vessel.name}
                              </h5>
                              <p className="text-sm text-gray-800">
                                {vessel.type} • {vessel.flag}
                              </p>
                            </div>
                            <span
                              className={`inline-block px-4 py-2 rounded-lg text-xs font-semibold ${
                                vessel.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : vessel.status === "UNDER_REPAIR"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {vessel.status}
                            </span>
                          </div>

                          <div className="space-y-2 mb-3">
                            {vessel.imoNumber && (
                              <div className="text-sm">
                                <span className="text-gray-500">IMO:</span>{" "}
                                <span className="font-semibold">
                                  {vessel.imoNumber}
                                </span>
                              </div>
                            )}
                            {vessel.dwt && (
                              <div className="text-sm">
                                <span className="text-gray-500">DWT:</span>{" "}
                                <span className="font-semibold">
                                  {vessel.dwt.toLocaleString()} MT
                                </span>
                              </div>
                            )}
                            {vessel.gt && (
                              <div className="text-sm">
                                <span className="text-gray-500">GT:</span>{" "}
                                <span className="font-semibold">
                                  {vessel.gt.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleEditVessel(vessel, principal)
                              }
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all duration-200"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteVessel(vessel.id)}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-all duration-200"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                      <div className="text-4xl mb-2">🚢</div>
                      <p className="text-gray-700 mb-3">
                        No vessels yet for this principal
                      </p>
                      <button
                        onClick={() => handleAddVessel(principal)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all duration-200"
                      >
                        + Add First Vessel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
