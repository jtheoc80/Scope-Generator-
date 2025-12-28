import { NextRequest, NextResponse } from 'next/server';

/**
 * Google Address Validation API Route Handler
 * 
 * This endpoint validates addresses using Google's Address Validation API.
 * The API key is kept server-side for security.
 * 
 * Flow:
 * 1. Receive structured address fields from client (line1, city, state, postal)
 * 2. Build proper request body for Address Validation API
 * 3. Call Google Address Validation API v1:validateAddress with enableUspsCass: true
 * 4. Return minimized response with verdict and standardized address
 * 
 * Docs: https://developers.google.com/maps/documentation/address-validation
 */

// Request timeout in milliseconds
const API_TIMEOUT_MS = 10000;

/**
 * Structured address request - preferred format
 */
interface StructuredAddressRequest {
  /** Street address line 1 (e.g., "123 Main St") */
  line1: string;
  /** Street address line 2 (unit/apt) */
  line2?: string;
  /** City name */
  city: string;
  /** State code (e.g., "CA") */
  state: string;
  /** Postal/ZIP code */
  postalCode: string;
  /** ZIP+4 suffix */
  postalCodeSuffix?: string;
  /** Region code (default: US) */
  regionCode?: string;
}

interface AddressValidationRequest {
  /** The formatted address to validate (legacy fallback) */
  address?: string;
  /** Structured address fields (preferred) */
  structured?: StructuredAddressRequest;
  /** Optional placeId for logging/debugging (not sent to Google) */
  placeId?: string;
  /** Latitude for logging/debugging (not sent to Google) */
  lat?: number;
  /** Longitude for logging/debugging (not sent to Google) */
  lng?: number;
}

interface GoogleAddressValidationResponse {
  result: {
    verdict: {
      inputGranularity?: string;
      validationGranularity?: string;
      geocodeGranularity?: string;
      addressComplete?: boolean;
      hasUnconfirmedComponents?: boolean;
      hasInferredComponents?: boolean;
      hasReplacedComponents?: boolean;
    };
    address: {
      formattedAddress?: string;
      postalAddress?: {
        regionCode?: string;
        languageCode?: string;
        postalCode?: string;
        administrativeArea?: string;
        locality?: string;
        addressLines?: string[];
      };
      addressComponents?: Array<{
        componentName?: {
          text?: string;
          languageCode?: string;
        };
        componentType?: string;
        confirmationLevel?: string;
        inferred?: boolean;
        spellCorrected?: boolean;
        replaced?: boolean;
        unexpected?: boolean;
      }>;
      missingComponentTypes?: string[];
      unconfirmedComponentTypes?: string[];
      unresolvedTokens?: string[];
    };
    geocode?: {
      location?: {
        latitude?: number;
        longitude?: number;
      };
      plusCode?: {
        globalCode?: string;
        compoundCode?: string;
      };
      placeId?: string;
    };
    metadata?: {
      business?: boolean;
      poBox?: boolean;
      residential?: boolean;
    };
    uspsData?: {
      standardizedAddress?: {
        firstAddressLine?: string;
        firm?: string;
        secondAddressLine?: string;
        urbanization?: string;
        cityStateZipAddressLine?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        zipCodeExtension?: string;
      };
      deliveryPointCode?: string;
      deliveryPointCheckDigit?: string;
      dpvConfirmation?: string;
      dpvFootnote?: string;
      dpvCmra?: string;
      dpvVacant?: string;
      dpvNoStat?: string;
      carrierRoute?: string;
      carrierRouteIndicator?: string;
      ewsNoMatch?: boolean;
      postOfficeCity?: string;
      postOfficeState?: string;
      abbreviatedCity?: string;
      fipsCountyCode?: string;
      county?: string;
      elotNumber?: string;
      elotFlag?: string;
      lacsLinkReturnCode?: string;
      lacsLinkIndicator?: string;
      poBoxOnlyPostalCode?: boolean;
      suitelinkFootnote?: string;
      pmbDesignator?: string;
      pmbNumber?: string;
      addressRecordType?: string;
      defaultAddress?: boolean;
      errorMessage?: string;
      cassProcessed?: boolean;
    };
  };
  responseId?: string;
}

/**
 * Detailed verdict information
 */
export interface AddressVerdict {
  /** How precisely the address was validated (PREMISE, SUB_PREMISE, ROUTE, OTHER) */
  validationGranularity: string;
  /** How precisely the location was geocoded */
  geocodeGranularity: string;
  /** Whether the address is complete */
  addressComplete: boolean;
  /** Whether there are components that couldn't be confirmed */
  hasUnconfirmedComponents: boolean;
  /** Whether components were replaced/corrected */
  hasReplacedComponents: boolean;
  /** Types of components that were unconfirmed */
  unconfirmedComponentTypes: string[];
}

export interface AddressValidationResult {
  success: boolean;
  validation?: {
    /** Legacy verdict string for backwards compatibility */
    verdict: string;
    /** Detailed verdict information */
    verdictDetails: AddressVerdict;
    hasUnconfirmedComponents: boolean;
    missingSubpremise: boolean;
    dpvConfirmation: string;
    /** The standardized/validated formatted address */
    standardizedAddress: string | null;
    /** Legacy field - alias for standardizedAddress */
    correctedFormatted: string | null;
    granularity: string;
    addressInferred: boolean;
    isResidential: boolean;
    isComplete: boolean;
    /** List of warning messages for client display */
    messages: string[];
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Build a standardized formatted address from USPS data
 */
function buildUSPSFormattedAddress(uspsData: NonNullable<GoogleAddressValidationResponse['result']['uspsData']>): string | null {
  const addr = uspsData.standardizedAddress;
  if (!addr) return null;
  
  const parts: string[] = [];
  
  // First address line (street address)
  if (addr.firstAddressLine) {
    parts.push(addr.firstAddressLine);
  }
  
  // Second address line (unit, apt, etc.)
  if (addr.secondAddressLine) {
    parts.push(addr.secondAddressLine);
  }
  
  // City, State ZIP
  if (addr.cityStateZipAddressLine) {
    parts.push(addr.cityStateZipAddressLine);
  } else if (addr.city && addr.state) {
    const zip = addr.zipCodeExtension 
      ? `${addr.zipCode}-${addr.zipCodeExtension}`
      : addr.zipCode;
    parts.push(`${addr.city}, ${addr.state} ${zip || ''}`.trim());
  }
  
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Determine if a subpremise (unit/apt number) might be missing
 */
function checkMissingSubpremise(result: GoogleAddressValidationResponse['result']): boolean {
  // Check if address is residential and might need a unit number
  const isResidential = result.metadata?.residential === true;
  const missingTypes = result.address?.missingComponentTypes || [];
  
  // Check USPS data for subpremise indicators
  const dpvFootnote = result.uspsData?.dpvFootnote || '';
  
  // DPV footnote AA = address matched to CMRA (private mailbox)
  // DPV footnote BB = address matched down to DPBC (delivery point bar code)
  // DPV footnote CC = address matched down to ZIP+4
  // DPV footnote N1 = primary number missing
  // DPV footnote M1 = primary number matched
  // DPV footnote M3 = primary number matched, secondary number missing
  // DPV footnote P1 = missing PO/RR/HC box number
  
  const mightNeedUnit = dpvFootnote.includes('M3') || // Primary matched, secondary missing
    missingTypes.includes('subpremise') ||
    missingTypes.includes('floor') ||
    missingTypes.includes('room');
  
  return isResidential && mightNeedUnit;
}

/**
 * Build Google Address Validation API request body from structured or legacy input
 */
function buildValidationRequest(body: AddressValidationRequest): { address: Record<string, unknown>; enableUspsCass: boolean } | null {
  const regionCode = body.structured?.regionCode || 'US';
  
  // Prefer structured address format
  if (body.structured) {
    const { line1, line2, city, state, postalCode, postalCodeSuffix } = body.structured;
    
    // Build ZIP code with optional suffix
    const fullPostalCode = postalCodeSuffix 
      ? `${postalCode}-${postalCodeSuffix}`
      : postalCode;
    
    // Build address lines array
    const addressLines = line2 ? [line1, line2] : [line1];
    
    return {
      address: {
        regionCode,
        addressLines,
        locality: city,
        administrativeArea: state,
        postalCode: fullPostalCode,
      },
      enableUspsCass: regionCode === 'US',
    };
  }
  
  // Fallback to legacy format (single address string)
  if (body.address && typeof body.address === 'string' && body.address.trim().length > 0) {
    return {
      address: {
        regionCode,
        addressLines: [body.address.trim()],
      },
      enableUspsCass: regionCode === 'US',
    };
  }
  
  return null;
}

/**
 * Build warning messages for client display
 */
function buildWarningMessages(
  result: GoogleAddressValidationResponse['result'],
  verdictDetails: AddressVerdict
): string[] {
  const messages: string[] = [];
  
  // Low validation granularity warnings
  if (verdictDetails.validationGranularity === 'OTHER') {
    messages.push('Address could not be validated at street level');
  } else if (verdictDetails.validationGranularity === 'ROUTE') {
    messages.push('Address validated to street level only - building number may be unconfirmed');
  }
  
  // Unconfirmed components
  if (verdictDetails.hasUnconfirmedComponents && verdictDetails.unconfirmedComponentTypes.length > 0) {
    const types = verdictDetails.unconfirmedComponentTypes
      .map(t => t.replace(/_/g, ' ').toLowerCase())
      .join(', ');
    messages.push(`Some address parts could not be verified: ${types}`);
  }
  
  // Missing subpremise
  const missingTypes = result.address?.missingComponentTypes || [];
  if (missingTypes.includes('subpremise') || missingTypes.includes('floor')) {
    messages.push('This address may need a unit or apartment number');
  }
  
  // USPS DPV warnings
  const dpvConfirmation = result.uspsData?.dpvConfirmation || '';
  if (dpvConfirmation === 'N') {
    messages.push('Address could not be confirmed as a valid USPS delivery point');
  } else if (dpvConfirmation === 'D') {
    messages.push('Address is missing secondary information (apt/unit)');
  } else if (dpvConfirmation === 'S') {
    messages.push('Primary address matched but secondary info could not be verified');
  }
  
  // Inferred components
  if (result.verdict?.hasInferredComponents) {
    messages.push('Some parts of this address were inferred - please verify');
  }
  
  return messages;
}

export async function POST(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    const body = await request.json() as AddressValidationRequest;
    
    // Build validation request from input
    const validationRequest = buildValidationRequest(body);
    
    if (!validationRequest) {
      return NextResponse.json<AddressValidationResult>(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Address is required. Provide either structured fields or address string.',
          },
        },
        { status: 400 }
      );
    }
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY is not configured for address validation');
      return NextResponse.json<AddressValidationResult>(
        {
          success: false,
          error: {
            code: 'CONFIG_ERROR',
            message: 'Address validation service is not configured',
          },
        },
        { status: 500 }
      );
    }
    
    // Log request (but not full address in production for privacy)
    if (!isProduction) {
      console.log('Address validation request:', validationRequest);
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    
    try {
      // Call Google Address Validation API with timeout
      const response = await fetch(
        `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validationRequest),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Address Validation API error:', response.status, isProduction ? '[response hidden]' : errorText);
        
        // Handle specific error cases
        if (response.status === 403) {
          return NextResponse.json<AddressValidationResult>(
            {
              success: false,
              error: {
                code: 'API_DISABLED',
                message: 'Address Validation API is not enabled. Please enable it in Google Cloud Console.',
              },
            },
            { status: 502 }
          );
        }
        
        return NextResponse.json<AddressValidationResult>(
          {
            success: false,
            error: {
              code: 'API_ERROR',
              message: 'Failed to validate address',
            },
          },
          { status: 502 }
        );
      }
      
      const data: GoogleAddressValidationResponse = await response.json();
      const result = data.result;
      
      if (!result) {
        return NextResponse.json<AddressValidationResult>(
          {
            success: false,
            error: {
              code: 'NO_RESULT',
              message: 'No validation result returned',
            },
          },
          { status: 404 }
        );
      }
      
      // Extract validation details
      const verdict = result.verdict || {};
      const uspsData = result.uspsData;
      
      // Build detailed verdict object
      const verdictDetails: AddressVerdict = {
        validationGranularity: verdict.validationGranularity || 'OTHER',
        geocodeGranularity: verdict.geocodeGranularity || 'OTHER',
        addressComplete: verdict.addressComplete || false,
        hasUnconfirmedComponents: verdict.hasUnconfirmedComponents || false,
        hasReplacedComponents: verdict.hasReplacedComponents || false,
        unconfirmedComponentTypes: result.address?.unconfirmedComponentTypes || [],
      };
      
      // Determine the legacy validation verdict string
      let verdictStr = 'UNKNOWN';
      if (verdict.addressComplete && !verdict.hasUnconfirmedComponents) {
        verdictStr = 'CONFIRMED';
      } else if (verdict.hasUnconfirmedComponents) {
        verdictStr = 'UNCONFIRMED_COMPONENTS';
      } else if (verdict.hasInferredComponents) {
        verdictStr = 'INFERRED';
      } else if (verdict.hasReplacedComponents) {
        verdictStr = 'CORRECTED';
      }
      
      // Get the standardized address
      let standardizedAddress: string | null = null;
      
      // Prefer USPS standardized address for US addresses
      if (uspsData?.standardizedAddress) {
        standardizedAddress = buildUSPSFormattedAddress(uspsData);
      }
      
      // Fall back to Google's formatted address
      if (!standardizedAddress && result.address?.formattedAddress) {
        standardizedAddress = result.address.formattedAddress;
      }
      
      // Check for missing subpremise
      const missingSubpremise = checkMissingSubpremise(result);
      
      // Get DPV confirmation
      const dpvConfirmation = uspsData?.dpvConfirmation || '';
      
      // Build warning messages
      const messages = buildWarningMessages(result, verdictDetails);
      
      const validation = {
        verdict: verdictStr,
        verdictDetails,
        hasUnconfirmedComponents: verdict.hasUnconfirmedComponents || false,
        missingSubpremise,
        dpvConfirmation,
        standardizedAddress,
        correctedFormatted: standardizedAddress, // Legacy alias
        granularity: verdict.validationGranularity || verdict.geocodeGranularity || 'UNKNOWN',
        addressInferred: verdict.hasInferredComponents || false,
        isResidential: result.metadata?.residential || false,
        isComplete: verdict.addressComplete || false,
        messages,
      };
      
      return NextResponse.json<AddressValidationResult>({
        success: true,
        validation,
      });
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Address Validation API timeout');
        return NextResponse.json<AddressValidationResult>(
          {
            success: false,
            error: {
              code: 'TIMEOUT',
              message: 'Address validation timed out. Please try again.',
            },
          },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Error in address validation:', error);
    return NextResponse.json<AddressValidationResult>(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred while validating the address',
        },
      },
      { status: 500 }
    );
  }
}
