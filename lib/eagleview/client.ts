/**
 * EagleView API Client
 * 
 * Server-side only module for EagleView integration.
 * Handles OAuth2 client credentials flow and API calls.
 * 
 * NEVER import this file from client-side code!
 */

// Token cache (in-memory with expiration)
let cachedToken: {
  accessToken: string;
  expiresAt: number;
} | null = null;

// EagleView API base URL
const EAGLEVIEW_BASE_URL = process.env.EAGLEVIEW_BASE_URL || 'https://api.eagleview.com';
const EAGLEVIEW_AUTH_URL = process.env.EAGLEVIEW_AUTH_URL || 'https://auth.eagleview.com/oauth2/token';

/**
 * EagleView measurement order status types
 */
export type EagleViewOrderStatus = 
  | 'CREATED'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

/**
 * EagleView order creation response
 */
export interface EagleViewOrderResponse {
  orderId: string;
  status: EagleViewOrderStatus;
  estimatedCompletionDate?: string;
}

/**
 * EagleView report data (subset we care about)
 */
export interface EagleViewReport {
  reportId: string;
  orderId: string;
  status: string;
  reportUrl?: string;
  measurements?: {
    totalRoofArea?: number;
    totalSquares?: number;
    ridgesLength?: number;
    hipsLength?: number;
    valleysLength?: number;
    eavesLength?: number;
    rakesLength?: number;
    flashingLength?: number;
    dripEdgeLength?: number;
    stepFlashingLength?: number;
    facets?: number;
    stories?: number;
    predominantPitch?: string;
    pitchBreakdown?: Array<{
      pitch: string;
      area: number;
    }>;
  };
}

/**
 * Get EagleView configuration
 * Throws if required env vars are missing
 */
export function getEagleViewConfig() {
  const clientId = process.env.EAGLEVIEW_CLIENT_ID;
  const clientSecret = process.env.EAGLEVIEW_CLIENT_SECRET;
  const webhookSecret = process.env.EAGLEVIEW_WEBHOOK_SECRET;

  if (!clientId) {
    throw new Error('EAGLEVIEW_CLIENT_ID is not configured');
  }
  if (!clientSecret) {
    throw new Error('EAGLEVIEW_CLIENT_SECRET is not configured');
  }

  return {
    clientId,
    clientSecret,
    webhookSecret: webhookSecret || '',
    baseUrl: EAGLEVIEW_BASE_URL,
    authUrl: EAGLEVIEW_AUTH_URL,
  };
}

/**
 * Check if EagleView is configured
 * Safe to call without throwing
 */
export function isEagleViewConfigured(): boolean {
  return Boolean(
    process.env.EAGLEVIEW_CLIENT_ID && 
    process.env.EAGLEVIEW_CLIENT_SECRET
  );
}

/**
 * Acquire OAuth2 access token using client credentials flow
 * Tokens are cached in memory until 5 minutes before expiration
 */
export async function getAccessToken(): Promise<string> {
  // Check cache first
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.accessToken;
  }

  const config = getEagleViewConfig();
  
  // Request new token
  const response = await fetch(config.authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: 'measurement:create measurement:read report:read',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('EagleView token request failed:', response.status, errorText);
    throw new Error(`Failed to acquire EagleView access token: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the token
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // Expire 5 min early
  };

  return cachedToken.accessToken;
}

/**
 * Clear the token cache (useful for testing)
 */
export function clearTokenCache(): void {
  cachedToken = null;
}

/**
 * Make an authenticated request to EagleView API
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  const config = getEagleViewConfig();
  
  const url = `${config.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`EagleView API error [${endpoint}]:`, response.status, errorText);
    throw new Error(`EagleView API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Address structure for EagleView orders
 */
export interface EagleViewAddress {
  address1: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

/**
 * Parse a formatted address string into components
 */
export function parseAddress(fullAddress: string): EagleViewAddress | null {
  // Try to parse "123 Main St, City, ST 12345" format
  const match = fullAddress.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/i);
  
  if (match) {
    return {
      address1: match[1].trim(),
      city: match[2].trim(),
      state: match[3].toUpperCase(),
      zip: match[4],
      country: 'US',
    };
  }

  // Try alternative format "123 Main St, City ST 12345"
  const altMatch = fullAddress.match(/^(.+?),\s*(.+?)\s+([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/i);
  
  if (altMatch) {
    return {
      address1: altMatch[1].trim(),
      city: altMatch[2].trim(),
      state: altMatch[3].toUpperCase(),
      zip: altMatch[4],
      country: 'US',
    };
  }

  return null;
}

/**
 * Create a measurement order for a roofing report
 * 
 * @param address - Address components or full address string
 * @param referenceId - Your internal reference (job ID)
 * @param webhookUrl - URL to receive status updates
 */
export async function createMeasurementOrder(
  address: EagleViewAddress | string,
  referenceId: string,
  webhookUrl?: string
): Promise<EagleViewOrderResponse> {
  let addressData: EagleViewAddress;
  
  if (typeof address === 'string') {
    const parsed = parseAddress(address);
    if (!parsed) {
      throw new Error('Could not parse address. Please provide address components.');
    }
    addressData = parsed;
  } else {
    addressData = address;
  }

  const payload = {
    address: {
      streetAddress: addressData.address1,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.zip,
      country: addressData.country || 'US',
    },
    productType: 'PREMIUM_ROOF_MEASUREMENT', // Standard roof measurement product
    referenceId,
    deliveryMethod: 'API',
    ...(webhookUrl && { callbackUrl: webhookUrl }),
  };

  return apiRequest<EagleViewOrderResponse>('/v2/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get order status
 */
export async function getOrderStatus(orderId: string): Promise<{
  orderId: string;
  status: EagleViewOrderStatus;
  reportId?: string;
}> {
  return apiRequest(`/v2/orders/${orderId}`);
}

/**
 * Get report details and measurements
 */
export async function getReport(reportId: string): Promise<EagleViewReport> {
  return apiRequest(`/v2/reports/${reportId}`);
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  // EagleView uses a simple secret comparison in the header
  // Some providers use HMAC - adjust as needed based on actual EV docs
  return signature === secret;
}

/**
 * Map EagleView status to our internal status
 */
export function mapEagleViewStatus(evStatus: EagleViewOrderStatus): string {
  const statusMap: Record<EagleViewOrderStatus, string> = {
    'CREATED': 'queued',
    'PENDING': 'queued',
    'IN_PROGRESS': 'processing',
    'COMPLETED': 'completed',
    'FAILED': 'failed',
    'CANCELLED': 'failed',
  };
  return statusMap[evStatus] || 'queued';
}

/**
 * Parse EagleView measurements into normalized RoofingMeasurements format
 */
export function parseRoofingMeasurements(report: EagleViewReport): {
  squares: number;
  roofAreaSqFt: number;
  pitchBreakdown: Array<{ pitch: string; areaSqFt: number }>;
  ridgesFt: number;
  hipsFt: number;
  valleysFt: number;
  eavesFt: number;
  rakesFt: number;
  flashingFt?: number;
  dripEdgeFt?: number;
  stepFlashingFt?: number;
  facets?: number;
  stories?: number;
  predominantPitch?: string;
} | null {
  if (!report.measurements) {
    return null;
  }

  const m = report.measurements;
  
  return {
    squares: m.totalSquares || Math.round((m.totalRoofArea || 0) / 100),
    roofAreaSqFt: m.totalRoofArea || 0,
    pitchBreakdown: (m.pitchBreakdown || []).map(p => ({
      pitch: p.pitch,
      areaSqFt: p.area,
    })),
    ridgesFt: m.ridgesLength || 0,
    hipsFt: m.hipsLength || 0,
    valleysFt: m.valleysLength || 0,
    eavesFt: m.eavesLength || 0,
    rakesFt: m.rakesLength || 0,
    flashingFt: m.flashingLength,
    dripEdgeFt: m.dripEdgeLength,
    stepFlashingFt: m.stepFlashingLength,
    facets: m.facets,
    stories: m.stories,
    predominantPitch: m.predominantPitch,
  };
}
