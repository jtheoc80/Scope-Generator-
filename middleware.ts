import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/authUtils";

// 1. Define routes that should be protected
const isProtectedRoute = createRouteMatcher([
  '/app(.*)',      // Protects anything under /app
  '/api/trpc(.*)', // Protects API routes if you have them
]);

// 2. Create the middleware based on Clerk availability
const clerkHandler = isClerkConfigured()
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })
  : () => NextResponse.next();

export default clerkHandler;

// 3. The standard Next.js config matcher
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
