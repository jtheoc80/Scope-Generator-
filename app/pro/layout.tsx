import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getPageMetadata("/pro");

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
