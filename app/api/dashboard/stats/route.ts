import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch fresh user data from database (bypasses cookie cache)
    const user = await storage.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch all proposals for the user
    const proposals = await storage.getProposalsByUser(userId);

    // Calculate date range (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter proposals from last 30 days
    const proposalsLast30Days = proposals.filter(p => {
      const createdAt = new Date(p.createdAt || new Date().toISOString());
      return createdAt >= thirtyDaysAgo;
    });

    // Calculate metrics
    const totalProposals = proposalsLast30Days.length;

    // Revenue Won: Sum of won proposals from last 30 days
    const wonProposals = proposalsLast30Days.filter(p => p.status === 'won');
    const revenueWon = wonProposals.reduce((sum, p) => {
      // Use average of price range for revenue calculation
      const avgPrice = (p.priceLow + p.priceHigh) / 2;
      return sum + avgPrice;
    }, 0);

    // Pending: Proposals that are draft or sent (awaiting response)
    const pendingProposals = proposalsLast30Days.filter(p => 
      p.status === 'draft' || p.status === 'sent'
    );
    const pending = pendingProposals.length;

    // Proposal Credits: Check expiration
    const creditsExpired = user.creditsExpireAt && new Date(user.creditsExpireAt) < now;
    const proposalCredits = creditsExpired ? 0 : (user.proposalCredits || 0);
    const creditsExpireAt = user.creditsExpireAt;

    // Return all stats in one response
    const response = NextResponse.json({
      proposalCredits,
      creditsExpireAt,
      totalProposals,
      revenueWon: Math.round(revenueWon),
      pending,
    });

    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    logger.error('Error fetching dashboard stats', error as Error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
