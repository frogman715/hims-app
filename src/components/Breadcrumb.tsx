'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb Navigation Component
 * Automatically generates breadcrumbs from current pathname
 */

interface BreadcrumbItem {
  label: string;
  href: string;
  current: boolean;
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      current: pathname === '/dashboard',
    },
  ];

  // Breadcrumb mapping for user-friendly labels
  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    accounting: 'Accounting',
    'leave-pay': 'Leave Pay',
    exchange: 'Exchange Expenses',
    allotments: 'Allotments',
    wages: 'Wages',
    billing: 'Billing',
    'office-expense': 'Office Expense',
    'crew-portal': 'Crew Portal',
    documents: 'Documents',
    'prepare-joining': 'Prepare Joining',
    applications: 'Applications',
    assignments: 'Assignments',
    contracts: 'Contracts',
    dispatch: 'Dispatch',
    compliance: 'Compliance',
    audits: 'Audits',
    'non-conformities': 'Non-Conformities',
    quality: 'Quality',
    settings: 'Settings',
    users: 'Users',
    roles: 'Roles',
    permissions: 'Permissions',
  };

  let cumulativePath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    cumulativePath += `/${segment}`;

    // Skip numeric IDs or dynamic segments starting with [
    if (segment.match(/^\d+$/) || segment.startsWith('[')) {
      continue;
    }

    const label = labelMap[segment] || segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const isLast = i === segments.length - 1;
    if (!isLast) {
      breadcrumbs.push({
        label,
        href: cumulativePath,
        current: false,
      });
    }
  }

  // Set the last item as current
  if (breadcrumbs.length > 0) {
    breadcrumbs[breadcrumbs.length - 1].current = true;
  }

  return breadcrumbs;
}

export function Breadcrumb() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm">
        {/* Home Icon */}
        <li>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            title="Go to Dashboard"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {/* Breadcrumb Items */}
        {breadcrumbs.map((item) => (
          <li key={item.href} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
            {item.current ? (
              <span className="px-3 py-2 text-gray-900 font-semibold bg-gray-50 rounded-lg">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Breadcrumb Wrapper Component
 * Use this in layouts to automatically show breadcrumbs on all pages
 */
export function BreadcrumbWrapper() {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Breadcrumb />
      </div>
    </div>
  );
}
