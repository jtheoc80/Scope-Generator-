import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScopeScan - AI-Powered Photo Analysis for Contractors",
  description: "Turn job site photos into detailed proposals in minutes. ScopeScan uses AI to analyze photos and generate accurate scope items, material lists, and pricing.",
  keywords: [
    "AI photo analysis contractor",
    "job site photo to proposal",
    "scope of work from photos",
    "contractor AI tool",
    "ScopeScan",
  ],
  openGraph: {
    title: "ScopeScan - AI-Powered Photo Analysis for Contractors",
    description: "Turn job site photos into detailed proposals in minutes. AI-powered scope generation.",
    url: "https://scopegenerator.com/scopescan",
    type: "website",
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "ScopeScan - AI Photo Analysis for Contractors",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScopeScan - AI-Powered Photo Analysis for Contractors",
    description: "Turn job site photos into detailed proposals in minutes with AI.",
    images: ["/opengraph.jpg"],
  },
  alternates: {
    canonical: "https://scopegenerator.com/scopescan",
  },
};

export default function ScopeScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
