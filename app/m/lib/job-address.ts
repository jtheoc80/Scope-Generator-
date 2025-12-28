"use client";

/**
 * Job Address Types and Storage
 * 
 * This module provides the single source of truth for job address selection.
 * An address is only considered valid if it has placeId + lat/lng + validated.
 */

// ============ TYPES ============

export type JobAddressSource = "places" | "geolocation" | "last";

/**
 * Address Validation result from Google Address Validation API
 */
export type AddressValidation = {
  /** Validation verdict (CONFIRMED, UNCONFIRMED, etc.) */
  verdict?: string;
  /** Whether there are unconfirmed address components */
  hasUnconfirmedComponents?: boolean;
  /** Whether a subpremise (unit/apt) might be missing */
  missingSubpremise?: boolean;
  /** USPS DPV confirmation status (Y, N, S, D, empty) */
  dpvConfirmation?: string;
  /** Corrected/standardized formatted address from USPS */
  correctedFormatted?: string;
  /** Address granularity from API */
  granularity?: string;
  /** Whether the address was inferred vs exact match */
  addressInferred?: boolean;
};

/**
 * JobAddress - Single source of truth for selected job addresses.
 * Never render a "selected address" unless placeId + lat/lng + validated exist.
 */
export type JobAddress = {
  placeId: string;
  formatted: string;
  lat: number;
  lng: number;
  source: JobAddressSource;
  customerId?: string;
  /** Whether the address has been validated through Address Validation API */
  validated: boolean;
  /** Validation details from Address Validation API */
  validation?: AddressValidation;
  updatedAt: number;
  // Additional address components for display
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export type GeolocationCandidate = {
  placeId: string;
  formatted: string;
  lat: number;
  lng: number;
  types: string[];
  locationType: string;
};

// Storage key for customer-scoped last addresses
const LAST_ADDRESS_PREFIX = "lastAddress:";

// ============ VALIDATION ============

/**
 * Check if a JobAddress has basic required fields (placeId + lat/lng)
 * This is the minimum for considering an address "selected"
 */
export function hasRequiredAddressFields(address: Partial<JobAddress> | null | undefined): boolean {
  if (!address) return false;
  return (
    typeof address.placeId === "string" &&
    address.placeId.length > 0 &&
    typeof address.formatted === "string" &&
    address.formatted.length > 0 &&
    typeof address.lat === "number" &&
    !isNaN(address.lat) &&
    typeof address.lng === "number" &&
    !isNaN(address.lng)
  );
}

/**
 * Check if a JobAddress is complete and validated.
 * Never "lock in" an address unless we have placeId + geometry + validation verdict.
 */
export function isValidJobAddress(address: Partial<JobAddress> | null | undefined): address is JobAddress {
  if (!hasRequiredAddressFields(address)) return false;
  // For full validity, address must be validated
  return address!.validated === true;
}

/**
 * Check if a JobAddress is selectable (has placeId + lat/lng) but may need validation
 */
export function isSelectableJobAddress(address: Partial<JobAddress> | null | undefined): address is JobAddress {
  return hasRequiredAddressFields(address);
}

// ============ CUSTOMER-SCOPED STORAGE ============

/**
 * Get the last address for a specific customer
 */
export function getLastAddressForCustomer(customerId: string | number): JobAddress | null {
  if (typeof window === "undefined") return null;
  
  try {
    const key = `${LAST_ADDRESS_PREFIX}${customerId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    if (isValidJobAddress(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save the last address for a specific customer.
 * Only saves validated addresses to ensure quality.
 */
export function saveLastAddressForCustomer(customerId: string | number, address: JobAddress): void {
  if (typeof window === "undefined") return;
  
  // Only save addresses that have been validated
  if (!address.validated) {
    console.warn("Attempted to save non-validated address for customer - skipping");
    return;
  }
  
  try {
    const key = `${LAST_ADDRESS_PREFIX}${customerId}`;
    const toSave: JobAddress = {
      ...address,
      customerId: String(customerId),
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(toSave));
  } catch (e) {
    console.error("Failed to save last address for customer:", e);
  }
}

/**
 * Clear the last address for a specific customer
 */
export function clearLastAddressForCustomer(customerId: string | number): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = `${LAST_ADDRESS_PREFIX}${customerId}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error("Failed to clear last address for customer:", e);
  }
}

// ============ CONVERSION HELPERS ============

/**
 * Create a JobAddress from Google Places Autocomplete result.
 * Note: The address is NOT validated yet - must call validateAddress() after.
 */
export function createJobAddressFromPlace(
  place: google.maps.places.PlaceResult,
  source: JobAddressSource = "places"
): JobAddress | null {
  const placeId = place.place_id;
  const formatted = place.formatted_address;
  const geometry = place.geometry;
  
  if (!placeId || !formatted || !geometry?.location) {
    return null;
  }
  
  const lat = geometry.location.lat();
  const lng = geometry.location.lng();
  
  // Extract address components
  let street: string | undefined;
  let city: string | undefined;
  let state: string | undefined;
  let zip: string | undefined;
  
  if (place.address_components) {
    for (const component of place.address_components) {
      const types = component.types;
      if (types.includes("street_number")) {
        street = component.long_name;
      } else if (types.includes("route")) {
        street = street ? `${street} ${component.long_name}` : component.long_name;
      } else if (types.includes("locality")) {
        city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        state = component.short_name;
      } else if (types.includes("postal_code")) {
        zip = component.long_name;
      }
    }
  }
  
  return {
    placeId,
    formatted,
    lat,
    lng,
    source,
    validated: false, // Must be validated via Address Validation API
    updatedAt: Date.now(),
    street,
    city,
    state,
    zip,
  };
}

/**
 * Create a JobAddress from a reverse geocoding candidate.
 * Note: The address is NOT validated yet - must call validateAddress() after.
 */
export function createJobAddressFromCandidate(
  candidate: GeolocationCandidate,
  source: JobAddressSource = "geolocation"
): JobAddress {
  return {
    placeId: candidate.placeId,
    formatted: candidate.formatted,
    lat: candidate.lat,
    lng: candidate.lng,
    source,
    validated: false, // Must be validated via Address Validation API
    updatedAt: Date.now(),
  };
}

/**
 * Apply validation result to a JobAddress
 */
export function applyValidationToAddress(
  address: JobAddress,
  validation: AddressValidation
): JobAddress {
  return {
    ...address,
    validated: true,
    validation,
    updatedAt: Date.now(),
  };
}

/**
 * Check if an address has validation warnings that should be shown to user
 */
export function hasValidationWarnings(address: JobAddress): boolean {
  if (!address.validation) return false;
  return (
    address.validation.hasUnconfirmedComponents === true ||
    address.validation.missingSubpremise === true ||
    address.validation.addressInferred === true
  );
}

/**
 * Check if address has a corrected version that differs from original
 */
export function hasCorrectedAddress(address: JobAddress): boolean {
  if (!address.validation?.correctedFormatted) return false;
  // Normalize for comparison (trim, lowercase)
  const original = address.formatted.trim().toLowerCase();
  const corrected = address.validation.correctedFormatted.trim().toLowerCase();
  return original !== corrected;
}
