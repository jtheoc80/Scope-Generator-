import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { createMobileJobRequestSchema } from "@/src/lib/mobile/types";
import { storage } from "@/lib/services/storage";

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

    const job = await storage.createMobileJob(authResult.userId, parsed.data);
    return NextResponse.json({ jobId: job.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating mobile job:", error);
    return NextResponse.json(
      { message: "Failed to create job" },
      { status: 500 }
    );
  }
}
