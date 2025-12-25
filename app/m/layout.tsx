import { Metadata, Viewport } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isClerkConfigured } from "@/lib/authUtils";

export const metadata: Metadata = {
  title: "ScopeGen Mobile",
  description: "Capture photos and generate proposals on the go",
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <Link href="/m" className="text-lg font-semibold text-slate-900">
            ScopeGen
          </Link>
          <div className="flex items-center gap-2">
            {userId && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                ✓ Signed In
              </span>
            )}
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              Mobile Web
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pb-safe">{children}</main>
    </div>
  );
}
