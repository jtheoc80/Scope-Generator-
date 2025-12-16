import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { insertProposalSchema } from "@shared/schema";

// POST /api/mobile/jobs/:jobId/submit (convert latest draft to proposal)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "Invalid jobId" }, { status: 400 });
    }

    const job = await storage.getMobileJob(id, authResult.userId);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const draft = await storage.getLatestMobileJobDraft(id, authResult.userId);
    if (!draft || draft.status !== "ready" || !draft.payload) {
      return NextResponse.json(
        { message: "No ready draft found" },
        { status: 400 }
      );
    }

    const payload = draft.payload as any;
    const lineItem = payload?.lineItems?.[0];
    if (!lineItem) {
      return NextResponse.json(
        { message: "Draft payload is missing line items" },
        { status: 400 }
      );
    }

    const validation = insertProposalSchema.safeParse({
      userId: authResult.userId,
      clientName: job.clientName,
      address: job.address,
      tradeId: job.tradeId,
      jobTypeId: job.jobTypeId,
      jobTypeName: job.jobTypeName,
      jobSize: job.jobSize,
      scope: Array.isArray(lineItem.scope) ? lineItem.scope : [],
      options: lineItem.options ?? {},
      priceLow: lineItem.priceLow,
      priceHigh: lineItem.priceHigh,
      lineItems: Array.isArray(payload.lineItems) ? payload.lineItems : undefined,
      isMultiService: false,
      estimatedDaysLow: lineItem.estimatedDaysLow,
      estimatedDaysHigh: lineItem.estimatedDaysHigh,
    });

    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0]?.message ?? "Invalid draft-to-proposal payload" },
        { status: 400 }
      );
    }

    const proposal = await storage.createProposal(validation.data);
    await storage.linkDraftToProposal(draft.id, authResult.userId, proposal.id);

    const origin = new URL(request.url).origin;
    const webReviewUrl = new URL(`/proposals/${proposal.id}`, origin).toString();

    return NextResponse.json({
      proposalId: proposal.id,
      webReviewUrl,
    });
  } catch (error) {
    console.error("Error submitting mobile job:", error);
    return NextResponse.json(
      { message: "Failed to submit job" },
      { status: 500 }
    );
  }
}
