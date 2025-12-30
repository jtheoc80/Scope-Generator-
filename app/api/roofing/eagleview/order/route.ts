/**
 * POST /api/roofing/eagleview/order
 * 
 * Create an EagleView measurement order for a roofing job.
 * Validates that trade is roofing, acquires OAuth token,
 * creates measurement order via EagleView API, and persists to DB.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  isEagleViewConfigured,
  createMeasurementOrder,
  parseAddress,
  type EagleViewAddress,
} from "@/lib/eagleview/client";
import {
  createEagleViewOrder,
  getEagleViewOrderByJobId,
} from "@/lib/eagleview/storage";

// Request schema
const orderRequestSchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
  trade: z.literal("roofing", { 
    errorMap: () => ({ message: "EagleView measurements are only available for roofing" }) 
  }),
  // Either provide full address string or components
  address: z.string().min(10, "Full address is required").optional(),
  address1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
}).refine((data) => {
  // Must have either full address or components
  if (data.address) return true;
  return data.address1 && data.city && data.state && data.zip;
}, {
  message: "Either 'address' or address components (address1, city, state, zip) are required"
});

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Check EagleView configuration
    if (!isEagleViewConfigured()) {
      return NextResponse.json(
        { error: { code: "NOT_CONFIGURED", message: "EagleView integration is not configured" } },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = orderRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      const message = parseResult.error.issues[0]?.message || "Invalid request";
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message } },
        { status: 400 }
      );
    }

    const { jobId, address, address1, city, state, zip } = parseResult.data;

    // Check if there's already an active order for this job
    const existingOrder = await getEagleViewOrderByJobId(jobId, userId);
    if (existingOrder && ['queued', 'processing'].includes(existingOrder.status)) {
      return NextResponse.json({
        jobId,
        orderId: existingOrder.id,
        eagleviewOrderId: existingOrder.eagleviewOrderId,
        status: existingOrder.status,
        message: "An order is already in progress for this job"
      });
    }

    // Build address for EagleView
    let evAddress: EagleViewAddress | null = null;
    let fullAddress: string;

    if (address) {
      evAddress = parseAddress(address);
      fullAddress = address;
      
      if (!evAddress) {
        return NextResponse.json(
          { error: { code: "INVALID_INPUT", message: "Could not parse address. Please provide address components (address1, city, state, zip)." } },
          { status: 400 }
        );
      }
    } else {
      evAddress = {
        address1: address1!,
        city: city!,
        state: state!,
        zip: zip!,
        country: 'US',
      };
      fullAddress = `${address1}, ${city}, ${state} ${zip}`;
    }

    // Generate internal order ID
    const internalOrderId = crypto.randomUUID();

    // Build webhook URL
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const webhookUrl = process.env.EAGLEVIEW_WEBHOOK_URL || `${protocol}://${host}/api/webhooks/eagleview`;

    // Create EagleView measurement order
    let evOrderResponse;
    try {
      evOrderResponse = await createMeasurementOrder(evAddress, internalOrderId, webhookUrl);
    } catch (error) {
      console.error("EagleView order creation failed:", error);
      
      // Create failed order record
      await createEagleViewOrder({
        id: internalOrderId,
        jobId,
        userId,
        address: fullAddress,
        status: 'failed',
      });

      return NextResponse.json(
        { error: { code: "EAGLEVIEW_ERROR", message: "Failed to create EagleView order" } },
        { status: 502 }
      );
    }

    // Persist order to database
    const order = await createEagleViewOrder({
      id: internalOrderId,
      jobId,
      userId,
      address: fullAddress,
      status: 'queued',
      eagleviewOrderId: evOrderResponse.orderId,
    });

    console.log(`EagleView order created: ${order.id} -> ${evOrderResponse.orderId} for job ${jobId}`);

    return NextResponse.json({
      jobId,
      orderId: order.id,
      eagleviewOrderId: evOrderResponse.orderId,
      status: order.status,
      estimatedCompletionDate: evOrderResponse.estimatedCompletionDate,
    });

  } catch (error) {
    console.error("EagleView order route error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
