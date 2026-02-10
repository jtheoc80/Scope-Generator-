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
    images: [
      {
        url: "/scopegen-og-dark.png",
        width: 1200,
        height: 630,
        alt: "Contractor Market Pricing Data",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Market Pricing Data - Regional Contractor Rates",
    description: "Access real-time market pricing data for contractors.",
    images: ["/scopegen-og-dark.png"],
  },
  alternates: {
    canonical: "https://scopegenerator.com/market-pricing",
  },
};

export default function MarketPricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
