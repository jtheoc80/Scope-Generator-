import { Metadata, Viewport } from "next";

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

export default function MobileWebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">ScopeGen</h1>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            Mobile Web
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="pb-safe">{children}</main>
    </div>
  );
}
