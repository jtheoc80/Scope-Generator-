import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScopeGen vs Buildertrend - Contractor Proposal Software Comparison",
  description: "Compare ScopeGen vs Buildertrend for contractor proposals. See the differences in pricing, features, ease of use, and find out which proposal software is right for your construction business.",
  keywords: ["ScopeGen vs Buildertrend", "Buildertrend alternative", "contractor proposal software comparison", "construction management software", "proposal software for contractors"],
  openGraph: {
    title: "ScopeGen vs Buildertrend: Which Proposal Software is Right for You?",
    description: "Compare ScopeGen vs Buildertrend for contractor proposals. See pricing differences, features, and find the best fit for your business.",
    url: "https://scopegenerator.com/vs/buildertrend",
    type: "article",
    images: [
      {
        url: "/scopegen-og-dark.png",
        width: 1200,
        height: 630,
        alt: "ScopeGen vs Buildertrend Comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScopeGen vs Buildertrend: Contractor Software Comparison",
    description: "Compare ScopeGen vs Buildertrend for contractor proposals. Free tier available vs $499/month.",
    images: ["/scopegen-og-dark.png"],
  },
  alternates: {
    canonical: "https://scopegenerator.com/vs/buildertrend",
  },
};

export default function BuildertrendComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
