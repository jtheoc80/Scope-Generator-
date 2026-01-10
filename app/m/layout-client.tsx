"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export function MobileLayoutClient({
  isSignedIn,
  children,
}: {
  isSignedIn: boolean;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const showBackToHome = pathname !== "/m";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - responsive for mobile and desktop */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 safe-area-inset-top">
        <div className="mx-auto max-w-4xl px-4 py-3 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showBackToHome && (
                <Link
                  href="/m"
                  aria-label="Back to home"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  data-testid="button-back-home"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </Link>
              )}

              <Link
                href="/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                data-testid="link-logo-home"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-slate-900">
                  {t.mobile.scopeScan}
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {isSignedIn && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  ✓ {t.nav.signedIn}
                </span>
              )}
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full sm:hidden">
                Mobile Web
              </span>
              <span className="hidden sm:inline-flex text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                Desktop Web
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pb-safe">{children}</main>
    </div>
  );
}
