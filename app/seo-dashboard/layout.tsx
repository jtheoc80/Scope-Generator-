import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO Dashboard - Internal",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function SeoDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
