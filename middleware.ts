import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
  '/crew(.*)',
  '/pricing-insights(.*)',
  '/search-console(.*)',
  '/api/proposals(.*)',
  '/api/profile(.*)',
  '/api/stripe/checkout(.*)',
  '/api/stripe/portal(.*)',
]);

// Define public routes that don't need authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/app(.*)',
  '/generator(.*)',
  '/calculator(.*)',
  '/market-pricing(.*)',
  '/blog(.*)',
  '/about(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/vs/(.*)',
  '/p/(.*)',
  '/invite/(.*)',
  '/api/public/(.*)',
  '/api/stripe/webhook(.*)',
  '/api/stripe/config(.*)',
  '/api/stripe/verify-session(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sign-out(.*)',
]);

const isClerkServerConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

const middleware = isClerkServerConfigured
  ? clerkMiddleware(async (auth, req) => {
      // Always allow public routes through
      if (isPublicRoute(req)) return;

      // Only protect explicitly-protected routes
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })
  : () => NextResponse.next();

export default middleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
