import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contractor Blog - Proposal Tips & Business Advice",
  description: "Free resources for contractors: proposal writing tips, pricing guides, scope of work templates, and business advice to help you win more jobs.",
  keywords: ["contractor blog", "proposal tips", "contractor business advice", "scope of work templates", "construction pricing guide"],
  openGraph: {
    title: "Contractor Blog - Proposal Tips & Business Advice",
    description: "Free resources for contractors: proposal writing tips, pricing guides, and business advice.",
    url: "https://scopegenerator.com/blog",
    type: "website",
    images: [
      {
        url: "/scopegen-og-dark.png",
        width: 1200,
        height: 630,
        alt: "ScopeGen Contractor Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contractor Blog - Proposal Tips & Business Advice",
    description: "Free resources for contractors: proposal writing tips, pricing guides, and business advice.",
    images: ["/scopegen-og-dark.png"],
  },
  alternates: {
    canonical: "https://scopegenerator.com/blog",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
