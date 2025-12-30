/**
 * POST /api/webhooks/eagleview
 * 
 * Webhook endpoint for EagleView status updates.
 * Verifies webhook secret, parses event, and updates order status.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  getEagleViewConfig,
  mapEagleViewStatus,
  parseRoofingMeasurements,
  getReport,
  type EagleViewReport,
} from "@/lib/eagleview/client";
import {
  getEagleViewOrderByEvOrderId,
  updateEagleViewOrderByEvOrderId,
} from "@/lib/eagleview/storage";

// Disable body parsing for webhook signature verification
export const dynamic = 'force-dynamic';

// EagleView webhook event structure (adjust based on actual EV docs)
interface EagleViewWebhookEvent {
  eventType: 'ORDER_STATUS_UPDATE' | 'REPORT_READY' | 'ORDER_FAILED';
  orderId: string;
  status?: string;
  reportId?: string;
  reportUrl?: string;
  error?: {
    code?: string;
    message?: string;
  };
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  
  try {
    // Get webhook secret from config
    let webhookSecret: string;
    try {
      const config = getEagleViewConfig();
      webhookSecret = config.webhookSecret;
    } catch {
      console.error("EagleView webhook: Configuration not available");
      return NextResponse.json(
        { message: "Webhook not configured" },
        { status: 503 }
      );
    }

    // Verify webhook secret header
    const headersList = await headers();
    const signature = headersList.get('x-webhook-secret') || headersList.get('x-eagleview-signature');

    if (!webhookSecret) {
      console.warn("EagleView webhook: No webhook secret configured, skipping verification");
    } else if (!signature || signature !== webhookSecret) {
      console.error("EagleView webhook: Invalid signature");
      return NextResponse.json(
        { message: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    // Parse event body
    let event: EagleViewWebhookEvent;
    try {
      event = await request.json();
    } catch {
      console.error("EagleView webhook: Invalid JSON body");
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!event.orderId) {
      console.error("EagleView webhook: Missing orderId");
      return NextResponse.json(
        { message: "Missing orderId" },
        { status: 400 }
      );
    }

    console.log(`EagleView webhook received: ${event.eventType} for order ${event.orderId}`);

    // Find order in our database
    const order = await getEagleViewOrderByEvOrderId(event.orderId);
    if (!order) {
      console.warn(`EagleView webhook: Order not found: ${event.orderId}`);
      // Return 200 to acknowledge - order might have been deleted
      return NextResponse.json({ received: true, message: "Order not found" });
    }

    // Process based on event type
    switch (event.eventType) {
      case 'ORDER_STATUS_UPDATE': {
        if (event.status) {
          const newStatus = mapEagleViewStatus(event.status as any);
          await updateEagleViewOrderByEvOrderId(event.orderId, {
            status: newStatus as 'queued' | 'processing' | 'completed' | 'failed',
            payloadJson: { lastEvent: event },
          });
          console.log(`EagleView order ${event.orderId} status updated to ${newStatus}`);
        }
        break;
      }

      case 'REPORT_READY': {
        // Fetch the full report to get measurements
        let report: EagleViewReport | null = null;
        let measurements = null;

        if (event.reportId) {
          try {
            report = await getReport(event.reportId);
            measurements = parseRoofingMeasurements(report);
          } catch (err) {
            console.error(`Failed to fetch EagleView report ${event.reportId}:`, err);
          }
        }

        await updateEagleViewOrderByEvOrderId(event.orderId, {
          status: 'completed',
          eagleviewReportId: event.reportId,
          reportUrl: event.reportUrl || report?.reportUrl,
          roofingMeasurements: measurements || undefined,
          payloadJson: {
            lastEvent: event,
            ...(report ? { reportData: report } : {}),
          },
        });
        console.log(`EagleView order ${event.orderId} completed with report ${event.reportId}`);
        break;
      }

      case 'ORDER_FAILED': {
        await updateEagleViewOrderByEvOrderId(event.orderId, {
          status: 'failed',
          errorMessage: event.error?.message || 'Order failed',
          payloadJson: { lastEvent: event },
        });
        console.log(`EagleView order ${event.orderId} failed: ${event.error?.message}`);
        break;
      }

      default:
        console.log(`EagleView webhook: Unhandled event type: ${event.eventType}`);
    }

    console.log(`EagleView webhook processed in ${Date.now() - t0}ms`);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("EagleView webhook error:", error);
    // Return 200 to prevent retries for unrecoverable errors
    return NextResponse.json(
      { received: true, error: "Internal error" },
      { status: 200 }
    );
  }
}
