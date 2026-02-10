import type { Metadata } from "next";

// /app is a protected route (Clerk middleware redirects unauthenticated
// visitors to /sign-in).  noindex prevents Google from reporting "Page
// with redirect" in Search Console.
export const metadata: Metadata = {
  title: "Create Proposal - Contractor Proposal Generator",
  description: "Create professional contractor proposals in 60 seconds. Choose your trade, answer a few questions, and generate a complete scope of work with pricing.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
