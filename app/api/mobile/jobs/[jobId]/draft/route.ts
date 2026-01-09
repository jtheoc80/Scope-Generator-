import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { mobileJobDrafts } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";
import { enqueueDraft, ensureDraftWorker } from "@/src/lib/mobile/draft/worker";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";

import type { RemedyType, Remedy } from "@/src/lib/mobile/remedy";

// Selected issue from client (with remedy support)
type SelectedIssue = {
  id: string;
  label: string;
  category: string;
  // Remedy fields (repair vs replace)
  issueType?: string;
  tags?: string[];
  remedies?: Remedy;
  selectedRemedy?: RemedyType;
};

// Scope selection from FindingsSummary screen
type ScopeSelection = {
  selectedTierId?: string;
  answers: Record<string, string | number | boolean | string[]>;
  measurements?: {
    squareFeet?: number;
    linearFeet?: number;
    roomCount?: number;
    wallCount?: number;
    ceilingHeight?: number;
  };
  problemStatement?: string;
};

// POST /api/mobile/jobs/:jobId/draft (trigger generation)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  try {
    // 1. Validate jobId param format FIRST (before auth)
    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");
    }

    // 2. Check auth AFTER validating jobId format
    const authResult = await requireMobileAuth(request, requestId);
    if (!authResult.ok) return authResult.response;

    const job = await storage.getMobileJob(id, authResult.userId);
    if (!job) {
      return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
    }

    // Parse body for selected issues context and scope selection
    let selectedIssues: SelectedIssue[] | undefined;
    let problemStatement: string | undefined;
    let scopeSelection: ScopeSelection | undefined;
    try {
      const body = await request.json();
      if (body.selectedIssues && Array.isArray(body.selectedIssues)) {
        selectedIssues = body.selectedIssues;
      }
      if (body.problemStatement && typeof body.problemStatement === "string") {
        problemStatement = body.problemStatement;
      }
      // Parse scope selection from findings flow
      if (body.scopeSelection && typeof body.scopeSelection === "object") {
        scopeSelection = body.scopeSelection as ScopeSelection;
        // Use problemStatement from scopeSelection if not provided directly
        if (!problemStatement && scopeSelection.problemStatement) {
          problemStatement = scopeSelection.problemStatement;
        }
      }
      // Use selectedTierId from body if provided
      if (body.selectedTierId && typeof body.selectedTierId === "string") {
        scopeSelection = scopeSelection || { answers: {} };
        scopeSelection.selectedTierId = body.selectedTierId;
      }
    } catch {
      // Body parsing failed, continue without context
    }

    // Enqueue and return immediately
    const idem = request.headers.get("idempotency-key") || undefined;
    await enqueueDraft({ 
      jobId: job.id, 
      userId: authResult.userId, 
      draftIdempotencyKey: idem,
      selectedIssues,
      problemStatement,
      scopeSelection,
    });
    ensureDraftWorker();

    logEvent("mobile.draft.enqueue.ok", { 
      requestId, 
      jobId: job.id, 
      issuesCount: selectedIssues?.length ?? 0,
      hasScopeSelection: !!scopeSelection,
      selectedTier: scopeSelection?.selectedTierId,
      ms: Date.now() - t0 
    });
    return withRequestId(requestId, { status: "DRAFTING" });
  } catch (error) {
    console.error("Error generating mobile draft:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to enqueue draft");
  }
}

// GET /api/mobile/jobs/:jobId/draft (poll until ready)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  try {
    // 1. Validate jobId param format FIRST (before auth)
    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");
    }

    // 2. Check auth AFTER validating jobId format
    const authResult = await requireMobileAuth(request, requestId);
    if (!authResult.ok) return authResult.response;

    const job = await storage.getMobileJob(id, authResult.userId);
    if (!job) {
      return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
    }

    // Ensure worker is running (best-effort)
    ensureDraftWorker();

    const [draft] = await db
      .select()
      .from(mobileJobDrafts)
      .where(and(eq(mobileJobDrafts.jobId, job.id)))
      .orderBy(desc(mobileJobDrafts.createdAt))
      .limit(1);

    if (!draft) return NextResponse.json({ status: "DRAFTING" });

    if (draft.status === "ready" && draft.payload) {
      return withRequestId(requestId, { status: "READY", payload: draft.payload });
    }

    if (draft.status === "failed") {
      return jsonError(requestId, 500, "INTERNAL", "Draft failed", {
        status: "FAILED",
        detail: draft.error ?? "Draft failed",
      });
    }

    logEvent("mobile.draft.poll", { requestId, jobId: job.id, status: draft.status });
    return withRequestId(requestId, { status: "DRAFTING" });
  } catch (error) {
    console.error("Error fetching mobile draft:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to fetch draft");
  }
}
