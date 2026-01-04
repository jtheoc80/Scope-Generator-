import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/services/storage";

/**
 * QA Proposal Creation - For E2E tests to create deterministic proposals.
 *
 * SECURITY: Only available with valid QA_TEST_SECRET and NOT in production.
 */
export async function POST(request: NextRequest) {
  // Guard: Never in production
  if (process.env.NODE_ENV === "production" && !process.env.QA_TEST_SECRET) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, clientName, address, secret } = body as {
      userId?: string;
      clientName?: string;
      address?: string;
      secret?: string;
    };

    const qaSecret = process.env.QA_TEST_SECRET;
    if (!qaSecret || secret !== qaSecret) {
      return NextResponse.json({ error: "Invalid QA secret" }, { status: 401 });
    }

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const proposal = await storage.createProposal({
      userId,
      clientName: clientName || "QA Client",
      address: address || "123 Test Street, Austin, TX 78701",
      tradeId: "bathroom",
      jobTypeId: "full-remodel",
      jobTypeName: "Full Remodel",
      jobSize: 2,
      scope: [
        "Demo existing finishes and dispose of debris",
        "Install new materials per selected scope",
        "Final cleanup and walkthrough",
      ],
      scopeSections: [],
      options: {},
      priceLow: 10000,
      priceHigh: 12000,
      status: "draft",
      isUnlocked: true,
      source: "desktop",
      photoCount: 0,
    });

    // Ensure we have a public token available (useful for public preview + PDF token flow)
    const withToken = await storage.generatePublicToken(proposal.id, userId);

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        publicToken: withToken?.publicToken ?? null,
      },
    });
  } catch (error) {
    console.error("[QA] create-proposal failed:", error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}

