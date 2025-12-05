import { redirect } from "next/navigation";

// DEPRECATED: This page has been replaced by /crewing/seafarers
// Redirect to the new location
export default async function CrewPage() {
  redirect('/crewing/seafarers');
  const { crews, pagination } = await getCrews();

  return (
    <div className="px-6 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Crew Management</h1>
          <p className="text-sm text-gray-800 mt-1">
            Manage standby, onboard, and ex-crew personnel handled by Hanmarine.
          </p>
        </div>
        <Link
          href="/crew/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Crew
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg border border-gray-300 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-300">
          <h2 className="text-lg font-medium text-gray-900">Crew List</h2>
          <p className="text-sm text-gray-800">Total: {crews.length} crew members</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Vessel
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {crews.map((crew) => (
                <tr key={crew.id} className="hover:bg-gray-100 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {crew.fullName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {crew.rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-4 py-2 text-xs font-medium rounded-full ${
                      crew.status === 'ONBOARD'
                        ? 'bg-green-100 text-green-800'
                        : crew.status === 'STANDBY'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {crew.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {crew.pklContracts.length > 0
                      ? crew.pklContracts[0].vesselName
                      : crew.lastVessel || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/crew/${crew.id}`}
                      className="text-blue-600 hover:text-blue-900 hover:underline transition-colors duration-150"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {crews.length === 0 && (
                <tr>
                  <td
                    className="px-6 py-8 text-center text-gray-500 text-sm"
                    colSpan={5}
                  >
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p>No crew members registered yet.</p>
                      <p className="text-xs mt-1">Start by adding your first crew member.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}