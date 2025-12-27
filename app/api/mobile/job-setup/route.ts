import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { db } from "@/server/db";
import { jobSetupPreferences, savedCustomers, savedAddresses } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for updating job setup preferences
const updatePreferencesSchema = z.object({
  lastJobType: z.string().max(50).optional(),
  lastCustomerId: z.number().optional().nullable(),
  lastAddressId: z.number().optional().nullable(),
  recentJobTypes: z.array(z.string()).max(10).optional(),
});

// GET /api/mobile/job-setup - Get job setup preferences with resolved customer/address
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    // Get preferences
    const [prefs] = await db
      .select()
      .from(jobSetupPreferences)
      .where(eq(jobSetupPreferences.userId, authResult.userId))
      .limit(1);

    if (!prefs) {
      // Return empty defaults
      return NextResponse.json({
        preferences: null,
        lastCustomer: null,
        lastAddress: null,
      });
    }

    // Resolve last customer and address if set
    let lastCustomer = null;
    let lastAddress = null;

    if (prefs.lastCustomerId) {
      const [customer] = await db
        .select()
        .from(savedCustomers)
        .where(eq(savedCustomers.id, prefs.lastCustomerId))
        .limit(1);
      lastCustomer = customer || null;
    }

    if (prefs.lastAddressId) {
      const [address] = await db
        .select()
        .from(savedAddresses)
        .where(eq(savedAddresses.id, prefs.lastAddressId))
        .limit(1);
      lastAddress = address || null;
    }

    return NextResponse.json({
      preferences: prefs,
      lastCustomer,
      lastAddress,
    });
  } catch (error) {
    console.error("Error fetching job setup preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PUT /api/mobile/job-setup - Update job setup preferences
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const parsed = updatePreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    // Upsert preferences
    const [existing] = await db
      .select()
      .from(jobSetupPreferences)
      .where(eq(jobSetupPreferences.userId, authResult.userId))
      .limit(1);

    let preferences;

    if (existing) {
      // Update existing
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      
      if (parsed.data.lastJobType !== undefined) {
        updates.lastJobType = parsed.data.lastJobType;
      }
      if (parsed.data.lastCustomerId !== undefined) {
        updates.lastCustomerId = parsed.data.lastCustomerId;
      }
      if (parsed.data.lastAddressId !== undefined) {
        updates.lastAddressId = parsed.data.lastAddressId;
      }
      if (parsed.data.recentJobTypes !== undefined) {
        updates.recentJobTypes = parsed.data.recentJobTypes;
      }

      [preferences] = await db
        .update(jobSetupPreferences)
        .set(updates)
        .where(eq(jobSetupPreferences.userId, authResult.userId))
        .returning();
    } else {
      // Create new
      [preferences] = await db
        .insert(jobSetupPreferences)
        .values({
          userId: authResult.userId,
          lastJobType: parsed.data.lastJobType || null,
          lastCustomerId: parsed.data.lastCustomerId || null,
          lastAddressId: parsed.data.lastAddressId || null,
          recentJobTypes: parsed.data.recentJobTypes || [],
        })
        .returning();
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error updating job setup preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

// POST /api/mobile/job-setup/add-recent-job-type - Add a job type to recent list
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const { jobType } = body;

    if (!jobType || typeof jobType !== "string") {
      return NextResponse.json(
        { error: "Job type is required" },
        { status: 400 }
      );
    }

    // Get current preferences
    const [existing] = await db
      .select()
      .from(jobSetupPreferences)
      .where(eq(jobSetupPreferences.userId, authResult.userId))
      .limit(1);

    let recentJobTypes = existing?.recentJobTypes || [];
    
    // Remove if already exists (to move to front)
    recentJobTypes = recentJobTypes.filter((t) => t !== jobType);
    
    // Add to front
    recentJobTypes.unshift(jobType);
    
    // Keep only last 10
    recentJobTypes = recentJobTypes.slice(0, 10);

    let preferences;

    if (existing) {
      [preferences] = await db
        .update(jobSetupPreferences)
        .set({
          lastJobType: jobType,
          recentJobTypes,
          updatedAt: new Date(),
        })
        .where(eq(jobSetupPreferences.userId, authResult.userId))
        .returning();
    } else {
      [preferences] = await db
        .insert(jobSetupPreferences)
        .values({
          userId: authResult.userId,
          lastJobType: jobType,
          recentJobTypes,
        })
        .returning();
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error adding recent job type:", error);
    return NextResponse.json(
      { error: "Failed to add recent job type" },
      { status: 500 }
    );
  }
}
