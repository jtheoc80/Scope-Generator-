import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/services/storage';
import { getRequestUserId } from '@/lib/services/requestUserId';
import { emailService } from '@/lib/services/emailService';
import { logger } from "@/lib/logger";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getRequestUserId(request);

        // Auth check
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const proposalId = parseInt(id);
        const body = await request.json();
        const { signature } = body;

        if (!signature || typeof signature !== 'string' || !signature.startsWith('data:image/')) {
            return NextResponse.json({ message: "Valid signature is required" }, { status: 400 });
        }

        if (signature.length < 1000) {
            return NextResponse.json({ message: "Please provide a valid signature" }, { status: 400 });
        }

        const proposal = await storage.getProposal(proposalId);
        if (!proposal) {
            return NextResponse.json({ message: "Proposal not found" }, { status: 404 });
        }

        if (proposal.userId !== userId) {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        if (proposal.status !== 'accepted') {
            return NextResponse.json({ message: "Proposal must be accepted by client before countersigning" }, { status: 400 });
        }

        if (proposal.contractorSignature) {
            return NextResponse.json({ message: "Proposal has already been countersigned" }, { status: 400 });
        }

        const countersignedProposal = await storage.countersignProposal(proposalId, userId, signature);
        if (!countersignedProposal) {
            return NextResponse.json({ message: "Failed to countersign proposal" }, { status: 500 });
        }

        // Send completed proposal email to client
        if (countersignedProposal.acceptedByEmail) {
            const user = await storage.getUser(userId);

            // Construct base URL from request headers
            const host = request.headers.get('host');
            const protocol = request.headers.get('x-forwarded-proto') || 'http';
            const baseUrl = `${protocol}://${host}`;
            const proposalUrl = countersignedProposal.publicToken ? `${baseUrl}/p/${countersignedProposal.publicToken}` : undefined;

            try {
                await emailService.sendCompletedProposalToClient({
                    clientEmail: countersignedProposal.acceptedByEmail,
                    clientName: countersignedProposal.clientName,
                    contractorName: user?.firstName || undefined,
                    contractorCompany: user?.companyName || undefined,
                    projectTitle: countersignedProposal.jobTypeName || 'Project',
                    projectAddress: countersignedProposal.address || undefined,
                    totalPrice: Math.round((countersignedProposal.priceLow + countersignedProposal.priceHigh) / 2),
                    acceptedAt: countersignedProposal.acceptedAt!,
                    contractorSignedAt: countersignedProposal.contractorSignedAt!,
                    proposalUrl,
                });
            } catch (emailError) {
                logger.error("Error sending completed proposal email", emailError as Error);
            }
        }

        return NextResponse.json({
            message: "Proposal countersigned successfully",
            contractorSignedAt: countersignedProposal.contractorSignedAt,
        });

    } catch (error) {
        logger.error("Error countersigning proposal", error as Error);
        return NextResponse.json({ message: "Failed to countersign proposal" }, { status: 500 });
    }
}
