import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Proposal - Contractor Proposal Generator",
  description: "Create professional contractor proposals in 60 seconds. Choose your trade, answer a few questions, and generate a complete scope of work with pricing.",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
