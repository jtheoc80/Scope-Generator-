/**
 * Address Validation Service
 * 
 * Client-side service for validating addresses through Google Address Validation API.
 * The actual API call is made server-side to keep the API key secure.
 * 
 * Flow:
 * 1. Receive JobAddress with parsed components from Place Details
 * 2. Call server endpoint with structured fields (preferred) or formatted address (fallback)
 * 3. Return standardized address, verdict, and warnings
 */

import type { AddressValidation, JobAddress } from '@/app/m/lib/job-address';

/**
 * Detailed verdict from API
 */
export interface ValidationVerdictDetails {
  validationGranularity: string;
  geocodeGranularity: string;
  addressComplete: boolean;
  hasUnconfirmedComponents: boolean;
  hasReplacedComponents: boolean;
  unconfirmedComponentTypes: string[];
}

export interface AddressValidationResponse {
  success: boolean;
  validation?: {
    verdict: string;
    verdictDetails?: ValidationVerdictDetails;
    hasUnconfirmedComponents: boolean;
    missingSubpremise: boolean;
    dpvConfirmation: string;
    standardizedAddress: string | null;
    correctedFormatted: string | null; // Legacy alias
    granularity: string;
    addressInferred: boolean;
    isResidential: boolean;
    isComplete: boolean;
    messages: string[];
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Structured address payload for validation
 */
export interface StructuredAddressPayload {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  postalCodeSuffix?: string;
  regionCode?: string;
}

/**
 * Full validation request payload
 */
export interface ValidationPayload {
  /** Structured address fields (preferred) */
  structured?: StructuredAddressPayload;
  /** Fallback formatted address string */
  address?: string;
  /** Place ID for logging */
  placeId?: string;
  /** Latitude for logging */
  lat?: number;
  /** Longitude for logging */
  lng?: number;
}

/**
 * Validate an address using Google Address Validation API.
 * Prefers structured address fields when available.
 * 
 * @param payload - Validation payload with structured or formatted address
 * @returns Promise containing validation results
 * 
 * @example
 * ```ts
 * // With structured fields (preferred)
 * const result = await validateAddress({
 *   structured: {
 *     line1: "123 Main St",
 *     city: "San Francisco",
 *     state: "CA",
 *     postalCode: "94102"
 *   },
 *   placeId: "ChIJxxxxxxxxxx"
 * });
 * 
 * // With formatted address (fallback)
 * const result = await validateAddress({
 *   address: "123 Main St, San Francisco, CA 94102"
 * });
 * ```
 */
export async function validateAddress(
  payload: ValidationPayload
): Promise<AddressValidationResponse> {
  try {
    const response = await fetch('/api/address/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to validate address',
        },
      };
    }

    return data;
  } catch (error) {
    console.error('Error calling address validation API:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to address validation service',
      },
    };
  }
}

/**
 * Legacy function signature for backwards compatibility
 */
export async function validateAddressLegacy(
  address: string,
  placeId?: string,
  lat?: number,
  lng?: number
): Promise<AddressValidationResponse> {
  return validateAddress({ address, placeId, lat, lng });
}

/**
 * Convert API validation response to AddressValidation type for storage
 */
export function toAddressValidation(
  apiValidation: NonNullable<AddressValidationResponse['validation']>
): AddressValidation {
  return {
    verdict: apiValidation.verdict,
    hasUnconfirmedComponents: apiValidation.hasUnconfirmedComponents,
    missingSubpremise: apiValidation.missingSubpremise,
    dpvConfirmation: apiValidation.dpvConfirmation,
    correctedFormatted: apiValidation.standardizedAddress || apiValidation.correctedFormatted || undefined,
    granularity: apiValidation.granularity,
    addressInferred: apiValidation.addressInferred,
    // Include detailed verdict if available
    verdictDetails: apiValidation.verdictDetails ? {
      validationGranularity: apiValidation.verdictDetails.validationGranularity,
      geocodeGranularity: apiValidation.verdictDetails.geocodeGranularity,
      addressComplete: apiValidation.verdictDetails.addressComplete,
      hasUnconfirmedComponents: apiValidation.verdictDetails.hasUnconfirmedComponents,
      hasReplacedComponents: apiValidation.verdictDetails.hasReplacedComponents,
      unconfirmedComponentTypes: apiValidation.verdictDetails.unconfirmedComponentTypes,
    } : undefined,
  };
}

/**
 * Build validation payload from JobAddress
 * Prefers structured components when available
 */
function buildValidationPayload(jobAddress: JobAddress): ValidationPayload {
  const payload: ValidationPayload = {
    placeId: jobAddress.placeId,
    lat: jobAddress.lat,
    lng: jobAddress.lng,
  };
  
  // Prefer structured address fields if available
  if (jobAddress.components) {
    payload.structured = {
      line1: jobAddress.components.line1,
      line2: jobAddress.components.line2,
      city: jobAddress.components.city,
      state: jobAddress.components.state,
      postalCode: jobAddress.components.postalCode,
      postalCodeSuffix: jobAddress.components.postalCodeSuffix,
      regionCode: 'US',
    };
  } else {
    // Fallback to formatted address
    payload.address = jobAddress.formatted;
  }
  
  return payload;
}

/**
 * Check if verdict indicates low quality address that needs attention
 */
function isLowQualityVerdict(validation: AddressValidation): boolean {
  const details = validation.verdictDetails;
  if (!details) {
    // Fall back to legacy checks
    return validation.hasUnconfirmedComponents === true;
  }
  
  // Low quality indicators:
  // - validationGranularity is OTHER or ROUTE (not PREMISE or SUB_PREMISE)
  // - hasUnconfirmedComponents is true
  const granularity = details.validationGranularity;
  return (
    granularity === 'OTHER' ||
    granularity === 'ROUTE' ||
    details.hasUnconfirmedComponents
  );
}

/**
 * Validate a JobAddress and return an updated version with validation data.
 * This is the main function to call after selecting an address.
 * 
 * Uses structured address fields (line1/city/state/postal) when available
 * for better validation accuracy. The placeId + lat/lng are preserved
 * separately (validation is for standardization, not for determining the place).
 * 
 * @param jobAddress - The JobAddress to validate
 * @returns Promise containing the validated JobAddress or error info
 */
export async function validateJobAddress(
  jobAddress: JobAddress
): Promise<{ 
  address: JobAddress; 
  needsCorrection: boolean;
  hasWarnings: boolean;
  isLowQuality: boolean;
  warnings: string[];
  error?: string;
}> {
  const payload = buildValidationPayload(jobAddress);
  const result = await validateAddress(payload);

  if (!result.success || !result.validation) {
    // If validation fails, still mark as validated but silently
    // This allows the user to proceed while logging the issue
    console.warn('Address validation failed:', result.error);
    return {
      address: {
        ...jobAddress,
        validated: true, // Allow proceeding even if API fails
        validation: {
          verdict: 'VALIDATION_UNAVAILABLE',
        },
        updatedAt: Date.now(),
      },
      needsCorrection: false,
      hasWarnings: false,
      isLowQuality: false,
      warnings: [],
      error: result.error?.message,
    };
  }

  const validation = toAddressValidation(result.validation);
  const apiMessages = result.validation.messages || [];
  
  // Get the standardized address
  const standardizedAddress = result.validation.standardizedAddress || 
                               result.validation.correctedFormatted;
  
  // Check if we have a corrected address that differs
  const needsCorrection = !!(
    standardizedAddress &&
    standardizedAddress.toLowerCase().trim() !== 
    jobAddress.formatted.toLowerCase().trim()
  );

  // Check for warnings from API
  const hasWarnings = apiMessages.length > 0 ||
    validation.hasUnconfirmedComponents === true ||
    validation.missingSubpremise === true ||
    validation.addressInferred === true;

  // Check for low quality verdict
  const isLowQuality = isLowQualityVerdict(validation);

  // Build final warnings list
  const warnings = apiMessages.length > 0 ? apiMessages : getValidationWarnings(validation);

  // Determine which formatted address to display
  // If we have a standardized address from validation, use it
  const displayFormatted = standardizedAddress || jobAddress.formatted;

  return {
    address: {
      ...jobAddress,
      formatted: displayFormatted,
      validated: true,
      validation,
      warnings: warnings.length > 0 ? warnings : undefined,
      updatedAt: Date.now(),
    },
    needsCorrection,
    hasWarnings,
    isLowQuality,
    warnings,
  };
}

/**
 * Apply a corrected/standardized address from validation
 */
export function applyCorrectedAddress(
  jobAddress: JobAddress,
  correctedFormatted: string
): JobAddress {
  return {
    ...jobAddress,
    formatted: correctedFormatted,
    // Keep validation but update the corrected field to indicate it was applied
    validation: jobAddress.validation ? {
      ...jobAddress.validation,
      correctedFormatted: undefined, // Clear since it's now applied
    } : undefined,
    // Clear warnings since user accepted the correction
    warnings: undefined,
    updatedAt: Date.now(),
  };
}

/**
 * Result type from validateJobAddress
 */
export interface ValidateJobAddressResult {
  address: JobAddress;
  needsCorrection: boolean;
  hasWarnings: boolean;
  isLowQuality: boolean;
  warnings: string[];
  error?: string;
}

/**
 * Get human-readable validation status message
 */
export function getValidationStatusMessage(validation?: AddressValidation): string {
  if (!validation) return 'Not validated';
  
  switch (validation.verdict) {
    case 'CONFIRMED':
      return 'Address verified';
    case 'UNCONFIRMED_COMPONENTS':
      return 'Some address parts could not be confirmed';
    case 'INFERRED':
      return 'Address was partially inferred';
    case 'CORRECTED':
      return 'Address was automatically corrected';
    case 'VALIDATION_UNAVAILABLE':
      return 'Validation service unavailable';
    default:
      return 'Address validation pending';
  }
}

/**
 * Get validation warning messages for display
 */
export function getValidationWarnings(validation?: AddressValidation): string[] {
  if (!validation) return [];
  
  const warnings: string[] = [];
  
  if (validation.missingSubpremise) {
    warnings.push('This address may need a unit or apartment number');
  }
  
  if (validation.hasUnconfirmedComponents) {
    warnings.push('Some parts of this address could not be verified');
  }
  
  if (validation.addressInferred) {
    warnings.push('Parts of this address were inferred - please verify');
  }
  
  // DPV confirmation warnings
  if (validation.dpvConfirmation) {
    switch (validation.dpvConfirmation) {
      case 'N':
        warnings.push('Address could not be confirmed as a valid delivery point');
        break;
      case 'D':
        warnings.push('Address is missing secondary information (apt/unit)');
        break;
      case 'S':
        warnings.push('Address matched but secondary info could not be verified');
        break;
    }
  }
  
  return warnings;
}

export const addressValidationService = {
  validateAddress,
  validateAddressLegacy,
  validateJobAddress,
  applyCorrectedAddress,
  getValidationStatusMessage,
  getValidationWarnings,
  toAddressValidation,
};
