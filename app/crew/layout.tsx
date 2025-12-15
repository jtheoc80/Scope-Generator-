import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crew Management - Team Workspace",
  description: "Manage your contractor team with ScopeGen Crew. Invite team members, share proposals, and collaborate on projects together.",
  keywords: ["contractor team management", "crew management software", "contractor workspace", "team collaboration"],
  openGraph: {
    title: "Crew Management | ScopeGen",
    description: "Manage your contractor team with ScopeGen Crew. Invite team members and collaborate on proposals.",
    url: "https://scopegenerator.com/crew",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Crew Management | ScopeGen",
    description: "Manage your contractor team with ScopeGen Crew.",
  },
  alternates: {
    canonical: "https://scopegenerator.com/crew",
  },
  robots: {
    index: false, // Crew page requires login, so we don't want it indexed
    follow: true,
  },
};

export default function CrewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
