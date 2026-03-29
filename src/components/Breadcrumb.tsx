'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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

function isOpaqueRouteSegment(segment: string): boolean {
  if (segment.match(/^\d+$/) || segment.startsWith('[')) {
    return true;
  }

  // Hide raw IDs such as Prisma cuid/UUID-like values from breadcrumbs.
  return /^[a-z0-9]{16,}$/i.test(segment);
}

function generateBreadcrumbs(
  pathname: string,
  dynamicLabels: Record<string, string> = {}
): BreadcrumbItem[] {
  const seafarerBreadcrumbs = buildSeafarerBreadcrumbs(pathname, dynamicLabels);
  if (seafarerBreadcrumbs) {
    return seafarerBreadcrumbs;
  }

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
    accounting: 'Finance',
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
    audits: 'Audit',
    'non-conformities': 'Non-Conformities',
    quality: 'Quality',
    settings: 'Settings',
    users: 'User Management',
    roles: 'Roles',
    permissions: 'Permissions',
  };

  let cumulativePath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    cumulativePath += `/${segment}`;

    if (isOpaqueRouteSegment(segment) && !dynamicLabels[segment]) {
      continue;
    }

    const label = dynamicLabels[segment] || labelMap[segment] || segment
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

function buildSeafarerBreadcrumbs(
  pathname: string,
  dynamicLabels: Record<string, string>
): BreadcrumbItem[] | null {
  const match = pathname.match(/^\/crewing\/seafarers\/([^/]+)(?:\/.*)?$/);
  if (!match) {
    return null;
  }

  const seafarerId = decodeURIComponent(match[1]);
  const seafarerLabel = dynamicLabels[seafarerId] || 'Seafarer';

  return [
    { label: 'Dashboard', href: '/dashboard', current: false },
    { label: 'Crew Operations', href: '/crewing', current: false },
    { label: 'Seafarers', href: '/crewing/seafarers', current: false },
    {
      label: seafarerLabel,
      href: `/crewing/seafarers/${seafarerId}/biodata`,
      current: true,
    },
  ];
}

export function Breadcrumb() {
  const pathname = usePathname();
  const { status } = useSession();
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    let isCancelled = false;

    async function resolveSeafarerLabel() {
      const match = pathname.match(/^\/crewing\/seafarers\/([^/]+)(?:\/|$)/);
      if (!match) {
        setDynamicLabels({});
        return;
      }

      if (status === 'loading') {
        return;
      }

      const seafarerId = decodeURIComponent(match[1]);

      try {
        const response = await fetch(`/api/crewing/seafarers/${seafarerId}`, {
          credentials: 'same-origin',
        });

        if (!response.ok) {
          if (!isCancelled) {
            setDynamicLabels({});
          }
          return;
        }

        const payload = await response.json();
        const fullName =
          typeof payload?.fullName === 'string' && payload.fullName.trim().length > 0
            ? payload.fullName.trim()
            : null;

        if (!isCancelled) {
          setDynamicLabels(fullName ? { [seafarerId]: fullName } : {});
        }
      } catch {
        if (!isCancelled) {
          setDynamicLabels({});
        }
      }
    }

    resolveSeafarerLabel();

    return () => {
      isCancelled = true;
    };
  }, [pathname, status]);

  const breadcrumbs = generateBreadcrumbs(pathname, dynamicLabels);

  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto">
      <ol className="flex min-w-max items-center space-x-1.5 text-sm">
        {/* Home Icon */}
        <li>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg px-2.5 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            title="Go to Dashboard"
          >
            <Home className="w-4 h-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {/* Breadcrumb Items */}
        {breadcrumbs.map((item) => (
          <li key={item.href} className="flex items-center">
            <ChevronRight className="mx-1 h-4 w-4 text-slate-300" />
            {item.current ? (
              <span className="rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-900">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="rounded-lg px-3 py-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
