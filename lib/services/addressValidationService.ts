/**
 * Address Validation Service
 * 
 * Client-side service for validating addresses through Google Address Validation API.
 * The actual API call is made server-side to keep the API key secure.
 */

import type { AddressValidation, JobAddress } from '@/app/m/lib/job-address';

export interface AddressValidationResponse {
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
 * Validate an address using Google Address Validation API.
 * 
 * @param address - The formatted address string to validate
 * @param placeId - Optional Google Place ID for additional context
 * @param lat - Optional latitude
 * @param lng - Optional longitude
 * @returns Promise containing validation results
 * 
 * @example
 * ```ts
 * const result = await validateAddress("123 Main St, San Francisco, CA 94102");
 * if (result.success && result.validation) {
 *   if (result.validation.correctedFormatted) {
 *     // Offer to use the standardized address
 *   }
 *   if (result.validation.missingSubpremise) {
 *     // Warn user that unit number might be needed
 *   }
 * }
 * ```
 */
export async function validateAddress(
  address: string,
  placeId?: string,
  lat?: number,
  lng?: number
): Promise<AddressValidationResponse> {
  try {
    const response = await fetch('/api/address/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        placeId,
        lat,
        lng,
      }),
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
    correctedFormatted: apiValidation.correctedFormatted || undefined,
    granularity: apiValidation.granularity,
    addressInferred: apiValidation.addressInferred,
  };
}

/**
 * Validate a JobAddress and return an updated version with validation data.
 * This is the main function to call after selecting an address.
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
  error?: string;
}> {
  const result = await validateAddress(
    jobAddress.formatted,
    jobAddress.placeId,
    jobAddress.lat,
    jobAddress.lng
  );

  if (!result.success || !result.validation) {
    // If validation fails, still mark as validated but with warning
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
      error: result.error?.message,
    };
  }

  const validation = toAddressValidation(result.validation);
  
  // Check if we have a corrected address that differs
  const needsCorrection = !!(
    validation.correctedFormatted &&
    validation.correctedFormatted.toLowerCase().trim() !== 
    jobAddress.formatted.toLowerCase().trim()
  );

  // Check for warnings
  const hasWarnings = !!(
    validation.hasUnconfirmedComponents ||
    validation.missingSubpremise ||
    validation.addressInferred
  );

  return {
    address: {
      ...jobAddress,
      validated: true,
      validation,
      updatedAt: Date.now(),
    },
    needsCorrection,
    hasWarnings,
  };
}

/**
 * Apply a corrected address from validation
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
    updatedAt: Date.now(),
  };
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
  validateJobAddress,
  applyCorrectedAddress,
  getValidationStatusMessage,
  getValidationWarnings,
  toAddressValidation,
};
