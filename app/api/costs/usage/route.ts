import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';

const FREE_PRICING_LOOKUPS = 3;

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await storage.getUser(userId);
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const lookupCount = user.marketPricingLookups || 0;
    const isPro = user.subscriptionPlan === 'pro' || user.subscriptionPlan === 'crew';
    const remaining = Math.max(0, FREE_PRICING_LOOKUPS - lookupCount);

    return NextResponse.json({
      used: lookupCount,
      remaining: isPro ? -1 : remaining, // -1 means unlimited for Pro users
      limit: FREE_PRICING_LOOKUPS,
      isPro,
      hasAccess: isPro || remaining > 0
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { message: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
