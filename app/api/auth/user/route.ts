import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userFirstName: string | null = null;
    let userLastName: string | null = null;
    let userImage: string | null = null;

    // Try Clerk first
    try {
      const clerkAuth = await auth();
      userId = clerkAuth.userId;
      
      if (userId) {
        const clerkUser = await currentUser();
        if (clerkUser) {
            userEmail = clerkUser.emailAddresses[0]?.emailAddress || null;
            userFirstName = clerkUser.firstName || null;
            userLastName = clerkUser.lastName || null;
            userImage = clerkUser.imageUrl || null;
        }
      }
    } catch (e) {
      // Clerk failed or not configured, ignore
    }

    // Fallback to Dev/Mock Auth
    if (!userId) {
      const cookieStore = await cookies();
      const devToken = cookieStore.get('dev_token');
      if (devToken?.value === 'dev-access') {
        userId = 'user_dev_123';
        userEmail = 'dev@example.com';
        userFirstName = 'Dev';
        userLastName = 'User';
      }
    }
    
    if (!userId) {
      return NextResponse.json(null);
    }

    // Get user from database
    let user = await storage.getUser(userId);
    
    // If user doesn't exist in database, create them
    if (!user) {
      user = await storage.upsertUser({
        id: userId,
        email: userEmail,
        firstName: userFirstName,
        lastName: userLastName,
        profileImageUrl: userImage,
      });
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
