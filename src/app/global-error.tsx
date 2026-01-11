'use client';

import { useEffect } from 'react';

/**
 * Global error boundary - catches errors in root layout
 * Only used for critical errors that prevent the entire app from rendering
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errortsx
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error
    console.error('[Global Error Boundary]', {
      message: error.message,
      digest: error.digest,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    });

    // In production, send to monitoring service (Sentry, Datadog, etc.)
    // Example for Sentry:
    // if (process.env.NODE_ENV === 'production' && typeof Sentry !== 'undefined') {
    //   Sentry.captureException(error);
    // }
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Critical Error - HANMARINE HIMS</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
            text-align: center;
          }
          .icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: #fee;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .icon svg {
            width: 50px;
            height: 50px;
            color: #dc2626;
          }
          h1 {
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 12px;
            font-weight: 700;
          }
          p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 8px;
          }
          .error-id {
            color: #9ca3af;
            font-size: 12px;
            margin: 16px 0;
          }
          .actions {
            display: flex;
            gap: 12px;
            margin-top: 32px;
            flex-wrap: wrap;
          }
          button {
            flex: 1;
            min-width: 140px;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .primary {
            background: #3b82f6;
            color: white;
          }
          .primary:hover {
            background: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59,130,246,0.4);
          }
          .secondary {
            background: #f3f4f6;
            color: #374151;
          }
          .secondary:hover {
            background: #e5e7eb;
          }
          .dev-details {
            margin-top: 24px;
            padding: 16px;
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            text-align: left;
          }
          .dev-details h3 {
            color: #92400e;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .dev-details pre {
            font-size: 12px;
            color: #78350f;
            overflow: auto;
            max-height: 200px;
            padding: 8px;
            background: #fffbeb;
            border-radius: 4px;
            margin-top: 8px;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h1>Critical Application Error</h1>
          
          <p>
            We encountered a critical error that prevented the application from loading properly.
          </p>
          <p>
            Please refresh the page or contact support if the problem persists.
          </p>
          
          {error.digest && (
            <div className="error-id">
              Error Reference: {error.digest}
            </div>
          )}
          
          <div className="actions">
            <button className="primary" onClick={() => reset()}>
              Reload Application
            </button>
            <button className="secondary" onClick={() => window.location.href = '/'}>
              Return to Home
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="dev-details">
              <h3>⚠️ Development Mode - Error Details</h3>
              <p style={{ fontSize: '13px', color: '#92400e', marginTop: '8px' }}>
                <strong>Error:</strong> {error.message}
              </p>
              {error.stack && (
                <pre>{error.stack}</pre>
              )}
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
