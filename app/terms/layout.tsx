import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "ScopeGen terms of service. Read our terms and conditions for using our contractor proposal software operated by Lead Ledger Pro LLC.",
  keywords: ["ScopeGen terms of service", "contractor software terms", "terms and conditions"],
  openGraph: {
    title: "Terms of Service | ScopeGen",
    description: "Read our terms and conditions for using ScopeGen contractor proposal software.",
    url: "https://scopegenerator.com/terms",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | ScopeGen",
    description: "Read our terms and conditions for using ScopeGen contractor proposal software.",
  },
  alternates: {
    canonical: "https://scopegenerator.com/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
