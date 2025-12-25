import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { insertProposalSchema } from "@shared/schema";
import { z } from "zod";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";

const submitBodySchema = z.object({
  package: z.enum(["GOOD", "BETTER", "BEST"]).optional(),
});

// POST /api/mobile/jobs/:jobId/submit (convert latest draft to proposal)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");
    }

    const job = await storage.getMobileJob(id, authResult.userId);
    if (!job) {
      return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
    }

    const draft = await storage.getLatestMobileJobDraft(id, authResult.userId);
    if (!draft || draft.status !== "ready" || !draft.payload) {
      return jsonError(requestId, 400, "FAILED_PRECONDITION", "No ready draft found");
    }

    if (draft.proposalId) {
      // Get the existing proposal to retrieve its public token
      const existingProposal = await storage.getProposal(draft.proposalId);
      const origin =
        process.env.NEXT_PUBLIC_WEB_BASE_URL || new URL(request.url).origin;
      
      // Use public token if available, otherwise fall back to generating one
      let publicToken = existingProposal?.publicToken;
      if (!publicToken) {
        const updatedProposal = await storage.generatePublicToken(draft.proposalId, authResult.userId);
        publicToken = updatedProposal?.publicToken;
      }
      
      const webReviewUrl = publicToken 
        ? new URL(`/p/${publicToken}`, origin).toString()
        : new URL(`/app`, origin).toString(); // Fallback to app if token generation fails
      
      return withRequestId(requestId, { proposalId: draft.proposalId, webReviewUrl });
    }

    const bodyJson = await request.json().catch(() => ({}));
    const body = submitBodySchema.safeParse(bodyJson);
    if (!body.success) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid submit payload");
    }

    const payload = draft.payload as any;
    const selectedPkg = body.data.package || payload?.defaultPackage || "BETTER";
    const pkg = payload?.packages?.[selectedPkg];
    const lineItem = pkg?.lineItems?.[0];
    if (!lineItem) {
      return jsonError(requestId, 400, "FAILED_PRECONDITION", "Draft payload is missing line items");
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
      options: {
        ...(lineItem.options ?? {}),
        __mobile: {
          package: selectedPkg,
          pricebookVersion: payload?.pricing?.pricebookVersion,
        },
      },
      priceLow: lineItem.priceLow,
      priceHigh: lineItem.priceHigh,
      lineItems: Array.isArray(pkg?.lineItems) ? pkg.lineItems : undefined,
      isMultiService: false,
      estimatedDaysLow: lineItem.estimatedDaysLow,
      estimatedDaysHigh: lineItem.estimatedDaysHigh,
    });

    if (!validation.success) {
      return jsonError(
        requestId,
        400,
        "INVALID_INPUT",
        validation.error.issues[0]?.message ?? "Invalid draft-to-proposal payload"
      );
    }

    const proposal = await storage.createProposal(validation.data);
    await storage.linkDraftToProposal(draft.id, authResult.userId, proposal.id);

    // Generate a public token for the proposal so it can be viewed via /p/[token]
    const proposalWithToken = await storage.generatePublicToken(proposal.id, authResult.userId);
    const publicToken = proposalWithToken?.publicToken;

    const origin =
      process.env.NEXT_PUBLIC_WEB_BASE_URL || new URL(request.url).origin;
    const webReviewUrl = publicToken 
      ? new URL(`/p/${publicToken}`, origin).toString()
      : new URL(`/app`, origin).toString(); // Fallback to app if token generation fails

    logEvent("mobile.submit.ok", {
      requestId,
      jobId: job.id,
      proposalId: proposal.id,
      ms: Date.now() - t0,
    });

    return withRequestId(requestId, {
      proposalId: proposal.id,
      webReviewUrl,
    });
  } catch (error) {
    console.error("Error submitting mobile job:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to submit job");
  }
}
