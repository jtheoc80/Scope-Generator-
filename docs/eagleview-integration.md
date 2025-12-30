# EagleView Integration for Roofing

This document describes how to configure and use the EagleView roof measurements integration for ScopeScan roofing proposals.

## Overview

The EagleView integration allows roofing contractors to get professional aerial roof measurements directly within ScopeScan. When a user creates a roofing job, they can request EagleView measurements, which are then used to generate accurate proposals.

**Key Features:**
- Server-to-server OAuth2 authentication (client credentials)
- Webhook-based status updates
- Normalized roofing measurements for proposal generation
- Roofing-only: hidden for other trades

## Environment Variables

Add the following environment variables to your Vercel project (Settings → Environment Variables):

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EAGLEVIEW_CLIENT_ID` | Your EagleView API client ID | `your-client-id` |
| `EAGLEVIEW_CLIENT_SECRET` | Your EagleView API client secret | `your-client-secret` |
| `EAGLEVIEW_WEBHOOK_SECRET` | Random secret for webhook verification | `generate-a-random-string-32-chars` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EAGLEVIEW_BASE_URL` | EagleView API base URL | `https://api.eagleview.com` |
| `EAGLEVIEW_AUTH_URL` | EagleView OAuth token URL | `https://auth.eagleview.com/oauth2/token` |
| `EAGLEVIEW_WEBHOOK_URL` | Override webhook callback URL | Auto-detected |

### Database Variables (Supabase)

Ensure these are configured for database operations:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |

## Vercel Configuration Steps

1. **Add Environment Variables**
   - Go to your Vercel project → Settings → Environment Variables
   - Add all required variables (EAGLEVIEW_CLIENT_ID, etc.)
   - Set scope to Production and Preview as needed
   - Never expose secrets in client-side code

2. **Configure Webhook URL**
   - In your EagleView Developer Portal, set the webhook URL to:
     ```
     https://your-domain.vercel.app/api/webhooks/eagleview
     ```
   - Use the same `EAGLEVIEW_WEBHOOK_SECRET` value in both places

3. **Run Database Migration**
   - The `eagleview_roof_orders` table will be created on first deploy
   - Or manually run: `npm run db:push`

4. **Test the Integration**
   - Deploy to a preview branch first
   - Create a test roofing job
   - Verify the "Get Roof Measurements" button appears
   - Check webhook endpoint receives events

## Security Considerations

⚠️ **Important Security Notes:**

1. **Never expose secrets to the browser**
   - `EAGLEVIEW_CLIENT_SECRET` is server-side only
   - All EagleView API calls go through our server routes
   - The webhook secret verifies incoming requests

2. **Database access**
   - Use `SUPABASE_SERVICE_ROLE_KEY` only in server routes
   - Client-side uses `SUPABASE_ANON_KEY` with RLS

3. **Webhook verification**
   - Always verify `x-webhook-secret` header
   - Reject requests with invalid signatures

## API Routes

### POST /api/roofing/eagleview/order

Create a new measurement order.

**Request:**
```json
{
  "jobId": "123",
  "trade": "roofing",
  "address": "123 Main St, Austin, TX 78701"
}
```

**Response:**
```json
{
  "jobId": "123",
  "orderId": "uuid-...",
  "eagleviewOrderId": "EV-12345",
  "status": "queued"
}
```

### GET /api/roofing/eagleview/status

Get order status and measurements.

**Query:** `?jobId=123`

**Response (completed):**
```json
{
  "jobId": "123",
  "orderId": "uuid-...",
  "status": "completed",
  "reportUrl": "https://...",
  "measurements": {
    "squares": 24,
    "roofAreaSqFt": 2400,
    "ridgesFt": 45,
    "hipsFt": 30,
    "valleysFt": 20,
    "eavesFt": 120,
    "rakesFt": 60,
    "predominantPitch": "6/12"
  }
}
```

### POST /api/webhooks/eagleview

Webhook endpoint for EagleView status updates.

**Headers:** `x-webhook-secret: <your-secret>`

**Event Types:**
- `ORDER_STATUS_UPDATE`: Order status changed
- `REPORT_READY`: Measurements available
- `ORDER_FAILED`: Order failed

## Database Schema

The integration uses the `eagleview_roof_orders` table:

```sql
CREATE TABLE eagleview_roof_orders (
  id UUID PRIMARY KEY,
  job_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  address TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'created',
  eagleview_order_id VARCHAR(100) UNIQUE,
  eagleview_report_id VARCHAR(100),
  report_url TEXT,
  payload_json JSONB,
  roofing_measurements JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

## Roofing Measurements Structure

```typescript
interface RoofingMeasurements {
  squares: number;          // Total roof squares (1 sq = 100 sq ft)
  roofAreaSqFt: number;     // Total area in square feet
  pitchBreakdown: Array<{   // Areas by pitch
    pitch: string;          // e.g., "4/12", "6/12"
    areaSqFt: number;
  }>;
  ridgesFt: number;         // Linear feet of ridges
  hipsFt: number;           // Linear feet of hips
  valleysFt: number;        // Linear feet of valleys
  eavesFt: number;          // Linear feet of eaves
  rakesFt: number;          // Linear feet of rakes
  flashingFt?: number;      // Linear feet of flashing
  dripEdgeFt?: number;      // Linear feet of drip edge
  stepFlashingFt?: number;  // Linear feet of step flashing
  facets?: number;          // Number of roof facets
  stories?: number;         // Number of stories
  predominantPitch?: string;// Most common pitch
}
```

## UI Component

The `EagleViewRoofMeasurements` component:
- Only renders for `trade === "roofing"`
- Shows "Get Roof Measurements" button
- Polls status every 4 seconds when order is in progress
- Displays measurements summary when complete
- Provides link to full EagleView report

## Troubleshooting

### Common Issues

1. **"EagleView integration is not configured"**
   - Check that `EAGLEVIEW_CLIENT_ID` and `EAGLEVIEW_CLIENT_SECRET` are set

2. **Webhook not updating status**
   - Verify `EAGLEVIEW_WEBHOOK_SECRET` matches in both EagleView and Vercel
   - Check webhook URL is correct in EagleView portal
   - Review Vercel function logs

3. **"Could not parse address"**
   - Address must be a valid US address
   - Format: "123 Main St, City, ST 12345"

4. **Token acquisition fails**
   - Check client credentials are correct
   - Verify EagleView account is active

### Logs

Check Vercel function logs for debugging:
- `EagleView order created: <id> -> <ev-order-id> for job <job-id>`
- `EagleView webhook received: <event-type> for order <order-id>`
- `EagleView order <id> status updated to <status>`

## Testing

Run the integration tests:
```bash
npm run e2e -- --grep "EagleView"
```

For local development:
```bash
# Set env vars
export EAGLEVIEW_CLIENT_ID=test
export EAGLEVIEW_CLIENT_SECRET=test
export EAGLEVIEW_WEBHOOK_SECRET=test-secret

# Run tests
npm run e2e
```
