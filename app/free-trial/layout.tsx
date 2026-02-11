import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Your Free Trial | ScopeGen",
  description:
    "Choose a plan and start your 3-day free trial of ScopeGen. Generate professional contractor proposals in seconds. No credit card required.",
};

export default function FreeTrialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
