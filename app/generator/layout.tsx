import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageMetadata("/generator");

export default function GeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
