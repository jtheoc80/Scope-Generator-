import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/authUtils";
import { VercelAnalytics } from "@/components/VercelAnalytics";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Providers } from "@/components/providers";
import { OrganizationJsonLd } from "@/components/JsonLd";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ScopeGen - Professional Contractor Proposal Software",
    template: "%s | ScopeGen",
  },
  description: "Generate professional proposals and scopes of work in seconds. Built for bathroom remodelers, kitchen contractors, roofers, HVAC specialists, plumbers, electricians, and more. Free to try.",
  keywords: ["contractor proposal software", "scope of work generator", "construction proposal", "remodeling proposal", "contractor estimates", "roofing proposal", "HVAC proposal", "plumbing proposal", "electrical proposal"],
  authors: [{ name: "ScopeGen" }],
  creator: "ScopeGen",
  publisher: "Lead Ledger LLC",
  metadataBase: new URL("https://scopegenerator.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "es": "/?lang=es",
    },
  },
  openGraph: {
    title: "ScopeGen - Professional Contractor Proposal Software",
    description: "Generate professional proposals and scopes of work in seconds. Built for contractors.",
    url: "https://scopegenerator.com",
    siteName: "ScopeGen",
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "ScopeGen - Contractor Proposal Software",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScopeGen - Professional Contractor Proposals",
    description: "Generate professional proposals and scopes of work in seconds.",
    images: ["/opengraph.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <OrganizationJsonLd type="SoftwareApplication" />
        <Providers>
          {children}
        </Providers>
        <VercelAnalytics />
        <GoogleAnalytics />
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if Clerk is fully configured
  if (isClerkConfigured()) {
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
