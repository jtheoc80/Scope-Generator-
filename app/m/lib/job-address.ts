"use client";

/**
 * Job Address Types and Storage
 * 
 * This module provides the single source of truth for job address selection.
 * An address is only considered valid if it has placeId + lat/lng + validated.
 * 
 * Flow:
 * 1. User selects from Places Autocomplete suggestions
 * 2. Fetch Place Details by place_id to get address_components + geometry
 * 3. Parse address_components into structured fields
 * 4. Call Address Validation API with structured fields
 * 5. Store normalized JobAddress with verdict
 */

// ============ TYPES ============

export type JobAddressSource = "places" | "last";

/**
 * Parsed address components from Google Places
 */
export type AddressComponents = {
  /** Street number + route combined (e.g., "123 Main St") */
  line1: string;
  /** Unit/apt/suite number if present */
  line2?: string;
  /** City (locality) */
  city: string;
  /** State (administrative_area_level_1, short_name) */
  state: string;
  /** ZIP code (postal_code) */
  postalCode: string;
  /** ZIP+4 suffix if present */
  postalCodeSuffix?: string;
};

/**
 * Address Validation verdict from Google Address Validation API
 */
export type AddressVerdict = {
  /** How precisely the address was validated (PREMISE, SUB_PREMISE, ROUTE, OTHER) */
  validationGranularity: string;
  /** How precisely the location was geocoded */
  geocodeGranularity: string;
  /** Whether the address is complete */
  addressComplete: boolean;
  /** Whether there are components that couldn't be confirmed */
  hasUnconfirmedComponents: boolean;
  /** Whether components were replaced/corrected */
  hasReplacedComponents?: boolean;
  /** Types of components that were unconfirmed */
  unconfirmedComponentTypes?: string[];
};

/**
 * Address Validation result from Google Address Validation API (legacy + new)
 */
export type AddressValidation = {
  /** Validation verdict (CONFIRMED, UNCONFIRMED, etc.) - legacy field */
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
  /** New: detailed verdict object */
  verdictDetails?: AddressVerdict;
};

/**
 * JobAddress - Single source of truth for selected job addresses.
 * Never render a "selected address" unless placeId + lat/lng + validated exist.
 */
export type JobAddress = {
  /** Google Place ID - primary identifier */
  placeId: string;
  /** Original input text from user */
  inputText?: string;
  /** Formatted address from Google Places Place Details */
  placesFormattedAddress?: string;
  /** Validated/standardized formatted address (display this one) */
  formatted: string;
  /** Latitude from Place Details geometry */
  lat: number;
  /** Longitude from Place Details geometry */
  lng: number;
  /** Source of the address */
  source: JobAddressSource;
  /** Associated customer ID */
  customerId?: string;
  /** Whether the address has been validated through Address Validation API */
  validated: boolean;
  /** Validation details from Address Validation API */
  validation?: AddressValidation;
  /** Timestamp of last update */
  updatedAt: number;
  /** Parsed address components */
  components?: AddressComponents;
  /** Validation warnings to display to user */
  warnings?: string[];
  // Legacy fields for backwards compatibility
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
};

// NOTE: Geolocation-based address selection has been removed. We rely solely on Google Places.

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
 * Parse address_components from Google Places Place Details into structured fields.
 * This is the canonical way to extract address parts from a Place Details response.
 * 
 * @param addressComponents - Array of address components from Place Details
 * @returns Parsed AddressComponents or null if required fields are missing
 */
export function parseAddressComponents(
  addressComponents: google.maps.GeocoderAddressComponent[] | undefined
): AddressComponents | null {
  if (!addressComponents || addressComponents.length === 0) {
    return null;
  }
  
  let streetNumber = "";
  let route = "";
  let subpremise = "";
  let city = "";
  let state = "";
  let postalCode = "";
  let postalCodeSuffix = "";
  
  for (const component of addressComponents) {
    const types = component.types;
    const longName = component.long_name;
    const shortName = component.short_name;
    
    if (types.includes("street_number")) {
      streetNumber = longName;
    } else if (types.includes("route")) {
      route = longName;
    } else if (types.includes("subpremise")) {
      // Unit, apt, suite number
      subpremise = longName;
    } else if (types.includes("locality")) {
      city = longName;
    } else if (types.includes("sublocality_level_1") && !city) {
      // Fallback for areas like NYC boroughs
      city = longName;
    } else if (types.includes("administrative_area_level_1")) {
      state = shortName; // Use short name for state (e.g., "CA" not "California")
    } else if (types.includes("postal_code")) {
      postalCode = longName;
    } else if (types.includes("postal_code_suffix")) {
      postalCodeSuffix = longName;
    }
  }
  
  // Build line1 from street number + route
  const line1 = streetNumber && route 
    ? `${streetNumber} ${route}` 
    : route || streetNumber;
  
  // Require at minimum line1, city, state, and postal code
  if (!line1 || !city || !state || !postalCode) {
    return null;
  }
  
  return {
    line1,
    line2: subpremise || undefined,
    city,
    state,
    postalCode,
    postalCodeSuffix: postalCodeSuffix || undefined,
  };
}

/**
 * Create a JobAddress from Google Places Place Details result.
 * Note: The address is NOT validated yet - must call validateAddress() after.
 * 
 * @param place - Place Details result from Google Places API
 * @param inputText - Original input text from user
 * @param source - Source of the address selection
 */
export function createJobAddressFromPlace(
  place: google.maps.places.PlaceResult,
  inputText?: string,
  source: JobAddressSource = "places"
): JobAddress | null {
  const placeId = place.place_id;
  const formatted = place.formatted_address;
  const geometry = place.geometry;
  
  if (!placeId || !formatted || !geometry?.location) {
    return null;
  }
  
  // Get lat/lng - Google Maps API always provides these as functions
  const latValue = geometry.location.lat();
  const lngValue = geometry.location.lng();
  
  // Parse address components into structured fields
  const components = parseAddressComponents(place.address_components);
  
  // Legacy extraction for backwards compatibility
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
    inputText,
    placesFormattedAddress: formatted,
    formatted, // Will be replaced with validated address if different
    lat: latValue,
    lng: lngValue,
    source,
    components: components || undefined,
    validated: false, // Must be validated via Address Validation API
    updatedAt: Date.now(),
    // Legacy fields
    street,
    city,
    state,
    zip,
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
