import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { auth, currentUser } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';
import { billingService } from '@/lib/services/billingService';
import { checkCrewEntitlement } from '@/lib/entitlements';
import {
  createSessionToken,
  verifySessionToken,
  USER_SESSION_COOKIE,
  USER_SESSION_MAX_AGE,
  type UserSessionData
} from '@/lib/user-session';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(null);
    }

    const { searchParams } = new URL(request.url);
    const skipCache = searchParams.get('skipCache') === 'true';

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(USER_SESSION_COOKIE);

    // 1. Try to serve from cache (unless skipping)
    if (!skipCache && sessionCookie?.value) {
      const cachedData = verifySessionToken(sessionCookie.value);

      // Ensure cache belongs to the currently authenticated user
      if (cachedData && cachedData.id === userId) {
        // Remove internal cache fields before sending to client
        const { cachedAt, expiresAt, ...clientData } = cachedData;

        // CRITICAL: Fetch trialEndsAt and credits FRESH from database
        // Cached values may be stale if database was modified directly
        const dbUser = await storage.getUser(userId);
        const now = new Date();
        const trialEndsAt = dbUser?.trialEndsAt ? new Date(dbUser.trialEndsAt) : null;
        const isInTrial = (trialEndsAt && trialEndsAt > now) || false;
        const trialDaysRemaining = trialEndsAt && trialEndsAt > now
          ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        // Check credits from DB too for accurate hasActiveAccess
        const creditsExpired = dbUser?.creditsExpireAt && new Date(dbUser.creditsExpireAt) < now;
        const hasCredits = (dbUser?.proposalCredits || 0) > 0 && !creditsExpired;

        // Also fetch subscription data fresh for cancelAtPeriodEnd status
        const subscription = await billingService.getSubscriptionByUserId(userId);

        // Override cached values with fresh DB values
        clientData.isInTrial = isInTrial;
        clientData.trialDaysRemaining = trialDaysRemaining;
        clientData.trialEndsAt = dbUser?.trialEndsAt || null;
        clientData.proposalCredits = dbUser?.proposalCredits || 0;
        clientData.hasActiveAccess = clientData.isPro || isInTrial || hasCredits;
        clientData.cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd || false;
        clientData.currentPeriodEnd = subscription?.currentPeriodEnd
          ? new Date(subscription.currentPeriodEnd).toISOString()
          : null;

        // Also get companyLogo if missing
        if (!clientData.companyLogo && dbUser?.companyLogo) {
          clientData.companyLogo = dbUser.companyLogo;
        }

        console.log(`[AUTH] Serving user ${userId} from cache (trial/credits/subscription fresh from DB)`, {
          isInTrial,
          trialDaysRemaining,
          trialEndsAt: trialEndsAt?.toISOString(),
          proposalCredits: clientData.proposalCredits,
          cancelAtPeriodEnd: clientData.cancelAtPeriodEnd,
          currentPeriodEnd: clientData.currentPeriodEnd,
        });
        return NextResponse.json(clientData);
      }
    }

    // 2. Fetch from Database (Cache Miss)
    console.log(`[AUTH] Cache miss for user ${userId}, fetching from DB`);

    // Get user from database
    let user = await storage.getUser(userId);

    // If user doesn't exist in database, create them from Clerk data
    if (!user) {
      const clerkUser = await currentUser();

      if (clerkUser) {
        user = await storage.upsertUser({
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || null,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          profileImageUrl: clerkUser.imageUrl || null,
        });
      }
    }

    if (!user) {
      return NextResponse.json(null);
    }

    // Remove sensitive data before returning
    const { userStripeSecretKey, ...safeUser } = user;
    const hasStripeKey = !!userStripeSecretKey;

    // Check if user has active access (Pro subscription OR active trial OR has credits)
    const now = new Date();
    const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    const isInTrial = (trialEndsAt && trialEndsAt > now) || false;

    // Check if credits are active (not expired)
    const creditsExpired = user.creditsExpireAt && new Date(user.creditsExpireAt) < now;
    const hasCredits = (user.proposalCredits || 0) > 0 && !creditsExpired;

    const hasActiveAccess = user.isPro || isInTrial || (hasCredits || false);

    // Calculate trial days remaining
    const trialDaysRemaining = trialEndsAt && trialEndsAt > now
      ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Check Crew entitlement (supports dev/staging overrides)
    const crewEntitlement = checkCrewEntitlement({
      userId,
      email: user.email,
      subscriptionPlan: user.subscriptionPlan,
    });

    const effectiveSubscriptionPlan = crewEntitlement.hasCrewAccess && crewEntitlement.isDevOverride
      ? 'crew'
      : safeUser.subscriptionPlan;

    // Fetch active subscription to check for cancellation status
    const subscription = await billingService.getSubscriptionByUserId(userId);

    const responseData: UserSessionData = {
      ...safeUser,
      subscriptionPlan: effectiveSubscriptionPlan,
      hasStripeKey,
      hasActiveAccess,
      isInTrial,
      trialDaysRemaining,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      currentPeriodEnd: subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toISOString() : null,
      // Dev override info (for displaying badges in non-prod)
      isDevCrewOverride: crewEntitlement.isDevOverride ?? undefined,
      devOverrideReason: crewEntitlement.isDevOverride ? crewEntitlement.reason : null,
      // Placeholder timestamps for the type definition (will be overwritten by createSessionToken)
      cachedAt: 0,
      expiresAt: 0,
    };

    // 3. Set Cache Cookie
    // Create the signed token
    const token = createSessionToken(responseData);

    // Set the cookie
    cookieStore.set(USER_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: USER_SESSION_MAX_AGE,
      path: '/',
    });

    // Remove internal fields before returning
    const { cachedAt, expiresAt, ...clientData } = responseData;

    // Debug: Log companyLogo status
    console.log('[AUTH] Returning user data:', {
      hasCompanyLogo: !!clientData.companyLogo,
      companyLogoSize: clientData.companyLogo ? clientData.companyLogo.length : 0,
    });

    return NextResponse.json(clientData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
