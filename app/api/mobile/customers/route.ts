import { NextRequest, NextResponse } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { db } from "@/server/db";
import { savedCustomers } from "@shared/schema";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for creating/updating a customer
const createCustomerSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  notes: z.string().optional(),
});

// GET /api/mobile/customers - List customers with optional search
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    let customers;
    
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      customers = await db
        .select()
        .from(savedCustomers)
        .where(
          sql`${savedCustomers.userId} = ${authResult.userId} AND (
            ${savedCustomers.name} ILIKE ${searchTerm} OR 
            ${savedCustomers.phone} ILIKE ${searchTerm} OR 
            ${savedCustomers.email} ILIKE ${searchTerm}
          )`
        )
        .orderBy(desc(savedCustomers.lastUsedAt))
        .limit(limit);
    } else {
      customers = await db
        .select()
        .from(savedCustomers)
        .where(eq(savedCustomers.userId, authResult.userId))
        .orderBy(desc(savedCustomers.lastUsedAt))
        .limit(limit);
    }

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST /api/mobile/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const parsed = createCustomerSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const [customer] = await db
      .insert(savedCustomers)
      .values({
        userId: authResult.userId,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        notes: parsed.data.notes || null,
      })
      .returning();

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

// PUT /api/mobile/customers - Update customer (touch lastUsedAt)
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Update lastUsedAt and any other fields
    const [customer] = await db
      .update(savedCustomers)
      .set({
        ...updates,
        lastUsedAt: new Date(),
      })
      .where(
        sql`${savedCustomers.id} = ${id} AND ${savedCustomers.userId} = ${authResult.userId}`
      )
      .returning();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}
