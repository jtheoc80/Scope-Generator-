import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { insertProposalSchema } from "@shared/schema";
import { z } from "zod";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";
import { createHash } from "crypto";

// Log DB connection info on module load (masked for security)
const logDbInfo = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("[mobile/submit] DATABASE_URL not set!");
    return;
  }
  try {
    const parsed = new URL(dbUrl);
    const hostParts = parsed.host.split(".");
    const projectRef = hostParts.length >= 3 && parsed.host.includes("supabase") 
      ? hostParts[1] 
      : null;
    console.log(`[mobile/submit] DB: ${parsed.host}, project: ${projectRef || "N/A"}`);
  } catch {
    console.log("[mobile/submit] DB URL configured (parsing failed)");
  }
};
logDbInfo();

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

    // Ensure scopeSections is always an array (never undefined) to avoid NOT NULL constraint violations
    const scopeSectionsData = Array.isArray(lineItem.scopeSections) ? lineItem.scopeSections : [];
    
    const validation = insertProposalSchema.safeParse({
      userId: authResult.userId,
      clientName: job.clientName,
      address: job.address,
      tradeId: job.tradeId,
      jobTypeId: job.jobTypeId,
      jobTypeName: job.jobTypeName,
      jobSize: job.jobSize,
      scope: Array.isArray(lineItem.scope) ? lineItem.scope : [],
      // Always provide scopeSections (default to empty array) to satisfy NOT NULL constraint
      scopeSections: scopeSectionsData,
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
      source: 'mobile', // Track proposal origin for analytics
    });
    
    // Log keys being inserted for debugging schema drift
    if (validation.success) {
      const keys = Object.keys(validation.data).filter(k => validation.data[k as keyof typeof validation.data] !== undefined);
      logEvent("mobile.submit.proposal_keys", { requestId, keys: keys.join(",") });
    }

    if (!validation.success) {
      return jsonError(
        requestId,
        400,
        "INVALID_INPUT",
        validation.error.issues[0]?.message ?? "Invalid draft-to-proposal payload"
      );
    }

    // Create proposal in database
    // Note: Schema drift between code and DB can cause failures here (e.g., missing columns).
    // Always ensure migrations are applied before deploying code changes.
    let proposal;
    try {
      proposal = await storage.createProposal(validation.data);
    } catch (dbError) {
      // Log detailed error for debugging schema drift or other DB issues
      const errMsg = dbError instanceof Error ? dbError.message : String(dbError);
      logEvent("mobile.submit.proposal_create_failed", {
        requestId,
        jobId: job.id,
        draftId: draft.id,
        error: errMsg,
        ms: Date.now() - t0,
      });
      console.error("Proposal creation failed:", { requestId, jobId: job.id, error: dbError });
      return jsonError(requestId, 500, "INTERNAL", "Failed to create proposal");
    }

    // Guard: Ensure proposal was actually created (defensive check)
    if (!proposal || !proposal.id) {
      logEvent("mobile.submit.proposal_create_empty", {
        requestId,
        jobId: job.id,
        draftId: draft.id,
        ms: Date.now() - t0,
      });
      console.error("Proposal creation returned empty result:", { requestId, jobId: job.id });
      return jsonError(requestId, 500, "INTERNAL", "Failed to create proposal - empty result");
    }

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
    // Catch-all for unexpected errors (auth failures, network issues, etc.)
    // This ensures we NEVER return 200 when an error occurs.
    const errMsg = error instanceof Error ? error.message : String(error);
    logEvent("mobile.submit.unexpected_error", {
      requestId,
      error: errMsg,
      ms: Date.now() - t0,
    });
    console.error("Error submitting mobile job:", { requestId, error });
    return jsonError(requestId, 500, "INTERNAL", "Failed to submit job");
  }
}
