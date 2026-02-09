import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/services/storage';
import { sendProposalAcceptedNotification } from '@/lib/services/emailService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, signature } = body;

    if (!name || !email) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { message: 'Signature is required' },
        { status: 400 }
      );
    }

    // Get the proposal by token
    const proposal = await storage.getProposalByPublicToken(token);
    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (proposal.status === 'accepted' || proposal.acceptedAt) {
      return NextResponse.json(
        { message: 'This proposal has already been accepted' },
        { status: 400 }
      );
    }

    // Accept the proposal
    const updatedProposal = await storage.acceptProposal(token, name, email, signature);
    
    if (!updatedProposal) {
      return NextResponse.json(
        { message: 'Failed to accept proposal' },
        { status: 500 }
      );
    }

    // Send notification to contractor (non-blocking)
    const user = await storage.getUser(proposal.userId);
    if (user?.email) {
      // Calculate total price - for multi-service, sum all line items
      let totalPrice: number;
      if (proposal.lineItems && proposal.lineItems.length > 1) {
        let totalLow = 0;
        let totalHigh = 0;
        for (const item of proposal.lineItems) {
          totalLow += item.priceLow ?? 0;
          totalHigh += item.priceHigh ?? 0;
        }
        totalPrice = Math.round((totalLow + totalHigh) / 2);
      } else {
        totalPrice = Math.round((proposal.priceLow + proposal.priceHigh) / 2);
      }
      
      sendProposalAcceptedNotification({
        contractorEmail: user.email,
        contractorName: user.firstName || undefined,
        clientName: proposal.clientName,
        clientEmail: email,
        acceptedByName: name,
        projectTitle: proposal.jobTypeName,
        projectAddress: proposal.address,
        totalPrice,
        acceptedAt: new Date(),
      }).catch(err => console.error('Error sending acceptance notification:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Proposal accepted successfully',
    });
  } catch (error) {
    console.error('Error accepting proposal:', error);
    return NextResponse.json(
      { message: 'Failed to accept proposal' },
      { status: 500 }
    );
  }
}
