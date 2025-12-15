import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Contractor Price Calculator - Instant Cost Estimates",
  description: "Get instant cost estimates for bathroom remodels, kitchen renovations, roofing, HVAC, plumbing, electrical, and more. Free contractor price calculator with regional pricing adjustments.",
  keywords: ["contractor price calculator", "remodeling cost estimate", "construction cost calculator", "home improvement costs", "contractor pricing"],
  openGraph: {
    title: "Free Contractor Price Calculator - Instant Cost Estimates",
    description: "Get instant cost estimates for any remodeling or construction project. No signup required.",
    url: "https://scopegenerator.com/calculator",
    type: "website",
  },
};

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
