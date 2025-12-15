import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Insights - Contractor Price Analytics",
  description: "Access pricing analytics, industry benchmarks, and personalized recommendations to optimize your contractor proposals. Understand how prices are calculated.",
  keywords: ["contractor pricing analytics", "proposal pricing", "contractor benchmarks", "pricing insights", "construction cost data"],
  openGraph: {
    title: "Pricing Insights | ScopeGen",
    description: "Access pricing analytics and industry benchmarks to optimize your contractor proposals.",
    url: "https://scopegenerator.com/pricing-insights",
    type: "website",
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "ScopeGen Pricing Insights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing Insights | ScopeGen",
    description: "Access pricing analytics and industry benchmarks to optimize your contractor proposals.",
    images: ["/opengraph.jpg"],
  },
  alternates: {
    canonical: "https://scopegenerator.com/pricing-insights",
  },
};

export default function PricingInsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
