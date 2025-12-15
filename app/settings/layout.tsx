import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Account Preferences",
  description: "Manage your ScopeGen account settings, company information, and pricing preferences.",
  robots: {
    index: false, // Settings requires login
    follow: false,
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
