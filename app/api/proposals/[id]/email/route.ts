import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';
import { sendProposalEmail } from '@/lib/services/emailService';
import { db } from '@/server/db';
import { mobileJobDrafts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

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
    const body = await request.json();
    
    const { recipientEmail, recipientName, message } = body;
    
    if (!recipientEmail) {
      return NextResponse.json(
        { message: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Get the proposal
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

    // Get user info for sender details
    const user = await storage.getUser(userId);

    // Generate public token if not exists
    let publicToken: string | null = proposal.publicToken;
    if (!publicToken) {
      const updatedProposal = await storage.generatePublicToken(proposalId, userId);
      publicToken = updatedProposal?.publicToken ?? null;
    }

    // Build public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000';
    const proposalUrl = publicToken ? `${baseUrl}/p/${publicToken}` : undefined;

    // Calculate total price (average of range)
    const totalPrice = Math.round((proposal.priceLow + proposal.priceHigh) / 2);

    // Send the email
    const result = await sendProposalEmail({
      recipientEmail,
      recipientName: recipientName || proposal.clientName,
      proposalTitle: proposal.jobTypeName,
      clientName: proposal.clientName,
      totalPrice,
      senderName: user?.firstName || user?.lastName 
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() 
        : undefined,
      senderCompany: user?.companyName || undefined,
      customMessage: message,
      proposalUrl,
    });

    if (!result.success) {
      console.error('[API] Proposal email send failed:', {
        proposalId,
        recipientEmail,
        error: result.error,
      });
      return NextResponse.json(
        { 
          message: "Couldn't send email. Please try again.",
          publicUrl: proposalUrl 
        },
        { status: 500 }
      );
    }

    // Update proposal status to 'sent' if currently 'draft'
    if (proposal.status === 'draft') {
      await storage.updateProposal(proposalId, userId, { status: 'sent' });
    }

    // Similar Job Retrieval (Phase 1): update outcome status for linked mobile job (if any).
    // A proposal may or may not originate from a mobile job; this is best-effort.
    try {
      const draftRows = await db.select().from(mobileJobDrafts).where(eq(mobileJobDrafts.proposalId, proposalId)).limit(1);
      const jobId = draftRows[0]?.jobId;
      if (jobId) {
        await db.execute(
          sql`
            INSERT INTO job_outcomes (job_id, status, sent_at, updated_at)
            VALUES (${jobId}, 'sent', NOW(), NOW())
            ON CONFLICT (job_id)
            DO UPDATE SET status = 'sent', sent_at = COALESCE(job_outcomes.sent_at, NOW()), updated_at = NOW()
          `
        );
      }
    } catch (e) {
      console.warn("similarity.outcome.sent.failed", {
        proposalId,
        error: e instanceof Error ? e.message : String(e),
      });
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      publicUrl: proposalUrl 
    });
  } catch (error) {
    console.error('[API] Error in proposal email route:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { message: "Couldn't send email. Please try again." },
      { status: 500 }
    );
  }
}
