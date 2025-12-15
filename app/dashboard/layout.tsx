import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - My Proposals",
  description: "Manage your contractor proposals. View, edit, and track all your proposals in one place.",
  robots: {
    index: false, // Dashboard requires login
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
