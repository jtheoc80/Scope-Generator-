import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { createMobileJobRequestSchema } from "@/src/lib/mobile/types";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { proposalTemplates } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";

// POST /api/mobile/jobs
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const parsed = createMobileJobRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        requestId,
        400,
        "INVALID_INPUT",
        parsed.error.issues[0]?.message ?? "Invalid job payload"
      );
    }

    // Resolve jobType into an actual template so the client only needs one identifier.
    const jobType = parsed.data.jobType;
    const [template] =
      typeof jobType === "number"
        ? await db
            .select()
            .from(proposalTemplates)
            .where(and(eq(proposalTemplates.id, jobType), eq(proposalTemplates.isActive, true)))
            .limit(1)
        : await db
            .select()
            .from(proposalTemplates)
            .where(and(eq(proposalTemplates.jobTypeId, jobType), eq(proposalTemplates.isActive, true)))
            .limit(1);

    if (!template) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Unknown or inactive jobType");
    }

    const idem = request.headers.get("idempotency-key");
    const job = await storage.createMobileJob(authResult.userId, {
      clientName: parsed.data.customer ?? "Customer",
      address: parsed.data.address ?? "Address TBD",
      tradeId: template.tradeId,
      tradeName: template.tradeName,
      jobTypeId: template.jobTypeId,
      jobTypeName: template.jobTypeName,
      jobSize: 2,
      jobNotes: undefined,
      createIdempotencyKey: idem,
    });
    logEvent("mobile.jobs.create.ok", {
      requestId,
      jobId: job.id,
      ms: Date.now() - t0,
    });
    return withRequestId(requestId, { jobId: job.id }, 201);
  } catch (error) {
    console.error("Error creating mobile job:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to create job");
  }
}
