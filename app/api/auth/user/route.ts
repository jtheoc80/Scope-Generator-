import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(null);
    }

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
    
    // Check if user has active access (Pro subscription OR active trial)
    const now = new Date();
    const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    const isInTrial = trialEndsAt && trialEndsAt > now;
    const hasActiveAccess = user.isPro || isInTrial;
    
    // Calculate trial days remaining
    const trialDaysRemaining = trialEndsAt && trialEndsAt > now 
      ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    return NextResponse.json({ 
      ...safeUser, 
      hasStripeKey,
      hasActiveAccess,
      isInTrial,
      trialDaysRemaining,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
