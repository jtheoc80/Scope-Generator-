import { NextRequest, NextResponse } from 'next/server';

/**
 * Google Address Validation API Route Handler
 * 
 * This endpoint validates addresses using Google's Address Validation API.
 * The API key is kept server-side for security.
 * 
 * Docs: https://developers.google.com/maps/documentation/address-validation
 */

interface AddressValidationRequest {
  /** The formatted address to validate */
  address: string;
  /** Optional placeId for additional context */
  placeId?: string;
  /** Latitude for additional validation */
  lat?: number;
  /** Longitude for additional validation */
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

export interface AddressValidationResult {
  success: boolean;
  validation?: {
    verdict: string;
    hasUnconfirmedComponents: boolean;
    missingSubpremise: boolean;
    dpvConfirmation: string;
    correctedFormatted: string | null;
    granularity: string;
    addressInferred: boolean;
    isResidential: boolean;
    isComplete: boolean;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AddressValidationRequest;
    const { address } = body;
    // Note: placeId, lat, lng are available for future enhancements
    // but not currently used by Google Address Validation API
    
    // Validate input
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return NextResponse.json<AddressValidationResult>(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Address is required',
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
    
    // Build the request to Google Address Validation API
    const validationRequest = {
      address: {
        regionCode: 'US',
        addressLines: [address],
      },
      enableUspsCass: true, // Enable USPS CASS processing for US addresses
    };
    
    // Call Google Address Validation API
    const response = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationRequest),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Address Validation API error:', response.status, errorText);
      
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
    
    // Determine the validation verdict
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
    
    // Get the corrected/standardized address
    let correctedFormatted: string | null = null;
    
    // Prefer USPS standardized address for US addresses
    if (uspsData?.standardizedAddress) {
      correctedFormatted = buildUSPSFormattedAddress(uspsData);
    }
    
    // Fall back to Google's formatted address
    if (!correctedFormatted && result.address?.formattedAddress) {
      correctedFormatted = result.address.formattedAddress;
    }
    
    // Check for missing subpremise
    const missingSubpremise = checkMissingSubpremise(result);
    
    // Get DPV confirmation
    const dpvConfirmation = uspsData?.dpvConfirmation || '';
    
    const validation = {
      verdict: verdictStr,
      hasUnconfirmedComponents: verdict.hasUnconfirmedComponents || false,
      missingSubpremise,
      dpvConfirmation,
      correctedFormatted,
      granularity: verdict.validationGranularity || verdict.geocodeGranularity || 'UNKNOWN',
      addressInferred: verdict.hasInferredComponents || false,
      isResidential: result.metadata?.residential || false,
      isComplete: verdict.addressComplete || false,
    };
    
    return NextResponse.json<AddressValidationResult>({
      success: true,
      validation,
    });
    
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
