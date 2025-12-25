import type { Metadata } from "next";
import Link from "next/link";
import { isClerkConfigured } from "@/lib/authUtils";
import SignOutClient from "./sign-out-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function SignOutPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Sign out</h1>
          <p className="mt-2 text-sm text-slate-600">
            Authentication isn’t configured, so there’s nothing to sign out of.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <SignOutClient />;
}

