/**
 * GET /api/roofing/eagleview/status
 * 
 * Get the status of an EagleView measurement order for a job.
 * Returns order status, report URL, and measurements when available.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getEagleViewOrderByJobId } from "@/lib/eagleview/storage";
import type { RoofingMeasurements } from "@/lib/schema";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Get jobId from query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "jobId query parameter is required" } },
        { status: 400 }
      );
    }

    // Get order from database
    const order = await getEagleViewOrderByJobId(jobId, userId);

    if (!order) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "No EagleView order found for this job" } },
        { status: 404 }
      );
    }

    // Build response based on status
    const response: {
      jobId: string;
      orderId: string;
      status: string;
      eagleviewOrderId: string | null;
      reportUrl?: string | null;
      reportId?: string | null;
      measurements?: RoofingMeasurements | null;
      errorMessage?: string | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    } = {
      jobId: order.jobId,
      orderId: order.id,
      status: order.status,
      eagleviewOrderId: order.eagleviewOrderId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    // Include additional data for completed orders
    if (order.status === 'completed') {
      response.reportUrl = order.reportUrl;
      response.reportId = order.eagleviewReportId;
      response.measurements = order.roofingMeasurements as RoofingMeasurements | null;
    }

    // Include error message for failed orders
    if (order.status === 'failed') {
      response.errorMessage = order.errorMessage;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("EagleView status route error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
