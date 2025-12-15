import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "ScopeGen privacy policy. Learn how Lead Ledger Pro LLC collects, uses, and protects your personal information when using our contractor proposal software.",
  keywords: ["ScopeGen privacy policy", "contractor software privacy", "data protection"],
  openGraph: {
    title: "Privacy Policy | ScopeGen",
    description: "Learn how we collect, use, and protect your personal information.",
    url: "https://scopegenerator.com/privacy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | ScopeGen",
    description: "Learn how we collect, use, and protect your personal information.",
  },
  alternates: {
    canonical: "https://scopegenerator.com/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
