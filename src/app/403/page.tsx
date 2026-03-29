import { Metadata } from 'next';
import Link from 'next/link';
import { WorkspaceHero } from '@/components/layout/WorkspaceHero';

export const metadata: Metadata = {
  title: 'Access Denied - HANMARINE HIMS',
  description: 'You do not have permission to access this page.',
};

export default function ForbiddenPage() {
  return (
    <div className="section-stack">
      <WorkspaceHero
        eyebrow="Access Control"
        title="Access Denied"
        subtitle="Your current role does not have permission to open this workspace. If this looks incorrect, request access from your administrator."
        helperLinks={[
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/auth/signin', label: 'Sign In' },
        ]}
      />

      <div className="mx-auto w-full max-w-3xl">
        <div className="surface-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-left">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Insufficient Permissions
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your current role doesn&apos;t have access to this resource.
                    Please contact your administrator if you believe this is an error.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="flex w-full justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Return to Dashboard
            </Link>

            <Link
              href="/auth/signin"
              className="flex w-full justify-center rounded-full border border-gray-400 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-md transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign In with Different Account
            </Link>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              HANMARINE Integrated Management System v2.0
            </p>
            <p className="mt-1">
              For technical support, contact IT Department
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
