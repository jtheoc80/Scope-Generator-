import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Check if Clerk is configured by verifying environment variables
function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );
}

// Check configuration once at module load time
const clerkConfigured = isClerkConfigured();

// Import Clerk conditionally only if configured
// Note: We use dynamic imports at build time to avoid crashes when Clerk is not configured
let clerkMiddleware: any;
let createRouteMatcher: any;
let isProtectedRoute: any;

if (clerkConfigured) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const clerk = require("@clerk/nextjs/server");
  clerkMiddleware = clerk.clerkMiddleware;
  createRouteMatcher = clerk.createRouteMatcher;
  isProtectedRoute = createRouteMatcher(['/app(.*)', '/api/trpc(.*)']);
}

// Export middleware - conditionally use Clerk or passthrough
export default clerkConfigured
  ? clerkMiddleware(async (auth: any, req: any) => {
      if (isProtectedRoute(req)) await auth.protect();
    })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  : function middleware(_req: NextRequest) {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
