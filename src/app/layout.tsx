import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

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
        <meta name="theme-color" content="#1e40af" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
