import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const proposalId = parseInt(id);
    
    const user = await storage.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const proposal = await storage.getProposal(proposalId);
    if (!proposal || proposal.userId !== userId) {
      return NextResponse.json(
        { message: 'Proposal not found or access denied' },
        { status: 404 }
      );
    }

    if (proposal.isUnlocked) {
      return NextResponse.json(proposal);
    }

    const hasValidCredits = user.proposalCredits > 0 && 
      (!user.creditsExpireAt || new Date() < user.creditsExpireAt);

    if (!hasValidCredits) {
      return NextResponse.json(
        { 
          message: 'No credits available',
          requiresPayment: true 
        },
        { status: 402 }
      );
    }

    const updatedUser = await storage.deductProposalCredit(userId);
    if (!updatedUser) {
      return NextResponse.json(
        { 
          message: 'Failed to deduct credit',
          requiresPayment: true 
        },
        { status: 402 }
      );
    }

    const unlocked = await storage.unlockProposal(proposalId, userId);
    
    if (!unlocked) {
      return NextResponse.json(
        { message: 'Failed to unlock proposal' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...unlocked,
      remainingCredits: updatedUser.proposalCredits
    });
  } catch (error) {
    console.error('Error unlocking proposal:', error);
    return NextResponse.json(
      { message: 'Failed to unlock proposal' },
      { status: 500 }
    );
  }
}
