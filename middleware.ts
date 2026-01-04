import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { isTestAuthMode, TEST_SESSION_COOKIE, validateTestSession } from "@/lib/test-auth";

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

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

/**
 * Middleware handler for test auth mode
 * Validates test session cookies instead of using Clerk
 */
function testAuthHandler(req: NextRequest) {
  // For protected routes in test mode, validate the test session cookie
  if (isProtectedRoute(req)) {
    const sessionCookie = req.cookies.get(TEST_SESSION_COOKIE);
    const session = validateTestSession(sessionCookie?.value);

    if (!session) {
      // No valid test session - redirect to sign-in
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Valid test session - allow the request to proceed
    console.log(`[QA] Test session validated for user: ${session.userId}`);
  }

  return NextResponse.next();
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// Use test auth handler in test mode, otherwise use Clerk or no-op
export default isTestAuthMode()
  ? testAuthHandler
  : clerkConfigured
  ? clerkHandler
  : (_req: NextRequest) => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
