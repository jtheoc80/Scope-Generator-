import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';
import { insertProposalSchema } from '@shared/schema';

export async function GET() {
  try {
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
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has contractor information set up
    const user = await storage.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Require contractor name and address before creating proposals
    if (!user.companyName || !user.companyAddress) {
      return NextResponse.json(
        { 
          message: 'Please complete your company profile before creating proposals. Company name and address are required.',
          code: 'MISSING_CONTRACTOR_INFO'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const validationResult = insertProposalSchema.safeParse({
      ...body,
      userId,
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

    const proposal = await storage.createProposal(validationResult.data);
    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { message: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}
