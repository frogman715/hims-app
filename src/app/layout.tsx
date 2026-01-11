import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PwaRegister } from "./_components/PwaRegister";
import { env } from "@/lib/env";

// Use system fonts as fallback when Google Fonts are unavailable
const fontVariables = {
  sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
};

export const metadata: Metadata = {
  title: "HANMARINE HIMS | Maritime Crew Management System",
  description: "Enterprise maritime crew management system compliant with MLC 2006, STCW 2010, ISM Code. Complete seafarer lifecycle management from recruitment to repatriation.",
  keywords: "maritime management, crew management, seafarer, MLC compliance, STCW certification, vessel management, shipping, crewing agency",
  authors: [{ name: "PT. Hanmarine Indonesia" }],
  applicationName: "HANMARINE HIMS",
  generator: "Next.js 15",
  referrer: "origin-when-cross-origin",
  robots: {
    index: false, // Internal system - tidak untuk search engines
    follow: false,
  },
  openGraph: {
    title: "HANMARINE HIMS - Maritime Crew Management",
    description: "Professional maritime crew management system",
    type: "website",
    locale: "en_US",
    siteName: "HANMARINE HIMS",
  },
};

// Validate critical environment variables at startup
if (process.env.NODE_ENV !== "test" && env.issues.length > 0) {
  console.error("[RootLayout] Critical environment configuration issues detected:", env.issues);
  
  // In development, show warning but continue
  // In production, this should be caught before deployment
  if (process.env.NODE_ENV === "production") {
    console.error("[RootLayout] Application may not function correctly due to missing environment variables");
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/hims-192.png" />
      </head>
      <body className="antialiased" style={{ fontFamily: fontVariables.sans }}>
        <PwaRegister />
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
