import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/services/storage';
import { getRequestUserId } from '@/lib/services/requestUserId';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getRequestUserId(request);

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const proposalId = parseInt(id);
    const proposal = await storage.getProposal(proposalId);

    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    if (proposal.userId !== userId) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { message: 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getRequestUserId(request);

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const proposalId = parseInt(id);
    const body = await request.json();

    console.log(`[PATCH PROPOSAL APP_ROUTER] Updating proposal ${proposalId} for user ${userId}`, {
      bodyKeys: Object.keys(body),
      options: body.options,
      homeArea: body.options?.homeArea
    });

    const updated = await storage.updateProposal(proposalId, userId, body);

    if (!updated) {
      return NextResponse.json(
        { message: 'Proposal not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { message: 'Failed to update proposal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getRequestUserId(request);

    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const proposalId = parseInt(id);

    // First, fetch the proposal to check ownership and status
    const proposal = await storage.getProposal(proposalId);

    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (proposal.userId !== userId) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }

    // Only allow deletion of draft proposals
    if (proposal.status !== 'draft') {
      return NextResponse.json(
        { message: 'Only draft proposals can be deleted' },
        { status: 403 }
      );
    }

    const deleted = await storage.deleteProposal(proposalId, userId);

    if (!deleted) {
      return NextResponse.json(
        { message: 'Failed to delete proposal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Draft deleted successfully' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { message: 'Failed to delete proposal' },
      { status: 500 }
    );
  }
}
