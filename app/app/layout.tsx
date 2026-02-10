import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Proposal - Contractor Proposal Generator",
  description: "Create professional contractor proposals in 60 seconds. Choose your trade, answer a few questions, and generate a complete scope of work with pricing.",
  keywords: ["create contractor proposal", "proposal generator", "scope of work generator", "contractor estimate"],
  openGraph: {
    title: "Create Proposal | ScopeGen",
    description: "Create professional contractor proposals in 60 seconds.",
    url: "https://scopegenerator.com/app",
    type: "website",
    images: [
      {
        url: "/scopegen-og-dark.png",
        width: 1200,
        height: 630,
        alt: "ScopeGen Proposal Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Proposal | ScopeGen",
    description: "Create professional contractor proposals in 60 seconds.",
    images: ["/scopegen-og-dark.png"],
  },
  alternates: {
    canonical: "https://scopegenerator.com/app",
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
