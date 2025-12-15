import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/services/storage';

export async function GET(
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

    const proposal = await storage.getProposalByPublicToken(token);
    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Record view (non-blocking)
    const viewerIp = request.headers.get('x-forwarded-for')?.split(',')[0] || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    storage.recordProposalView(proposal.id, viewerIp, userAgent).catch(err => 
      console.error('Error recording proposal view:', err)
    );

    // Update proposal status to 'viewed' if currently 'sent'
    if (proposal.status === 'sent') {
      storage.updateProposal(proposal.id, proposal.userId, { status: 'viewed' }).catch(err =>
        console.error('Error updating proposal status to viewed:', err)
      );
    }

    const user = await storage.getUser(proposal.userId);
    
    return NextResponse.json({
      proposal: {
        id: proposal.id,
        clientName: proposal.clientName,
        address: proposal.address,
        jobTypeName: proposal.jobTypeName,
        scope: proposal.scope,
        priceLow: proposal.priceLow,
        priceHigh: proposal.priceHigh,
        options: proposal.options,
        status: proposal.status,
        acceptedAt: proposal.acceptedAt,
        acceptedByName: proposal.acceptedByName,
        acceptedByEmail: proposal.acceptedByEmail,
        signature: proposal.signature,
        contractorSignature: proposal.contractorSignature,
        contractorSignedAt: proposal.contractorSignedAt,
      },
      companyInfo: user ? {
        companyName: user.companyName,
        companyAddress: user.companyAddress,
        companyPhone: user.companyPhone,
        companyLogo: user.companyLogo,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching public proposal:', error);
    return NextResponse.json(
      { message: 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}
