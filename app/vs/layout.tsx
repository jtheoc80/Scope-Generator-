import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScopeGen Comparisons - vs Buildertrend, Jobber, Houzz Pro",
  description: "Compare ScopeGen to other contractor software like Buildertrend, Jobber, and Houzz Pro. See which proposal software is right for your business.",
  keywords: ["ScopeGen vs Buildertrend", "ScopeGen vs Jobber", "ScopeGen vs Houzz Pro", "contractor software comparison", "proposal software comparison"],
  openGraph: {
    title: "ScopeGen Software Comparisons | Contractor Proposal Tools",
    description: "Compare ScopeGen to Buildertrend, Jobber, and Houzz Pro. Find the best proposal software for your contracting business.",
    url: "https://scopegenerator.com/vs",
    type: "website",
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "ScopeGen Software Comparisons",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScopeGen Software Comparisons",
    description: "Compare ScopeGen to Buildertrend, Jobber, and Houzz Pro.",
    images: ["/opengraph.jpg"],
  },
  alternates: {
    canonical: "https://scopegenerator.com/vs",
  },
};

export default function ComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
