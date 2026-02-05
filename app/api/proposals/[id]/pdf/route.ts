import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/services/storage';
import { getRequestUserId } from '@/lib/services/requestUserId';
import { buildProposalPdf } from '@/lib/services/proposalPdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proposalId = parseInt(id);

    if (isNaN(proposalId)) {
      return NextResponse.json(
        { message: 'Invalid proposal ID' },
        { status: 400 }
      );
    }

    // Get proposal - allow public access if token is provided
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    let proposal;
    let companyInfo = null;
    let user;

    if (token) {
      // Public access via token
      proposal = await storage.getProposalByPublicToken(token);
      if (proposal) {
        user = await storage.getUser(proposal.userId);
        companyInfo = user ? {
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          companyPhone: user.companyPhone,
          licenseNumber: user.licenseNumber,
          companyLogo: user.companyLogo,
        } : null;
      }
    } else {
      const userId = await getRequestUserId(request);
      if (!userId) {
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        );
      }
      // Authenticated access
      proposal = await storage.getProposal(proposalId);
      if (proposal && proposal.userId !== userId) {
        return NextResponse.json(
          { message: 'Access denied' },
          { status: 403 }
        );
      }
      if (proposal) {
        user = await storage.getUser(userId);

        // Check if proposal is unlocked - no credit deduction here
        // Credits are deducted via /unlock endpoint for free users
        // or at creation time for Pro users
        if (!proposal.isUnlocked) {
          return NextResponse.json(
            {
              message: 'Proposal must be unlocked first',
              requiresUnlock: true
            },
            { status: 402 }
          );
        }

        companyInfo = user ? {
          companyName: user.companyName,
          companyAddress: user.companyAddress,
          companyPhone: user.companyPhone,
          licenseNumber: user.licenseNumber,
          companyLogo: user.companyLogo,
        } : null;
      }
    }

    if (!proposal) {
      return NextResponse.json(
        { message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Generate PDF (deterministic bytes + stable filename)
    // Check if user is Pro (either the owner for public links, or the current user/owner for auth access)
    // For authenticated access, 'user' is the current user (owner).
    // For public access, 'user' was fetched above based on proposal.userId.
    // In both cases, 'user' variable holds the owner's record.
    const isPro = user?.isPro || false;

    const { pdfBytes, filename, sha256 } = buildProposalPdf({
      proposal: proposal as any,
      companyInfo,
      isPro,
    });

    const encodedFilename = encodeURIComponent(filename);
    const byteLength = Buffer.byteLength(Buffer.from(pdfBytes));

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Length': String(byteLength),
        'ETag': `"${sha256}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { message: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
