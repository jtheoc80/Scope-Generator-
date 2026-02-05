import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/services/db";
import { photoUploadSessions, mobileJobs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";

// IMPORTANT: Use Node.js runtime for crypto operations.
export const runtime = "nodejs";

/**
 * Hash a token using SHA-256
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * GET /api/photo-sessions/[sessionId]?token=xxx
 * Validates a photo upload session token.
 * 
 * Query params:
 * - token: string (required) - The raw token to validate
 * 
 * Returns:
 * - valid: boolean
 * - jobId: number (if valid)
 * - jobInfo: { clientName, address, tradeName, jobTypeName } (if valid)
 * - expiresAt: string (if valid)
 * - error: string (if invalid)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Look up session
    const [session] = await db
      .select()
      .from(photoUploadSessions)
      .where(eq(photoUploadSessions.id, sessionId));

    if (!session) {
      return NextResponse.json(
        { valid: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // Verify token hash
    const tokenHash = hashToken(token);
    if (tokenHash !== session.tokenHash) {
      return NextResponse.json(
        { valid: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      return NextResponse.json(
        { valid: false, error: "Session expired. Please generate a new QR code from your desktop." },
        { status: 410 }
      );
    }

    // Get job info for display on mobile
    const [job] = await db
      .select()
      .from(mobileJobs)
      .where(eq(mobileJobs.id, session.jobId));

    if (!job) {
      return NextResponse.json(
        { valid: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Calculate time remaining
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));

    return NextResponse.json({
      valid: true,
      jobId: session.jobId,
      jobInfo: {
        clientName: job.clientName,
        address: job.address,
        tradeName: job.tradeName,
        jobTypeName: job.jobTypeName,
      },
      expiresAt: session.expiresAt.toISOString(),
      remainingMinutes,
    });
  } catch (error) {
    console.error("Error validating photo upload session:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate session" },
      { status: 500 }
    );
  }
}
