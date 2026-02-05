import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/services/db";
import { photoUploadSessions, mobileJobs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

// IMPORTANT: Use Node.js runtime for crypto operations.
export const runtime = "nodejs";

// Session expiration time in minutes
const SESSION_EXPIRY_MINUTES = 20;

/**
 * Hash a token using SHA-256
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a secure random token (32 bytes = 64 hex chars)
 */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * POST /api/photo-sessions
 * Creates a new photo upload session for QR code-based phone uploads.
 * 
 * Request body:
 * - jobId: number (required) - The mobile job ID
 * 
 * Returns:
 * - sessionId: string - UUID of the session
 * - sessionUrl: string - Full URL for phone to scan/open
 * - expiresAt: string - ISO timestamp of expiration
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user via Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { jobId } = body;

    if (!jobId || typeof jobId !== "number") {
      return NextResponse.json(
        { error: { message: "jobId is required and must be a number" } },
        { status: 400 }
      );
    }

    // Verify the job belongs to this user
    const [job] = await db
      .select()
      .from(mobileJobs)
      .where(and(eq(mobileJobs.id, jobId), eq(mobileJobs.userId, userId)));

    if (!job) {
      return NextResponse.json(
        { error: { message: "Job not found or access denied" } },
        { status: 404 }
      );
    }

    // Generate session ID and token
    const sessionId = crypto.randomUUID();
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + SESSION_EXPIRY_MINUTES);

    // Insert session into database
    await db.insert(photoUploadSessions).values({
      id: sessionId,
      jobId,
      userId,
      tokenHash,
      expiresAt,
    });

    // Build session URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const sessionUrl = `${baseUrl}/m/upload/${sessionId}?token=${rawToken}`;

    return NextResponse.json({
      sessionId,
      sessionUrl,
      expiresAt: expiresAt.toISOString(),
      expiresInMinutes: SESSION_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error("Error creating photo upload session:", error);
    return NextResponse.json(
      { error: { message: "Failed to create photo upload session" } },
      { status: 500 }
    );
  }
}
