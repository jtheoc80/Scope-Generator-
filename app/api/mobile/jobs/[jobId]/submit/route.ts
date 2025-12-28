import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { insertProposalSchema } from "@shared/schema";
import { z } from "zod";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";
import { createHash } from "crypto";

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
      const origin =
        process.env.NEXT_PUBLIC_WEB_BASE_URL || new URL(request.url).origin;
      const webReviewUrl = new URL(`/proposals/${draft.proposalId}`, origin).toString();
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

    // Similar Job Retrieval (Phase 1): snapshot FINAL scope line items + initialize outcome row.
    // This creates the proprietary dataset flywheel for future recommendations.
    try {
      const scopeItems: string[] = Array.isArray(lineItem.scope) ? lineItem.scope : [];
      // Replace any previous snapshot for this job_id.
      await db.execute(sql`DELETE FROM scope_line_items WHERE job_id = ${job.id}`);

      if (scopeItems.length > 0) {
        const values = scopeItems
          .map((s) => (typeof s === "string" ? s.trim() : ""))
          .filter(Boolean)
          .slice(0, 300) // safety cap
          .map((desc) => {
            const itemCode = createHash("md5").update(desc.toLowerCase()).digest("hex");
            return { itemCode, desc };
          });

        for (const v of values) {
          await db.execute(
            sql`
              INSERT INTO scope_line_items (job_id, source, item_code, description, qty, unit, price, created_at)
              VALUES (${job.id}, 'final', ${v.itemCode}, ${v.desc}, 1, NULL, NULL, NOW())
            `
          );
        }
      }

      const finalPrice = (payload?.packages?.[selectedPkg]?.total ?? null) as number | null;
      await db.execute(
        sql`
          INSERT INTO job_outcomes (job_id, status, final_price, created_at, updated_at)
          VALUES (${job.id}, 'submitted', ${finalPrice}, NOW(), NOW())
          ON CONFLICT (job_id)
          DO UPDATE SET status = EXCLUDED.status, final_price = EXCLUDED.final_price, updated_at = NOW()
        `
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("similarity.snapshot.failed", { jobId: job.id, proposalId: proposal.id, error: msg });
    }

    const origin =
      process.env.NEXT_PUBLIC_WEB_BASE_URL || new URL(request.url).origin;
    const webReviewUrl = new URL(`/proposals/${proposal.id}`, origin).toString();

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
