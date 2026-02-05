import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { db } from "@/lib/services/db";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";

export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum(["add", "remove", "edit"]),
  itemCode: z.string().min(1).max(200).optional(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
});

// POST /api/mobile/jobs/:jobId/scope-edits
export async function POST(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  try {
    // 1. Validate jobId param format FIRST (before auth)
    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");

    // 2. Check auth AFTER validating jobId format
    const authResult = await requireMobileAuth(request, requestId);
    if (!authResult.ok) return authResult.response;

    const job = await storage.getMobileJob(id, authResult.userId);
    if (!job) return jsonError(requestId, 404, "NOT_FOUND", "Job not found");

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return jsonError(requestId, 400, "INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    await db.execute(
      sql`
        INSERT INTO scope_edits (job_id, action, item_code, before_json, after_json, created_at)
        VALUES (
          ${id},
          ${parsed.data.action},
          ${parsed.data.itemCode ?? null},
          ${parsed.data.before ?? null}::jsonb,
          ${parsed.data.after ?? null}::jsonb,
          NOW()
        )
      `
    );

    logEvent("mobile.scopeEdits.insert.ok", { requestId, jobId: id, action: parsed.data.action, ms: Date.now() - t0 });
    return withRequestId(requestId, { ok: true }, 201);
  } catch (e) {
    console.error("Error logging scope edit:", e);
    return jsonError(requestId, 500, "INTERNAL", "Failed to log scope edit");
  }
}

