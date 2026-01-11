'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Error boundary for app routes
 * Catches errors in Server Components and provides recovery UI
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to console in development, to monitoring service in production
    console.error('[App Error Boundary]', {
      message: error.message,
      digest: error.digest,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  // Detect authentication/session errors
  const isAuthError =
    error.message.includes('authentication') ||
    error.message.includes('session') ||
    error.message.includes('NEXT_REDIRECT') ||
    error.message.includes('unauthorized') ||
    error.message.includes('requireUser') ||
    error.message.toLowerCase().includes('signin');

  // Detect database/storage errors
  const isDatabaseError =
    error.message.includes('prisma') ||
    error.message.includes('database') ||
    error.message.includes('connection') ||
    error.message.toLowerCase().includes('econnrefused');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isAuthError
              ? 'Authentication Error'
              : isDatabaseError
              ? 'Service Temporarily Unavailable'
              : 'Something went wrong'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isAuthError ? (
              <>
                Your session may have expired or is invalid.
                <br />
                Please sign in again to continue.
              </>
            ) : isDatabaseError ? (
              <>
                We&apos;re experiencing technical difficulties.
                <br />
                Please try again in a few moments.
              </>
            ) : (
              <>
                An unexpected error occurred while loading this page.
                <br />
                Our team has been notified.
              </>
            )}
          </p>
          
          {error.digest && (
            <p className="mt-2 text-center text-xs text-gray-400">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Development Mode Error Details
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="font-mono text-xs break-all">{error.message}</p>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">
                        Stack trace
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-48 bg-yellow-100 p-2 rounded">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {isAuthError ? (
            <button
              onClick={() => router.push('/auth/signin')}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </button>
          ) : (
            <>
              <button
                onClick={() => reset()}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
