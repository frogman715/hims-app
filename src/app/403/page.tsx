import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Access Denied - HANMARINE HIMS',
  description: 'You do not have permission to access this page.',
};

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* HANMARINE Logo/Branding */}
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>

          <p className="text-lg text-gray-700 mb-8">
            You don&apos;t have permission to access this page.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
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

          <div className="space-y-6">
            <Link
              href="/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </Link>

            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-gray-400 rounded-lg shadow-md text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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