import { Metadata, Viewport } from "next";
import { auth } from "@clerk/nextjs/server";
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
  // Public base layout for all `/m/*` routes.
  // Auth enforcement is handled in `/m/(authed)/*` so `/m/upload/*` can be used
  // immediately from a QR code without triggering a sign-in flow.
  let userId: string | null = null;
  
  if (isClerkConfigured()) {
    const authResult = await auth();
    userId = authResult.userId;
  }

  return <MobileLayoutClient isSignedIn={!!userId}>{children}</MobileLayoutClient>;
}
