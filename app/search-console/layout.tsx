import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Console - Internal",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function SearchConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
