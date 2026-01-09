import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { createMobileJobRequestSchema } from "@/src/lib/mobile/types";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { proposalTemplates } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { ensureActiveTemplates, getDefaultTemplateForJobType } from "@/lib/services/template-seeder";

// POST /api/mobile/jobs
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  try {
    const authResult = await requireMobileAuth(request, requestId);
    if (!authResult.ok) return authResult.response;

    // Ensure user exists before proceeding (fixes foreign key issues with new users)
    const existingUser = await storage.getUser(authResult.userId);
    if (!existingUser) {
      console.log(`User ${authResult.userId} not found, auto-creating...`);
      try {
        await storage.upsertUser({
          id: authResult.userId,
          email: `mobile_${authResult.userId.substring(0, 8)}@example.com`,
          firstName: "Mobile",
          lastName: "User",
          isPro: true, 
          proposalCredits: 10,
        });
      } catch (err) {
        console.error("Failed to auto-create user:", err);
      }
    }

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
    let [template] =
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

    // If template not found and jobType is a string, try to auto-seed templates
    if (!template && typeof jobType === "string") {
      console.log(`[mobile.jobs] Template not found for jobType: ${jobType}, attempting to seed...`);
      await ensureActiveTemplates();
      
      // Try again after seeding
      [template] = await db
        .select()
        .from(proposalTemplates)
        .where(and(eq(proposalTemplates.jobTypeId, jobType), eq(proposalTemplates.isActive, true)))
        .limit(1);
      
      // If still not found, use fallback default template data
      if (!template) {
        const defaultTemplate = getDefaultTemplateForJobType(jobType);
        if (defaultTemplate) {
          console.log(`[mobile.jobs] Using fallback template data for: ${jobType}`);
          template = defaultTemplate as typeof template;
        }
      }
    }

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
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(requestId, 500, "INTERNAL", `Failed to create job: ${message}`);
  }
}
