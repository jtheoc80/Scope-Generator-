import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { z } from "zod";

// Schema for updating job client details (Draft-first flow)
const updateJobSchema = z.object({
  clientName: z.string().min(2).max(100).optional(),
  address: z.string().min(5).max(500).optional(),
});

// GET /api/mobile/jobs/:jobId - Get job details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { jobId } = await params;
    const jobIdNum = parseInt(jobId, 10);
    
    if (isNaN(jobIdNum)) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid job ID");
    }

    const job = await storage.getMobileJob(jobIdNum, authResult.userId);
    
    if (!job) {
      return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
    }

    logEvent("mobile.jobs.get.ok", {
      requestId,
      jobId: jobIdNum,
      ms: Date.now() - t0,
    });

    return withRequestId(requestId, {
      id: job.id,
      clientName: job.clientName,
      address: job.address,
      tradeId: job.tradeId,
      tradeName: job.tradeName,
      jobTypeId: job.jobTypeId,
      jobTypeName: job.jobTypeName,
      jobSize: job.jobSize,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching mobile job:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(requestId, 500, "INTERNAL", `Failed to fetch job: ${message}`);
  }
}

// PATCH /api/mobile/jobs/:jobId - Update job client details (Draft-first flow)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { jobId } = await params;
    const jobIdNum = parseInt(jobId, 10);
    
    if (isNaN(jobIdNum)) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid job ID");
    }

    const body = await request.json();
    const parsed = updateJobSchema.safeParse(body);
    
    if (!parsed.success) {
      return jsonError(
        requestId,
        400,
        "INVALID_INPUT",
        parsed.error.issues[0]?.message ?? "Invalid update payload"
      );
    }

    // At least one field must be provided
    if (!parsed.data.clientName && !parsed.data.address) {
      return jsonError(
        requestId,
        400,
        "INVALID_INPUT",
        "At least one of clientName or address must be provided"
      );
    }

    const updatedJob = await storage.updateMobileJob(jobIdNum, authResult.userId, {
      clientName: parsed.data.clientName,
      address: parsed.data.address,
    });

    if (!updatedJob) {
      return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
    }

    logEvent("mobile.jobs.update.ok", {
      requestId,
      jobId: jobIdNum,
      ms: Date.now() - t0,
    });

    return withRequestId(requestId, {
      id: updatedJob.id,
      clientName: updatedJob.clientName,
      address: updatedJob.address,
      status: updatedJob.status,
    });
  } catch (error) {
    console.error("Error updating mobile job:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(requestId, 500, "INTERNAL", `Failed to update job: ${message}`);
  }
}
