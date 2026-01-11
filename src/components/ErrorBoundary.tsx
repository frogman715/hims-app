'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
  errorCount: number;
}

/**
 * Error Boundary component to catch React errors and prevent full app crashes
 * Wrap this around page sections or the entire app
 * Enhanced with retry logic and better error recovery
 */
export class ErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Increment error count for rate limiting recovery attempts
    this.setState((prev) => ({ errorCount: prev.errorCount + 1 }));

    // Detect authentication errors
    const isAuthError = 
      error.message.includes('authentication') ||
      error.message.includes('session') ||
      error.message.includes('unauthorized') ||
      error.message.includes('requireUser') ||
      error.message.includes('login') ||
      error.message.toLowerCase().includes('oauth') ||
      error.message.includes('NEXT_REDIRECT');

    // Detect database/connection errors (may be transient)
    const isDatabaseError = 
      error.message.includes('prisma') ||
      error.message.includes('database') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('connection');

    // Log to monitoring service in production
    console.error('[Error Boundary]', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      isAuthError,
      isDatabaseError,
      errorCount: this.state.errorCount,
    });

    // For transient errors (like database connection issues), attempt auto-recovery
    if (isDatabaseError && this.state.errorCount < 3) {
      console.warn('[Error Boundary] Transient error detected, will auto-retry in 3 seconds');
      this.retryTimeout = setTimeout(() => {
        this.handleReset();
      }, 3000);
    }

    // Redirect to login for auth errors (after showing message briefly)
    if (isAuthError && typeof window !== 'undefined') {
      console.warn('[Error Boundary] Authentication error detected, redirecting to login in 2 seconds');
      this.retryTimeout = setTimeout(() => {
        window.location.href = '/auth/signin?error=SessionExpired';
      }, 2000);
    }

    this.setState({
      errorInfo: errorInfo.componentStack || undefined,
    });
  }

  componentWillUnmount() {
    // Clean up timeout on unmount
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleReset = () => {
    // Clear timeout if manual reset
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    // Full page reload for persistent errors
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isAuthError = 
        this.state.error?.message.includes('authentication') ||
        this.state.error?.message.includes('session') ||
        this.state.error?.message.includes('unauthorized');

      const isDatabaseError = 
        this.state.error?.message.includes('prisma') ||
        this.state.error?.message.includes('database') ||
        this.state.error?.message.includes('connection');

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              {isAuthError
                ? 'Authentication Error'
                : isDatabaseError
                ? 'Connection Error'
                : 'Oops! Something went wrong'}
            </h2>

            <p className="text-gray-600 text-center mb-4">
              {isAuthError ? (
                <>
                  Your session may have expired. Redirecting to sign in...
                </>
              ) : isDatabaseError ? (
                <>
                  {this.state.errorCount < 3
                    ? 'Temporary connection issue. Retrying...'
                    : 'Unable to connect to the database. Please check your connection and try again.'}
                </>
              ) : (
                'We encountered an unexpected error. Please try again.'
              )}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <p className="font-mono text-red-800 break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-red-700 font-semibold">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40">
                      {this.state.errorInfo}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {!isAuthError && (
              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  disabled={isDatabaseError && this.state.errorCount < 3}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDatabaseError && this.state.errorCount < 3 ? 'Retrying...' : 'Try Again'}
                </button>
                {this.state.errorCount >= 3 && (
                  <button
                    onClick={this.handleReload}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                  >
                    Reload Page
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
