import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { createMobileJobRequestSchema } from "@/src/lib/mobile/types";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { proposalTemplates } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// POST /api/mobile/jobs
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const parsed = createMobileJobRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid job payload" },
        { status: 400 }
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
      return NextResponse.json(
        { message: "Unknown or inactive jobType" },
        { status: 400 }
      );
    }

    const job = await storage.createMobileJob(authResult.userId, {
      clientName: parsed.data.customer ?? "Customer",
      address: parsed.data.address ?? "Address TBD",
      tradeId: template.tradeId,
      tradeName: template.tradeName,
      jobTypeId: template.jobTypeId,
      jobTypeName: template.jobTypeName,
      jobSize: 2,
      jobNotes: undefined,
    });
    return NextResponse.json({ jobId: job.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating mobile job:", error);
    return NextResponse.json(
      { message: "Failed to create job" },
      { status: 500 }
    );
  }
}
