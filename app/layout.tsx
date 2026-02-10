import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow_Condensed } from "next/font/google";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/authUtils";
import { VercelAnalytics } from "@/components/VercelAnalytics";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { GoogleTagManagerScript, GoogleTagManagerNoScript } from "@/components/GoogleTagManager";
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

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ScopeGen - Professional Contractor Proposal Software",
    template: "%s | ScopeGen",
  },
  description: "Generate professional contractor proposals and scopes of work in 60 seconds. Built for remodelers, roofers, HVAC, plumbers, electricians, and more.",
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
        url: "/scopegen-og-dark.png",
        width: 1200,
        height: 628,
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
    images: ["/scopegen-og-dark.png"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icon-192.png",
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
    // Set via NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION env var
    // Get your code at: https://search.google.com/search-console
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <head>
        <GoogleAnalytics />
        <GoogleTagManagerScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable} antialiased`}
      >
        <GoogleTagManagerNoScript />
        <OrganizationJsonLd type="SoftwareApplication" />
        <Providers>
          {children}
        </Providers>
        <VercelAnalytics />
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if Clerk is fully configured
  if (isClerkConfigured()) {
    return (
      <ClerkProvider
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
        afterSignOutUrl="/"
      >
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
