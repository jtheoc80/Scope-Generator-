// Middleware disabled - Clerk authentication removed due to Edge Function bundling incompatibility
// The @clerk/nextjs/server imports reference Node-only modules (@clerk/shared/buildAccountsBaseUrl,
// #crypto, #safe-node-apis) that cannot be bundled for Vercel Edge Functions.
//
// Authentication is conditionally enabled via isClerkConfigured() in app/layout.tsx.
// When Clerk is re-enabled with Edge-compatible packages, restore clerkMiddleware here.
//
// Previous implementation:
// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// const isProtectedRoute = createRouteMatcher(['/app(.*)', '/api(.*)']);
// export default clerkMiddleware(async (auth, req) => {
//   if (isProtectedRoute(req)) await auth.protect();
// });

import { NextResponse } from 'next/server'

export function middleware() {
  // Pass through all requests - authentication handled at component level when Clerk is configured
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
