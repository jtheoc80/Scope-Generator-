import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScopeGen Comparisons - vs Buildertrend, Jobber, Houzz Pro",
  description: "Compare ScopeGen to other contractor software like Buildertrend, Jobber, and Houzz Pro. See which proposal software is right for your business.",
  keywords: ["ScopeGen vs Buildertrend", "ScopeGen vs Jobber", "ScopeGen vs Houzz Pro", "contractor software comparison", "proposal software comparison"],
};

export default function ComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
