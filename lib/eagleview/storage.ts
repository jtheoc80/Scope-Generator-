/**
 * EagleView Storage Service
 * 
 * Database operations for EagleView roof measurement orders.
 * Server-side only - uses Drizzle ORM.
 */

import { db } from "../../server/db";
import { eagleviewRoofOrders, type RoofingMeasurements } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Internal status type (matches the client EagleViewOrderStatus)
type OrderStatus = 'created' | 'queued' | 'processing' | 'completed' | 'failed';

export interface CreateEagleViewOrderParams {
  id: string;
  jobId: string;
  userId: string;
  address: string;
  status: OrderStatus;
  eagleviewOrderId?: string;
}

export interface UpdateEagleViewOrderParams {
  status?: OrderStatus;
  eagleviewOrderId?: string;
  eagleviewReportId?: string;
  reportUrl?: string;
  payloadJson?: Record<string, unknown>;
  roofingMeasurements?: RoofingMeasurements;
  errorMessage?: string;
}

/**
 * Create a new EagleView roof order record
 */
export async function createEagleViewOrder(params: CreateEagleViewOrderParams) {
  const [order] = await db
    .insert(eagleviewRoofOrders)
    .values({
      id: params.id,
      jobId: params.jobId,
      userId: params.userId,
      address: params.address,
      status: params.status,
      eagleviewOrderId: params.eagleviewOrderId || null,
    })
    .returning();
  return order;
}

/**
 * Get EagleView order by job ID
 */
export async function getEagleViewOrderByJobId(jobId: string, userId: string) {
  const [order] = await db
    .select()
    .from(eagleviewRoofOrders)
    .where(
      and(
        eq(eagleviewRoofOrders.jobId, jobId),
        eq(eagleviewRoofOrders.userId, userId)
      )
    )
    .orderBy(desc(eagleviewRoofOrders.createdAt))
    .limit(1);
  return order;
}

/**
 * Get EagleView order by EagleView order ID (for webhook processing)
 */
export async function getEagleViewOrderByEvOrderId(eagleviewOrderId: string) {
  const [order] = await db
    .select()
    .from(eagleviewRoofOrders)
    .where(eq(eagleviewRoofOrders.eagleviewOrderId, eagleviewOrderId));
  return order;
}

/**
 * Get EagleView order by internal ID
 */
export async function getEagleViewOrderById(id: string) {
  const [order] = await db
    .select()
    .from(eagleviewRoofOrders)
    .where(eq(eagleviewRoofOrders.id, id));
  return order;
}

/**
 * Update EagleView order
 */
export async function updateEagleViewOrder(
  id: string,
  updates: UpdateEagleViewOrderParams
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }
  if (updates.eagleviewOrderId !== undefined) {
    updateData.eagleviewOrderId = updates.eagleviewOrderId;
  }
  if (updates.eagleviewReportId !== undefined) {
    updateData.eagleviewReportId = updates.eagleviewReportId;
  }
  if (updates.reportUrl !== undefined) {
    updateData.reportUrl = updates.reportUrl;
  }
  if (updates.payloadJson !== undefined) {
    updateData.payloadJson = updates.payloadJson;
  }
  if (updates.roofingMeasurements !== undefined) {
    updateData.roofingMeasurements = updates.roofingMeasurements;
  }
  if (updates.errorMessage !== undefined) {
    updateData.errorMessage = updates.errorMessage;
  }

  const [order] = await db
    .update(eagleviewRoofOrders)
    .set(updateData)
    .where(eq(eagleviewRoofOrders.id, id))
    .returning();
  return order;
}

/**
 * Update EagleView order by EagleView order ID (for webhook processing)
 */
export async function updateEagleViewOrderByEvOrderId(
  eagleviewOrderId: string,
  updates: UpdateEagleViewOrderParams
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }
  if (updates.eagleviewReportId !== undefined) {
    updateData.eagleviewReportId = updates.eagleviewReportId;
  }
  if (updates.reportUrl !== undefined) {
    updateData.reportUrl = updates.reportUrl;
  }
  if (updates.payloadJson !== undefined) {
    updateData.payloadJson = updates.payloadJson;
  }
  if (updates.roofingMeasurements !== undefined) {
    updateData.roofingMeasurements = updates.roofingMeasurements;
  }
  if (updates.errorMessage !== undefined) {
    updateData.errorMessage = updates.errorMessage;
  }

  const [order] = await db
    .update(eagleviewRoofOrders)
    .set(updateData)
    .where(eq(eagleviewRoofOrders.eagleviewOrderId, eagleviewOrderId))
    .returning();
  return order;
}

/**
 * List all EagleView orders for a user
 */
export async function listEagleViewOrdersByUser(userId: string) {
  return await db
    .select()
    .from(eagleviewRoofOrders)
    .where(eq(eagleviewRoofOrders.userId, userId))
    .orderBy(desc(eagleviewRoofOrders.createdAt));
}
