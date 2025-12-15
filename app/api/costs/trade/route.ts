import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';
import { oneBuildService } from '@/lib/services/onebuild';

// Free users get 3 lookups, Pro/Crew get unlimited
const FREE_LOOKUP_LIMIT = 3;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const trade = searchParams.get('trade');
    const zipcode = searchParams.get('zipcode');

    if (!trade || !zipcode) {
      return NextResponse.json(
        { message: 'Missing required parameters: trade and zipcode' },
        { status: 400 }
      );
    }

    // Validate zipcode format
    if (!/^\d{5}$/.test(zipcode)) {
      return NextResponse.json(
        { message: 'Invalid zipcode format' },
        { status: 400 }
      );
    }

    // Check if 1build service is configured
    if (!oneBuildService.isConfigured()) {
      return NextResponse.json(
        { message: 'Cost data service not configured' },
        { status: 503 }
      );
    }

    // Get user and check subscription/usage
    const user = await storage.getUser(userId);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has Pro or Crew subscription
    const isPro = user.subscriptionPlan === 'pro' || user.subscriptionPlan === 'crew';
    const currentLookups = user.marketPricingLookups || 0;

    // If not pro and limit reached, return error
    if (!isPro && currentLookups >= FREE_LOOKUP_LIMIT) {
      return NextResponse.json(
        { 
          message: 'Free lookup limit reached',
          limitReached: true,
          used: currentLookups,
          limit: FREE_LOOKUP_LIMIT,
        },
        { status: 403 }
      );
    }

    // Fetch pricing data from 1build
    const pricing = await oneBuildService.getTradePricing(trade, zipcode);

    // Only increment usage for non-pro users when we get valid results
    if (!isPro && (pricing.materials.length > 0 || pricing.labor.length > 0)) {
      await storage.incrementMarketPricingLookups(userId);
    }

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Error fetching trade pricing:', error);
    return NextResponse.json(
      { message: 'Failed to fetch trade pricing' },
      { status: 500 }
    );
  }
}
