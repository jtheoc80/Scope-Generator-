import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/server/storage';

// GET /api/analytics/insights - Get enhanced business insights
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const insights = await storage.getEnhancedProposalAnalytics(userId);
    
    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { message: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
