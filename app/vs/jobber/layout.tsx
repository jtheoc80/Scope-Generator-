import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScopeGen vs Jobber - Contractor Proposal Software Comparison",
  description: "Compare ScopeGen vs Jobber for contractor proposals. See the differences in pricing, features, ease of use, and find out which proposal software is right for your home service business.",
  keywords: ["ScopeGen vs Jobber", "Jobber alternative", "contractor proposal software comparison", "field service management software", "proposal software for contractors"],
  openGraph: {
    title: "ScopeGen vs Jobber: Which Proposal Software is Right for You?",
    description: "Compare ScopeGen vs Jobber for contractor proposals. See pricing differences, features, and find the best fit for your business.",
    url: "https://scopegenerator.com/vs/jobber",
    type: "article",
    images: [
      {
        url: "/scopegen-og-dark.png",
        width: 1200,
        height: 630,
        alt: "ScopeGen vs Jobber Comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScopeGen vs Jobber: Contractor Software Comparison",
    description: "Compare ScopeGen vs Jobber for contractor proposals. Free tier available vs $49/month.",
    images: ["/scopegen-og-dark.png"],
  },
  alternates: {
    canonical: "https://scopegenerator.com/vs/jobber",
  },
};

export default function JobberComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
