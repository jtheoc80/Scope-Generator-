import type { Metadata } from "next";

// /pro is an authenticated dashboard — client-side auth check redirects
// non-Pro users.  noindex prevents Google from attempting to index a page
// that it can never fully render.
export const metadata: Metadata = {
  title: "ScopeGen Pro Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
