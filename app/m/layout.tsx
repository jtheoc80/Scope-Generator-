import { Metadata, Viewport } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/authUtils";
import { MobileLayoutClient } from "./layout-client";

export const metadata: Metadata = {
  title: "ScopeGen Mobile",
  description: "Capture photos and generate scopes + estimates on the go",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function MobileWebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated when Clerk is configured
  let userId: string | null = null;
  
  if (isClerkConfigured()) {
    const authResult = await auth();
    userId = authResult.userId;
    
    // Redirect to sign-in if not authenticated
    if (!userId) {
      redirect("/sign-in?redirect_url=/m");
    }
  }

  return <MobileLayoutClient isSignedIn={!!userId}>{children}</MobileLayoutClient>;
}
