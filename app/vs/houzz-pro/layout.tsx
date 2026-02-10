import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScopeGen vs Houzz Pro - Contractor Proposal Software Comparison",
  description: "Compare ScopeGen vs Houzz Pro for contractor proposals. See the differences in pricing, features, ease of use, and find out which proposal software is right for your remodeling business.",
  keywords: ["ScopeGen vs Houzz Pro", "Houzz Pro alternative", "contractor proposal software comparison", "interior design software", "proposal software for remodelers"],
  openGraph: {
    title: "ScopeGen vs Houzz Pro: Which Proposal Software is Right for You?",
    description: "Compare ScopeGen vs Houzz Pro for contractor proposals. See pricing differences, features, and find the best fit for your business.",
    url: "https://scopegenerator.com/vs/houzz-pro",
    type: "article",
    images: [
      {
        url: "/scopegen-og-dark.png",
        width: 1200,
        height: 630,
        alt: "ScopeGen vs Houzz Pro Comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScopeGen vs Houzz Pro: Contractor Software Comparison",
    description: "Compare ScopeGen vs Houzz Pro for contractor proposals. Free tier available vs $149/month.",
    images: ["/scopegen-og-dark.png"],
  },
  alternates: {
    canonical: "https://scopegenerator.com/vs/houzz-pro",
  },
};

export default function HouzzProComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
