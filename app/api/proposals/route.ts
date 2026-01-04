import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/services/storage';
import { insertProposalSchema } from '@shared/schema';
import { getRequestUserId } from '@/lib/services/requestUserId';

export async function GET() {
  try {
    // NOTE: No NextRequest available here; this endpoint is not used by QA cookie auth.
    // It remains Clerk-only for now.
    const { auth } = await import('@clerk/nextjs/server');
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const proposals = await storage.getProposalsByUser(userId);
    
    // Get view stats for all proposals
    const proposalIds = proposals.map(p => p.id);
    const viewStats = await storage.getProposalViewStatsBulk(proposalIds);
    
    // Merge view stats into proposals
    const proposalsWithViews = proposals.map(p => ({
      ...p,
      viewCount: viewStats[p.id]?.viewCount || 0,
      lastViewedAt: viewStats[p.id]?.lastViewedAt || null,
    }));
    
    return NextResponse.json(proposalsWithViews);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { message: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getRequestUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Ensure scopeSections defaults to empty array (never undefined)
    const validationResult = insertProposalSchema.safeParse({
      ...body,
      userId,
      // Default scopeSections to [] if not provided
      scopeSections: body.scopeSections ?? [],
    });

    if (!validationResult.success) {
      const message =
        validationResult.error.issues?.[0]?.message ??
        validationResult.error.message ??
        'Invalid proposal data';
      return NextResponse.json(
        { message },
        { status: 400 }
      );
    }

    // Log basic insert metadata for debugging without exposing field names
    const fieldCount = Object.keys(validationResult.data).length;
    console.log('[proposals/POST] Validated proposal payload with', fieldCount, 'fields');

    const proposal = await storage.createProposal(validationResult.data);
    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { message: "Failed to create proposal" },
      { status: 500 }
    );
  }
}
