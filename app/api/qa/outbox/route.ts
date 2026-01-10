import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { emailOutbox } from "@shared/schema";
import { and, desc, eq, type SQL } from "drizzle-orm";

/**
 * QA Email Outbox API - For E2E tests to verify deterministic email sending.
 *
 * SECURITY: Requires QA_TEST_SECRET and NOT intended for production use.
 */
export async function GET(request: NextRequest) {
  // Guard: Never in production unless explicitly configured for QA
  if (process.env.NODE_ENV === "production" && !process.env.QA_TEST_SECRET) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const qaSecret = process.env.QA_TEST_SECRET;
  const providedSecret = request.headers.get("x-qa-secret");
  if (!qaSecret || !providedSecret || providedSecret !== qaSecret) {
    return NextResponse.json({ error: "Invalid QA secret" }, { status: 401 });
  }

  if (process.env.EMAIL_MODE !== "test") {
    return NextResponse.json({ error: "EMAIL_MODE=test is required" }, { status: 400 });
  }

  const proposalIdRaw = request.nextUrl.searchParams.get("proposalId");
  const to = request.nextUrl.searchParams.get("to");

  const where = (() => {
    const clauses: SQL[] = [];
    if (proposalIdRaw) {
      const proposalId = Number(proposalIdRaw);
      if (!Number.isFinite(proposalId)) return null;
      clauses.push(eq(emailOutbox.proposalId, proposalId));
    }
    if (to) clauses.push(eq(emailOutbox.to, to));
    return clauses.length ? and(...clauses) : undefined;
  })();

  if (where === null) {
    return NextResponse.json({ error: "Invalid proposalId" }, { status: 400 });
  }

  try {
    const records = await db
      .select()
      .from(emailOutbox)
      .where(where)
      .orderBy(desc(emailOutbox.createdAt))
      .limit(50);

    return NextResponse.json({ success: true, count: records.length, records });
  } catch (error) {
    console.error("[QA] outbox fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch outbox" }, { status: 500 });
  }
}

