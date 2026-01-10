import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel - ScopeGen",
  description: "Administration panel for managing users and entitlements.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
