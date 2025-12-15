import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market Pricing Data - Regional Contractor Rates",
  description: "Access real-time market pricing data for contractors. Compare regional labor rates and material costs to price your proposals competitively.",
  keywords: ["contractor pricing data", "market rates", "construction labor costs", "regional pricing", "contractor rates"],
  openGraph: {
    title: "Market Pricing Data - Regional Contractor Rates",
    description: "Access real-time market pricing data for contractors.",
    url: "https://scopegenerator.com/market-pricing",
    type: "website",
  },
};

export default function MarketPricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
