'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserRole } from '@/lib/permissions';
import ComplianceStatusWidget from '@/components/compliance/ComplianceStatusWidget';
import ExternalComplianceWidget from '@/components/compliance/ExternalComplianceWidget';
import WorldClock from '@/components/WorldClock';

// Type definitions
interface DashboardData {
  totalCrew: number;
  activeVessels: number;
  pendingApplications: number;
  expiringDocuments: number;
}

interface CrewMovementItem {
  seafarer: string;
  rank: string;
  principal: string;
  vessel: string;
  status: string;
  nextAction: string;
}

interface ExpiringItem {
  seafarer: string;
  type: string;
  name: string;
  expiryDate: string;
  daysLeft: number;
}

interface PendingTask {
  dueDate: string;
  type: string;
  description: string;
  status: string;
}

interface RecentActivity {
  timestamp: string;
  user: string;
  action: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [crewMovement, setCrewMovement] = useState<CrewMovementItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<ExpiringItem[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const stats = await response.json();
          setData(stats);
        }

        // Enhanced mock data for demonstration
        setCrewMovement([
          { seafarer: "John Smith", rank: "Captain", principal: "PT. Ocean Line", vessel: "MV Ocean Pride", status: "ONBOARD", nextAction: "Sign Off - Dec 2025" },
          { seafarer: "Maria Garcia", rank: "Chief Engineer", principal: "Global Shipping", vessel: "MV Pacific Star", status: "READY", nextAction: "Sign On - Jan 2026" },
          { seafarer: "Ahmed Hassan", rank: "Deck Officer", principal: "Maritime Corp", vessel: "MV Atlantic Wave", status: "COMPLETED", nextAction: "Contract Ended" },
          { seafarer: "Sarah Chen", rank: "Chief Officer", principal: "Pacific Fleet", vessel: "MV Southern Cross", status: "READY", nextAction: "Medical Check - Dec 2025" }
        ]);

        setExpiringItems([
          { seafarer: "John Smith", type: "document", name: "Certificate of Competency", expiryDate: "2025-12-15", daysLeft: 15 },
          { seafarer: "Maria Garcia", type: "contract", name: "Employment Contract", expiryDate: "2025-12-01", daysLeft: 1 },
          { seafarer: "Ahmed Hassan", type: "document", name: "Medical Certificate", expiryDate: "2026-01-20", daysLeft: 51 },
          { seafarer: "Sarah Chen", type: "document", name: "STCW Certificate", expiryDate: "2025-11-30", daysLeft: 0 }
        ]);

        setPendingTasks([
          { dueDate: "2025-12-01", type: "Internal Audit", description: "Monthly safety compliance audit", status: "OPEN" },
          { dueDate: "2025-12-15", type: "Corrective Action", description: "Follow up on previous audit findings", status: "IN_PROGRESS" },
          { dueDate: "2025-11-30", type: "Document Review", description: "Review crew certification renewals", status: "OVERDUE" },
          { dueDate: "2025-12-05", type: "Training", description: "ISM Code refresher training", status: "OPEN" }
        ]);

        setRecentActivity([
          { timestamp: "2025-11-27 14:30", user: "Admin", action: "Created Assignment - John Smith to MV Ocean Pride" },
          { timestamp: "2025-11-27 11:15", user: "HR Manager", action: "Updated Document - Maria Garcia Medical Certificate" },
          { timestamp: "2025-11-27 09:45", user: "Captain", action: "Closed Complaint - Equipment maintenance issue" },
          { timestamp: "2025-11-26 16:20", user: "Admin", action: "Approved Contract Extension - Ahmed Hassan" },
          { timestamp: "2025-11-26 14:10", user: "Safety Officer", action: "Completed Safety Drill - MV Pacific Star" }
        ]);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading Dashboard...</h2>
          <p className="text-gray-500 mt-2">Preparing your maritime management overview</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = (session.user?.roles?.[0] as UserRole) || UserRole.CREW_PORTAL;

  // Role-based dashboard rendering
  const renderRoleBasedDashboard = () => {
    switch (userRole) {
      case UserRole.DIRECTOR:
        return <DirectorDashboard user={session.user} />;
      case UserRole.CDMO:
        return <CDMOBashboard user={session.user} />;
      case UserRole.ACCOUNTING:
        return <AccountingDashboard user={session.user} />;
      case UserRole.OPERATIONAL:
        return <OperationalDashboard user={session.user} />;
      case UserRole.HR:
        return <HRDashboard user={session.user} />;
      case UserRole.CREW_PORTAL:
        return <CrewPortalDashboard user={session.user} />;
      default:
        return <DirectorDashboard user={session.user} />;
    }
  };

  // Role-based navigation rendering
  const renderRoleBasedNavigation = () => {
    const navigationItems = [];

    // Common navigation items based on role permissions
    if (userRole === UserRole.DIRECTOR || userRole === UserRole.CDMO) {
      navigationItems.push(
        { href: '/crewing', label: 'Crewing Department', icon: '⚓' },
        { href: '/contracts', label: 'Contracts', icon: '📋' },
        { href: '/crewing/documents', label: 'Documents', icon: '📁' },
        { href: '/insurance', label: 'Insurance', icon: '⚡' }
      );
    }

    // System Health - DIRECTOR only
    if (userRole === UserRole.DIRECTOR) {
      navigationItems.push(
        { href: '/admin/system-health', label: 'System Health', icon: '⚙' }
      );
    }

    if (userRole === UserRole.DIRECTOR || userRole === UserRole.OPERATIONAL) {
      navigationItems.push(
        { href: '/crewing/principals', label: 'Fleet Management', icon: '🚢' }
      );
    }

    if (userRole === UserRole.DIRECTOR || userRole === UserRole.ACCOUNTING) {
      navigationItems.push(
        { href: '/accounting', label: 'Accounting', icon: '💵' },
        { href: '/agency-fees', label: 'Agency Fees', icon: '💲' }
      );
    }

    if (userRole === UserRole.DIRECTOR || userRole === UserRole.HR) {
      navigationItems.push(
        { href: '/hr', label: 'HR', icon: '👔' },
        { href: '/disciplinary', label: 'Disciplinary', icon: '⚖️' }
      );
    }

    if (userRole === UserRole.CREW_PORTAL) {
      navigationItems.push(
        { href: '/crewing/seafarers', label: 'My Profile', icon: '👤' },
        { href: '/crewing/documents', label: 'My Documents', icon: '📄' }
      );
    }

    return navigationItems.map((item, index) => (
      <Link
        key={index}
        href={item.href}
        className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all duration-200 hover:translate-x-1"
      >
        <span className="mr-4 text-lg">{item.icon}</span>
        <span className="font-medium">{item.label}</span>
      </Link>
    ));
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="fixed left-0 top-0 h-full w-72 bg-white shadow-2xl border-r border-gray-100 z-40 flex flex-col">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 relative">
                <Image src="/logo.png" alt="HANMARINE Logo" fill className="object-contain p-0.5" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-wide">HANMARINE</h1>
                <p className="text-sm opacity-80">HIMS System</p>
              </div>
            </div>
            <p className="text-xs opacity-70 mb-3">Integrated Maritime Management</p>
            
            {/* World Clock - Compact Version */}
            <div className="space-y-1">
              <WorldClock />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <div className="space-y-2 pb-4">
            <Link href="/dashboard" className="flex items-center px-4 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <span className="mr-3 text-lg">📊</span>
              <span>Dashboard</span>
            </Link>

            {/* Role-based navigation */}
            {renderRoleBasedNavigation()}
          </div>
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-100 bg-gray-100 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 text-sm">{session?.user?.name || "User"}</div>
              <div className="text-sm text-gray-700">{session?.user?.roles?.[0] || "Role"}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg">
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
      <div className="ml-72 p-8">
        {renderRoleBasedDashboard()}
      </div>
    </div>
  );
}

// Role-based Dashboard Components
function DirectorDashboard({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      {/* Executive Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-300 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-gray-900">Executive Overview</h2>
          <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6">
        {/* KPI Cards - Make them clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/crewing/principals" className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Fleet Management</p>
                <p className="text-3xl font-bold">6</p>
                <p className="text-white text-sm opacity-90">Principals (24 vessels)</p>
              </div>
              <div className="text-4xl">🏢</div>
            </div>
          </Link>

          <Link href="/crewing/seafarers" className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Crew Complement</p>
                <p className="text-3xl font-bold">1,247</p>
                <p className="text-white text-sm opacity-90">Active seafarers</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </Link>

          <Link href="/crewing/prepare-joining" className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Pending Joinings</p>
                <p className="text-3xl font-bold">18</p>
                <p className="text-white text-sm opacity-90">This month</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </Link>

          <Link href="/crewing/documents?filter=expiring" className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Docs Expiring</p>
                <p className="text-3xl font-bold">8</p>
                <p className="text-white text-sm opacity-90">Need renewal</p>
              </div>
              <div className="text-4xl">📜</div>
            </div>
          </Link>
        </div>

        {/* Vessel Tracking - Compact Version */}
        <a
          href="https://www.vesselfinder.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-4 mb-8 text-white hover:shadow-2xl transition-all duration-200 hover:scale-105 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌊</span>
              <div>
                <h3 className="text-lg font-bold">Live Vessel Tracking</h3>
                <p className="text-xs text-blue-100">24 vessels • 18 at sea • 6 in port</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <span className="text-sm font-medium">Open Map</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </a>

        {/* Crew Movement Pipeline */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Crew Movement Pipeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/crewing/prepare-joining" className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Preparing to Join</h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-4.5 py-0.5 rounded">12</span>
              </div>
              <p className="text-sm text-gray-800">Crew members in final preparation phase</p>
            </Link>

            <Link href="/crewing/seafarers?status=ONBOARD" className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">On Board</h4>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-4.5 py-0.5 rounded">1,235</span>
              </div>
              <p className="text-sm text-gray-800">Currently serving on vessels</p>
            </Link>

            <Link href="/crewing/seafarers?status=SIGN_OFF_DUE" className="bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Sign-Off Due</h4>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-4.5 py-0.5 rounded">23</span>
              </div>
              <p className="text-sm text-gray-800">Crew completing contracts this month</p>
            </Link>
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Risk Alerts</h3>
          <div className="space-y-3">
            <Link href="/crewing/documents?filter=expiring" className="block bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start">
                <div className="text-red-500 text-xl mr-3">🚨</div>
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">Certificate Expirations</h4>
                  <p className="text-sm text-red-700 mt-1">3 crew members have certificates expiring within 30 days</p>
                  <div className="mt-2">
                    <span className="text-sm text-red-600 font-medium">View Details →</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/compliance/external" className="block bg-yellow-50 border border-yellow-200 rounded-lg p-4 cursor-pointer hover:bg-yellow-100 transition-all duration-200 hover:shadow-lg">
              <div className="flex items-start">
                <div className="text-yellow-500 text-xl mr-3">🌐</div>
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900">External Compliance</h4>
                  <p className="text-sm text-yellow-700 mt-1">KOSMA, Dephub & Schengen visa tracking</p>
                  <div className="mt-2">
                    <span className="text-sm text-yellow-600 font-medium">View Details →</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* External Compliance Status */}
        <div className="mb-8">
          <ComplianceStatusWidget />
        </div>

        {/* External Compliance Systems */}
        <div className="mb-8">
          <ExternalComplianceWidget />
        
          {/* External Compliance Quick Links */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">External Applications</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <a
                href="https://www.marinerights.or.kr/fro_end_kor/html/main/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">KOSMA Training</div>
                    <div className="text-sm text-gray-700">Korea certification</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              
              <a
                href="https://pelaut.dephub.go.id/login-perusahaan"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Dephub Verify</div>
                    <div className="text-sm text-gray-700">Certificate check</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              
              <a
                href="https://consular.mfaservices.nl/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Schengen Visa</div>
                    <div className="text-sm text-gray-700">Netherlands visa</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function CDMOBashboard({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      {/* CDMO Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-gray-900">Crew Department Overview</h2>
          <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>

        {/* World Clock */}
        <div className="mb-6">
          <WorldClock />
        </div>

        {/* Quick Actions - Moved to TOP */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/hr/recruitment" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-center block shadow-md">
              👥 New Recruitment
            </Link>
            <Link href="/crewing/prepare-joining" className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-center block shadow-md">
              📋 Prepare Joining
            </Link>
            <Link href="/contracts" className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-center block shadow-md">
              📝 Contracts
            </Link>
            <Link href="/crewing/documents" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-center block shadow-md">
              📄 Documents
            </Link>
          </div>
        </div>

        {/* Vessel Tracking Card */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-extrabold flex items-center gap-2">
              <span>🌊</span>
              Vessel Tracking
            </h3>
            <a
              href="https://www.vesselfinder.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-100 hover:text-white flex items-center gap-1"
            >
              Open Map
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white bg-opacity-90 rounded p-2 text-center">
              <div className="text-2xl font-extrabold">24</div>
              <div className="text-xs text-blue-100">Fleet</div>
            </div>
            <div className="bg-white bg-opacity-90 rounded p-2 text-center">
              <div className="text-2xl font-extrabold">18</div>
              <div className="text-xs text-blue-100">At Sea</div>
            </div>
            <div className="bg-white bg-opacity-90 rounded p-2 text-center">
              <div className="text-2xl font-extrabold">6</div>
              <div className="text-xs text-blue-100">In Port</div>
            </div>
          </div>
        </div>

        {/* Today's Workload */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Today&apos;s Workload</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Joining Today</h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-4.5 py-0.5 rounded">3</span>
              </div>
              <p className="text-sm text-gray-800">Crew members scheduled to join vessels</p>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-gray-700">• John Smith - MV Ocean Pride</div>
                <div className="text-sm text-gray-700">• Maria Garcia - MV Sea Voyager</div>
                <div className="text-sm text-gray-700">• Ahmed Hassan - MV Pacific Star</div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Sign-offs Today</h4>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-4.5 py-0.5 rounded">2</span>
              </div>
              <p className="text-sm text-gray-800">Crew completing their contracts</p>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-gray-700">• Robert Chen - MV Atlantic</div>
                <div className="text-sm text-gray-700">• Sarah Johnson - MV Horizon</div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Pending Approvals</h4>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-4.5 py-0.5 rounded">5</span>
              </div>
              <p className="text-sm text-gray-800">Documents awaiting your approval</p>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-gray-700">• 3 Contract renewals</div>
                <div className="text-sm text-gray-700">• 2 Travel documents</div>
              </div>
            </div>
          </div>
        </div>

        {/* Crew Pipeline */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Crew Pipeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="text-2xl font-extrabold text-gray-900">15</div>
              <div className="text-sm text-gray-800">Shortlisted</div>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">📝</span>
              </div>
              <div className="text-2xl font-extrabold text-blue-600">8</div>
              <div className="text-sm text-gray-800">Interviewing</div>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">⚖️</span>
              </div>
              <div className="text-2xl font-extrabold text-yellow-600">4</div>
              <div className="text-sm text-gray-800">Medical Check</div>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">✅</span>
              </div>
              <div className="text-2xl font-extrabold text-green-600">12</div>
              <div className="text-sm text-gray-800">Ready to Join</div>
            </div>
          </div>
        </div>

        {/* External Compliance - Quick Apply for CDMO */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Apply - External Systems
              </h4>
              <Link href="/compliance/external" className="text-xs text-blue-600 hover:text-blue-800 hover:underline">
                Manage All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <a
                href="/crewing/documents?type=KOSMA"
                className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200 hover:border-blue-400 hover:shadow-md transition text-sm group"
              >
                <span className="text-xl">🇰🇷</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-xs">KOSMA Certificates</div>
                  <div className="text-sm text-gray-700">View documents</div>
                </div>
                <svg className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="https://pelaut.dephub.go.id/login-perusahaan"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-white rounded border border-green-200 hover:border-green-400 hover:shadow-md transition text-sm group"
              >
                <span className="text-xl">🇮🇩</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-xs">Dephub Portal</div>
                  <div className="text-sm text-gray-700">Verify sijil</div>
                </div>
                <svg className="w-4 h-4 text-green-600 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a
                href="https://consular.mfaservices.nl/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-white rounded border border-purple-200 hover:border-purple-400 hover:shadow-md transition text-sm group"
              >
                <span className="text-xl">🇳🇱</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-xs">Schengen NL</div>
                  <div className="text-sm text-gray-700">Tanker visa</div>
                </div>
                <svg className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountingDashboard({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      {/* Accounting Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-gray-900">Financial Overview</h2>
          <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>

        {/* Financial KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Monthly Revenue</p>
                <p className="text-3xl font-bold">$2.4M</p>
                <p className="text-green-100 text-sm">+12% from last month</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Outstanding Payments</p>
                <p className="text-3xl font-bold">$156K</p>
                <p className="text-blue-100 text-sm">23 pending invoices</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Agency Fees Due</p>
                <p className="text-3xl font-bold">$89K</p>
                <p className="text-yellow-100 text-sm">This quarter</p>
              </div>
              <div className="text-4xl">🤝</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Wage Processing</p>
                <p className="text-3xl font-bold">1,247</p>
                <p className="text-purple-100 text-sm">Active payrolls</p>
              </div>
              <div className="text-4xl">💼</div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">2025-01-15</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Crew wages - MV Ocean Pride</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">$45,230</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-4 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">2025-01-14</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Agency fee - Manila recruitment</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">-$12,500</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-4 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">2025-01-13</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Insurance premium - Fleet</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">-$28,900</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-4 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/accounting/wages" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center block">
              💰 Process Payroll
            </Link>
            <Link href="/accounting/reports" className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center block">
              📊 Financial Reports
            </Link>
            <Link href="/agency-fees" className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center block">
              🤝 Agency Payments
            </Link>
            <Link href="/contracts" className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center block">
              📋 Contracts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function OperationalDashboard({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      {/* Operations Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-gray-900">Operations Overview</h2>
          <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>

        {/* Fleet Status */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Fleet Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Active Vessels</h4>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-4.5 py-0.5 rounded">22</span>
              </div>
              <p className="text-sm text-gray-800">Vessels currently in operation</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">In Port</h4>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-4.5 py-0.5 rounded">2</span>
              </div>
              <p className="text-sm text-gray-800">Vessels undergoing maintenance or loading</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Off Hire</h4>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-4.5 py-0.5 rounded">0</span>
              </div>
              <p className="text-sm text-gray-800">Vessels temporarily out of service</p>
            </div>
          </div>
        </div>

        {/* Dispatch Schedule */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Today&apos;s Dispatches</h3>
          <div className="space-y-3">
            <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">MV Ocean Pride - Manila</h4>
                  <p className="text-sm text-blue-700 mt-1">Crew change: 3 joining, 2 signing off</p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-blue-600">
                    <span>🕐 14:00 departure</span>
                    <span>📍 Manila Port</span>
                  </div>
                </div>
                <div className="ml-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-4.5 py-0.5 rounded">On Schedule</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-green-900">MV Sea Voyager - Singapore</h4>
                  <p className="text-sm text-green-700 mt-1">Supplies and documents delivery</p>
                  <div className="mt-2 flex items-center space-x-4 text-xs text-green-600">
                    <span>🕐 16:30 departure</span>
                    <span>📍 Singapore Port</span>
                  </div>
                </div>
                <div className="ml-4">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-4.5 py-0.5 rounded">Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Documents */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Travel Documents Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">✅</span>
              </div>
              <div className="text-2xl font-extrabold text-green-600">18</div>
              <div className="text-sm text-gray-800">Ready for Travel</div>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="text-2xl font-extrabold text-yellow-600">5</div>
              <div className="text-sm text-gray-800">Processing</div>
            </div>

            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">❌</span>
              </div>
              <div className="text-2xl font-extrabold text-red-600">2</div>
              <div className="text-sm text-gray-800">Issues Found</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/crewing/principals" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center block">
              🚢 Fleet Management
            </Link>
            <Link href="/crewing/assignments" className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center block">
              📋 Dispatch Planning
            </Link>
            <Link href="/crewing/documents" className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center block">
              🛂 Travel Documents
            </Link>
            <Link href="/crewing" className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center block">
              📊 Operations Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function HRDashboard({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      {/* HR Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-gray-900">Human Resources Overview</h2>
          <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>

        {/* HR KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Active Employees</p>
                <p className="text-3xl font-bold">1,247</p>
                <p className="text-blue-100 text-sm">On board vessels</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Training Completed</p>
                <p className="text-3xl font-bold">89%</p>
                <p className="text-green-100 text-sm">This quarter</p>
              </div>
              <div className="text-4xl">🎓</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">Performance Reviews</p>
                <p className="text-3xl font-bold">23</p>
                <p className="text-yellow-100 text-sm">Due this month</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Disciplinary Cases</p>
                <p className="text-3xl font-bold">3</p>
                <p className="text-red-100 text-sm">Active investigations</p>
              </div>
              <div className="text-4xl">⚖️</div>
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Compliance Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">STCW Certificates</h4>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-4.5 py-0.5 rounded">98.5%</span>
              </div>
              <p className="text-sm text-gray-800">Crew with valid STCW certification</p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
              </div>
            </div>

            <div className="bg-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Medical Fitness</h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-4.5 py-0.5 rounded">96.2%</span>
              </div>
              <p className="text-sm text-gray-800">Crew with current medical certificates</p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '96.2%' }}></div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Training Records</h4>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-4.5 py-0.5 rounded">94.7%</span>
              </div>
              <p className="text-sm text-gray-800">Crew with up-to-date training records</p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '94.7%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent HR Activities</h3>
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-blue-600 text-xl mr-3">📋</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Performance Review Completed</h4>
                  <p className="text-sm text-gray-800 mt-1">Captain John Smith - MV Ocean Pride</p>
                  <div className="mt-2 text-sm text-gray-700">2 hours ago</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-green-500 text-xl mr-3">🎓</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Training Course Completed</h4>
                  <p className="text-sm text-gray-800 mt-1">Safety Leadership Program - 15 crew members</p>
                  <div className="mt-2 text-sm text-gray-700">1 day ago</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-yellow-500 text-xl mr-3">⚖️</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Disciplinary Investigation</h4>
                  <p className="text-sm text-gray-800 mt-1">Case #2025-003 - Under review</p>
                  <div className="mt-2 text-sm text-gray-700">3 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
              👥 Employee Records
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
              🎓 Training Management
            </button>
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
              📊 Performance Reviews
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
              ⚖️ Disciplinary Actions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CrewPortalDashboard({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      {/* Crew Portal Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-extrabold text-gray-900">My Dashboard</h2>
          <div className="text-sm text-gray-500">Welcome back, {user?.name || 'Seafarer'}</div>
        </div>

        {/* Personal Status */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">My Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Current Assignment</h4>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-4.5 py-0.5 rounded">Active</span>
              </div>
              <p className="text-sm text-gray-800">MV Ocean Pride - Chief Engineer</p>
              <div className="mt-2 text-sm text-gray-700">Contract ends: March 15, 2025</div>
            </div>

            <div className="bg-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Next Sign-off</h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-4.5 py-0.5 rounded">45 days</span>
              </div>
              <p className="text-sm text-gray-800">Scheduled leave period</p>
              <div className="mt-2 text-sm text-gray-700">March 15 - April 15, 2025</div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Documents Status</h4>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-4.5 py-0.5 rounded">2 expiring</span>
              </div>
              <p className="text-sm text-gray-800">Certificates requiring renewal</p>
              <div className="mt-2 text-sm text-gray-700">Medical certificate expires soon</div>
            </div>
          </div>
        </div>

        {/* Important Notices */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Important Notices</h3>
          <div className="space-y-3">
            <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-blue-600 text-xl mr-3">📢</div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">New Safety Training Required</h4>
                  <p className="text-sm text-blue-700 mt-1">All crew must complete the updated fire safety training by February 28, 2025.</p>
                  <div className="mt-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">Start Training →</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-yellow-500 text-xl mr-3">⏰</div>
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900">Medical Certificate Renewal</h4>
                  <p className="text-sm text-yellow-700 mt-1">Your medical fitness certificate expires in 30 days. Please schedule renewal.</p>
                  <div className="mt-2">
                    <button className="text-sm text-yellow-600 hover:text-yellow-800 font-medium">Schedule Appointment →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
              📋 My Documents
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
              💰 Salary Information
            </button>
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
              📅 Leave Requests
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium transition-colors">
              🆘 Emergency Contact
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-green-500 text-xl mr-3">✅</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Monthly Performance Review Submitted</h4>
                  <p className="text-sm text-gray-800 mt-1">Your review for December 2024 has been completed and approved.</p>
                  <div className="mt-2 text-sm text-gray-700">5 days ago</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-blue-600 text-xl mr-3">📄</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Contract Extension Signed</h4>
                  <p className="text-sm text-gray-800 mt-1">Your contract has been extended for an additional 6 months.</p>
                  <div className="mt-2 text-sm text-gray-700">2 weeks ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
