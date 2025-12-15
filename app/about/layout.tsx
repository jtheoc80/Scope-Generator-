import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - Lead Ledger Pro LLC",
  description: "Learn about Lead Ledger Pro LLC, the company behind ScopeGen. Based in Houston, Texas, we build professional proposal software for contractors.",
  keywords: ["ScopeGen", "Lead Ledger Pro", "contractor software company", "proposal software", "Houston Texas"],
  openGraph: {
    title: "About Lead Ledger Pro LLC | ScopeGen",
    description: "Learn about Lead Ledger Pro LLC, the company behind ScopeGen contractor proposal software.",
    url: "https://scopegenerator.com/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Lead Ledger Pro LLC | ScopeGen",
    description: "Learn about Lead Ledger Pro LLC, the company behind ScopeGen contractor proposal software.",
  },
  alternates: {
    canonical: "https://scopegenerator.com/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
