import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { db } from "@/server/db";
import { savedAddresses } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for creating/updating an address
const createAddressSchema = z.object({
  formatted: z.string().min(1),
  street: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  placeId: z.string().max(255).optional(),
  lat: z.string().max(20).optional(),
  lng: z.string().max(20).optional(),
  customerId: z.number().optional(),
});

// GET /api/mobile/addresses - List addresses with optional search
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q");
    const customerId = searchParams.get("customerId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    let addresses;

    if (customerId) {
      // Filter by customer
      addresses = await db
        .select()
        .from(savedAddresses)
        .where(
          sql`${savedAddresses.userId} = ${authResult.userId} AND ${savedAddresses.customerId} = ${parseInt(customerId)}`
        )
        .orderBy(desc(savedAddresses.lastUsedAt))
        .limit(limit);
    } else if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      addresses = await db
        .select()
        .from(savedAddresses)
        .where(
          sql`${savedAddresses.userId} = ${authResult.userId} AND ${savedAddresses.formatted} ILIKE ${searchTerm}`
        )
        .orderBy(desc(savedAddresses.lastUsedAt))
        .limit(limit);
    } else {
      addresses = await db
        .select()
        .from(savedAddresses)
        .where(eq(savedAddresses.userId, authResult.userId))
        .orderBy(desc(savedAddresses.lastUsedAt))
        .limit(limit);
    }

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

// POST /api/mobile/addresses - Create a new address (or update existing by placeId)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const parsed = createAddressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    // Check if address with same placeId already exists (for deduplication)
    if (parsed.data.placeId) {
      const [existing] = await db
        .select()
        .from(savedAddresses)
        .where(
          sql`${savedAddresses.userId} = ${authResult.userId} AND ${savedAddresses.placeId} = ${parsed.data.placeId}`
        )
        .limit(1);

      if (existing) {
        // Update lastUsedAt and return existing
        const [updated] = await db
          .update(savedAddresses)
          .set({
            lastUsedAt: new Date(),
            customerId: parsed.data.customerId || existing.customerId,
          })
          .where(eq(savedAddresses.id, existing.id))
          .returning();

        return NextResponse.json({ address: updated, existed: true });
      }
    }

    // Check if exact formatted address already exists
    const [existingFormatted] = await db
      .select()
      .from(savedAddresses)
      .where(
        sql`${savedAddresses.userId} = ${authResult.userId} AND ${savedAddresses.formatted} = ${parsed.data.formatted}`
      )
      .limit(1);

    if (existingFormatted) {
      // Update lastUsedAt and return existing
      const [updated] = await db
        .update(savedAddresses)
        .set({
          lastUsedAt: new Date(),
          customerId: parsed.data.customerId || existingFormatted.customerId,
        })
        .where(eq(savedAddresses.id, existingFormatted.id))
        .returning();

      return NextResponse.json({ address: updated, existed: true });
    }

    // Create new address
    const [address] = await db
      .insert(savedAddresses)
      .values({
        userId: authResult.userId,
        formatted: parsed.data.formatted,
        street: parsed.data.street || null,
        city: parsed.data.city || null,
        state: parsed.data.state || null,
        zip: parsed.data.zip || null,
        placeId: parsed.data.placeId || null,
        lat: parsed.data.lat || null,
        lng: parsed.data.lng || null,
        customerId: parsed.data.customerId || null,
      })
      .returning();

    return NextResponse.json({ address, existed: false }, { status: 201 });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}

// PUT /api/mobile/addresses - Update address (touch lastUsedAt)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    const [address] = await db
      .update(savedAddresses)
      .set({
        ...updates,
        lastUsedAt: new Date(),
      })
      .where(
        sql`${savedAddresses.id} = ${id} AND ${savedAddresses.userId} = ${authResult.userId}`
      )
      .returning();

    if (!address) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}
