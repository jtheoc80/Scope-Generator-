import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { proposalTemplates, users } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { generateMobileDraft } from "@/src/lib/mobile/draft/pipeline";

// POST /api/mobile/jobs/:jobId/draft (trigger generation)
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

    const photos = await storage.listMobileJobPhotos(id, authResult.userId);
    if (!photos.length) {
      return NextResponse.json(
        { message: "At least one photo is required" },
        { status: 400 }
      );
    }

    const [template] = await db
      .select()
      .from(proposalTemplates)
      .where(
        and(
          eq(proposalTemplates.tradeId, job.tradeId),
          eq(proposalTemplates.jobTypeId, job.jobTypeId),
          eq(proposalTemplates.isActive, true)
        )
      )
      .limit(1);

    if (!template) {
      return NextResponse.json(
        { message: "No active template found for this job type" },
        { status: 400 }
      );
    }

    const [user] = await db.select().from(users).where(eq(users.id, authResult.userId));
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Create a "processing" draft record first
    const processing = await storage.createMobileJobDraft(id, authResult.userId, {
      status: "processing",
    });

    try {
      const draft = await generateMobileDraft({
        job: {
          id: job.id,
          clientName: job.clientName,
          address: job.address,
          tradeId: job.tradeId,
          tradeName: job.tradeName,
          jobTypeId: job.jobTypeId,
          jobTypeName: job.jobTypeName,
          jobSize: job.jobSize,
          jobNotes: job.jobNotes,
        },
        template,
        user,
        photos: photos.map((p) => ({
          publicUrl: p.publicUrl,
          kind: p.kind,
        })),
      });

      const ready = await storage.createMobileJobDraft(id, authResult.userId, {
        status: "ready",
        payload: draft,
        confidence: draft.confidence,
        questions: draft.questions,
      });

      return NextResponse.json({
        draftId: ready.id,
        status: ready.status,
        payload: ready.payload,
      });
    } catch (inner) {
      console.error("Draft generation failed:", inner);
      await storage.createMobileJobDraft(id, authResult.userId, {
        status: "failed",
        error: inner instanceof Error ? inner.message : "Draft generation failed",
      });

      return NextResponse.json(
        { message: "Draft generation failed" },
        { status: 500 }
      );
    } finally {
      // no-op: keep the processing record for traceability
      void processing;
    }
  } catch (error) {
    console.error("Error generating mobile draft:", error);
    return NextResponse.json(
      { message: "Failed to generate draft" },
      { status: 500 }
    );
  }
}
