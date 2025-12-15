import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';

// Free users get 3 lookups, Pro/Crew get unlimited
const FREE_LOOKUP_LIMIT = 3;

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has Pro or Crew subscription
    const isPro = user.subscriptionPlan === 'pro' || user.subscriptionPlan === 'crew';
    const used = user.marketPricingLookups || 0;
    
    // Pro users get unlimited (-1), free users get 3 - used
    const remaining = isPro ? -1 : Math.max(0, FREE_LOOKUP_LIMIT - used);
    
    return NextResponse.json({
      used,
      remaining,
      limit: FREE_LOOKUP_LIMIT,
      isPro,
      hasAccess: isPro || remaining > 0,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { message: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
