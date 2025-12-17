import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';
import { isClerkServerConfigured } from '@/lib/authUtils';

export async function GET() {
  try {
    // If Clerk isn't configured server-side, treat as unauthenticated.
    // This prevents confusing 500s and makes the UI state consistent.
    if (!isClerkServerConfigured()) {
      return NextResponse.json(null);
    }

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
    
    return NextResponse.json({ ...safeUser, hasStripeKey });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
