import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
]);

export default clerkMiddleware(async (auth, req) => {
  // If it's a protected route, require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
