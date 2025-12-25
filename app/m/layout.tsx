import { Metadata, Viewport } from "next";
import { auth } from "@clerk/nextjs/server";
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
  let isAuthenticated = false;
  
  if (isClerkConfigured()) {
    try {
      const authResult = await auth();
      userId = authResult.userId;
      isAuthenticated = !!userId;
    } catch {
      // Auth check failed, allow access in dev mode
      isAuthenticated = false;
    }
  } else {
    // Clerk not configured - allow access (dev mode)
    isAuthenticated = true;
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
            {isClerkConfigured() ? (
              isAuthenticated ? (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  ✓ Signed In
                </span>
              ) : (
                <Link 
                  href="/sign-in?redirect_url=/m"
                  className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full hover:bg-orange-100"
                >
                  Sign In
                </Link>
              )
            ) : (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                Dev Mode
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
