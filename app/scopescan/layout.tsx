import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScopeScan - AI-Powered Photo Analysis for Contractors",
  description: "Turn job site photos into detailed proposals in minutes. ScopeScan uses AI to analyze your photos and generate accurate scope items, material lists, and pricing.",
  openGraph: {
    title: "ScopeScan - AI-Powered Photo Analysis",
    description: "Turn job site photos into detailed proposals in minutes with AI.",
  },
};

export default function ScopeScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
