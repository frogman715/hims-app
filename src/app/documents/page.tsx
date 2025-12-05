import { redirect } from "next/navigation";

// DEPRECATED: This page uses mock data and has been replaced by /crewing/documents
// Redirect to the new location with real API integration
export default async function DocumentsPage() {
  redirect('/crewing/documents');
  {
    id: "1",
    crewName: "John Smith",
    rank: "Captain",
    docType: "PASSPORT",
    docNumber: "P123456",
    issueDate: "2020-01-15",
    expiryDate: "2025-01-15",
    status: "ACTIVE",
    daysUntilExpiry: 42,
  },
  {
    id: "2",
    crewName: "Maria Garcia",
    rank: "Chief Engineer",
    docType: "COC",
    docNumber: "COC78901",
    issueDate: "2021-03-20",
    expiryDate: "2024-12-20",
    status: "EXPIRED",
    daysUntilExpiry: -15,
  },
  {
    id: "3",
    crewName: "Ahmed Hassan",
    rank: "2nd Officer",
    docType: "MEDICAL",
    docNumber: "MED45678",
    issueDate: "2024-06-10",
    expiryDate: "2025-01-05",
    status: "EXPIRING",
    daysUntilExpiry: 32,
  },
  {
    id: "4",
    crewName: "Sarah Chen",
    rank: "Chief Cook",
    docType: "SEAMAN_BOOK",
    docNumber: "SB234567",
    issueDate: "2019-08-15",
    expiryDate: "2024-12-25",
    status: "EXPIRING",
    daysUntilExpiry: 21,
  },
  {
    id: "5",
    crewName: "Carlos Rodriguez",
    rank: "AB",
    docType: "BASIC_SAFETY",
    docNumber: "BS890123",
    issueDate: "2020-11-30",
    expiryDate: "2025-11-30",
    status: "ACTIVE",
    daysUntilExpiry: 362,
  },
];

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Check for expiring parameter from URL
  const expiringDays = searchParams.get("expiring");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  // Initialize filter based on URL parameter
  const [initialFilterSet, setInitialFilterSet] = useState(false);
  
  useEffect(() => {
    if (!initialFilterSet && expiringDays) {
      setFilterStatus("EXPIRING");
      setInitialFilterSet(true);
    }
  }, [expiringDays, initialFilterSet]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Filter documents
  const filteredDocuments = mockDocuments.filter((doc) => {
    // Status filter
    if (filterStatus !== "ALL" && doc.status !== filterStatus) {
      return false;
    }

    // Expiring days filter (from URL parameter)
    if (expiringDays) {
      const days = parseInt(expiringDays);
      if (doc.daysUntilExpiry > days || doc.daysUntilExpiry < 0) {
        return false;
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.crewName.toLowerCase().includes(query) ||
        doc.docType.toLowerCase().includes(query) ||
        doc.docNumber.toLowerCase().includes(query) ||
        doc.rank.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getStatusBadge = (status: string, daysUntilExpiry: number) => {
    if (status === "EXPIRED") {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          EXPIRED
        </span>
      );
    }
    if (daysUntilExpiry <= 30) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
          EXPIRING ({daysUntilExpiry}d)
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        ACTIVE
      </span>
    );
  };

  const stats = {
    total: mockDocuments.length,
    expiring: mockDocuments.filter((d) => d.daysUntilExpiry <= 30 && d.daysUntilExpiry > 0).length,
    expired: mockDocuments.filter((d) => d.daysUntilExpiry < 0).length,
    active: mockDocuments.filter((d) => d.daysUntilExpiry > 30).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📋 Documents Management</h1>
            <p className="text-gray-600 mt-1">
              {expiringDays
                ? `Documents expiring within ${expiringDays} days`
                : "Track and manage crew certificates & documents"}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 font-medium">Total Documents</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 font-medium">Active</div>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
            <div className="text-sm text-gray-600 font-medium">Expiring Soon</div>
            <div className="text-3xl font-bold text-orange-600">{stats.expiring}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600 font-medium">Expired</div>
            <div className="text-3xl font-bold text-red-600">{stats.expired}</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search by name, document type, or number..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus("ALL")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === "ALL"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("ACTIVE")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === "ACTIVE"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus("EXPIRING")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === "EXPIRING"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Expiring
              </button>
              <button
                onClick={() => setFilterStatus("EXPIRED")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === "EXPIRED"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Expired
              </button>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crew Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No documents found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{doc.crewName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doc.rank}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doc.docType.replace(/_/g, " ")}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{doc.docNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{doc.issueDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doc.expiryDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(doc.status, doc.daysUntilExpiry)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/crew/${doc.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/crewing/documents"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500"
          >
            <div className="flex items-center">
              <span className="text-3xl mr-4">📋</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">All Crew Documents</h3>
                <p className="text-sm text-gray-600">Manage all seafarer documents</p>
              </div>
            </div>
          </Link>

          <Link
            href="/compliance"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-center">
              <span className="text-3xl mr-4">✅</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Compliance Center</h3>
                <p className="text-sm text-gray-600">Track compliance & audits</p>
              </div>
            </div>
          </Link>

          <Link
            href="/crew"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500"
          >
            <div className="flex items-center">
              <span className="text-3xl mr-4">👥</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Crew Management</h3>
                <p className="text-sm text-gray-600">View all crew members</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}