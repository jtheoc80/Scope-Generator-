import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check authentication configuration status.
 * This helps diagnose sign-in/sign-up issues.
 */
export async function GET() {
  const hasPublishableKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
  const isClerkConfigured = hasPublishableKey && hasSecretKey;
  
  // Don't expose actual keys, just whether they're present
  return NextResponse.json({
    status: isClerkConfigured ? 'configured' : 'not_configured',
    details: {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: hasPublishableKey ? 'set' : 'missing',
      CLERK_SECRET_KEY: hasSecretKey ? 'set' : 'missing',
    },
    message: isClerkConfigured 
      ? 'Clerk authentication is configured. Sign-in/sign-up should work.'
      : 'Clerk authentication is NOT configured. Please set the required environment variables in Vercel.',
    requiredVariables: [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
    ],
    instructions: !isClerkConfigured ? [
      '1. Go to https://dashboard.clerk.com and create an application',
      '2. Copy the Publishable Key and Secret Key',
      '3. Go to your Vercel project settings → Environment Variables',
      '4. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY',
      '5. Redeploy your application',
    ] : undefined,
  });
}
