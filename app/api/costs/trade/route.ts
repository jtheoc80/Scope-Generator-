import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { oneBuildService } from '@/lib/services/onebuild';
import { storage } from '@/lib/services/storage';

const FREE_PRICING_LOOKUPS = 3;

export async function GET(request: NextRequest) {
  try {
    if (!oneBuildService.isConfigured()) {
      return NextResponse.json(
        { message: "Cost data service not configured" },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const trade = searchParams.get('trade');
    const zipcode = searchParams.get('zipcode');

    if (!trade || !zipcode) {
      return NextResponse.json(
        { message: "trade and zipcode are required" },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const { userId } = await auth();

    if (userId) {
      // Authenticated user flow
      const user = await storage.getUser(userId);

      if (!user) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      const lookupCount = user.marketPricingLookups || 0;
      const isPro = user.subscriptionPlan === 'pro' || user.subscriptionPlan === 'crew';

      // Free users limited to 3 lookups (Pro/Crew users have unlimited)
      if (!isPro && lookupCount >= FREE_PRICING_LOOKUPS) {
        return NextResponse.json(
          {
            message: "Free lookup limit reached",
            limitReached: true,
            used: lookupCount,
            limit: FREE_PRICING_LOOKUPS
          },
          { status: 403 }
        );
      }

      const result = await oneBuildService.getTradePricing(trade, zipcode);

      // Only increment usage for free users after successful lookup
      // Pro/Crew users have unlimited access, so we don't track their usage
      if (!isPro) {
        await storage.incrementMarketPricingLookups(userId);
      }

      return NextResponse.json(result);
    } else {
      // Anonymous user - let client-side handle usage tracking via localStorage
      // Server just returns the data with an _anonymous flag
      const result = await oneBuildService.getTradePricing(trade, zipcode);

      return NextResponse.json({ ...result, _anonymous: true });
    }
  } catch (error) {
    console.error("Error fetching trade pricing:", error);
    return NextResponse.json(
      { message: "Failed to fetch trade pricing" },
      { status: 500 }
    );
  }
}
