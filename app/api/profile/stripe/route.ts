import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userStripeSecretKey, userStripeEnabled } = body;
    
    const trimmedKey = userStripeSecretKey?.trim() || null;
    
    if (trimmedKey) {
      if (typeof trimmedKey !== 'string' || !trimmedKey.startsWith('sk_live_')) {
        return NextResponse.json(
          { message: 'Invalid Stripe secret key format. Please use a live key starting with sk_live_' },
          { status: 400 }
        );
      }
    }
    
    // Get existing user to check if they already have a key
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Determine if user has a valid key (new or existing)
    const hasKey = !!trimmedKey || !!existingUser.userStripeSecretKey;
    
    const user = await storage.updateUserStripeSettings(userId, {
      // Only update key if a new one was provided
      userStripeSecretKey: trimmedKey !== null ? trimmedKey : undefined,
      // Enable only if user has a key (new or existing)
      userStripeEnabled: hasKey ? (userStripeEnabled ?? false) : false,
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Failed to update settings' },
        { status: 404 }
      );
    }

    const { userStripeSecretKey: _, ...safeUser } = user;
    void _; // Explicitly unused - excluded from response for security
    const hasStripeKey = !!user.userStripeSecretKey;
    
    return NextResponse.json({ ...safeUser, hasStripeKey });
  } catch (error) {
    console.error('Error updating Stripe settings:', error);
    return NextResponse.json(
      { message: 'Failed to update Stripe settings' },
      { status: 500 }
    );
  }
}
