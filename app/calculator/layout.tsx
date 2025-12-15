import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Contractor Price Calculator - Instant Cost Estimates",
  description: "Get instant cost estimates for bathroom remodels, kitchen renovations, roofing, HVAC, plumbing, electrical, and more. Free contractor price calculator with regional pricing adjustments.",
  keywords: ["contractor price calculator", "remodeling cost estimate", "construction cost calculator", "home improvement costs", "contractor pricing", "bathroom remodel cost", "kitchen renovation cost", "roofing estimate"],
  openGraph: {
    title: "Free Contractor Price Calculator - Instant Cost Estimates",
    description: "Get instant cost estimates for any remodeling or construction project. No signup required.",
    url: "https://scopegenerator.com/calculator",
    type: "website",
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "Free Contractor Price Calculator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Contractor Price Calculator - Instant Cost Estimates",
    description: "Get instant cost estimates for any remodeling or construction project. No signup required.",
    images: ["/opengraph.jpg"],
  },
  alternates: {
    canonical: "https://scopegenerator.com/calculator",
  },
};

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
