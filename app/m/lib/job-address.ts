"use client";

/**
 * Job Address Types and Storage
 * 
 * This module provides the single source of truth for job address selection.
 * An address is only considered valid if it has placeId + lat/lng.
 */

// ============ TYPES ============

export type JobAddressSource = "places" | "geolocation" | "last";

export type JobAddress = {
  placeId: string;
  formatted: string;
  lat: number;
  lng: number;
  source: JobAddressSource;
  customerId?: string;
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
 * Check if a JobAddress is complete and valid
 */
export function isValidJobAddress(address: Partial<JobAddress> | null | undefined): address is JobAddress {
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
 * Save the last address for a specific customer
 */
export function saveLastAddressForCustomer(customerId: string | number, address: JobAddress): void {
  if (typeof window === "undefined") return;
  
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
 * Create a JobAddress from Google Places Autocomplete result
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
    updatedAt: Date.now(),
    street,
    city,
    state,
    zip,
  };
}

/**
 * Create a JobAddress from a reverse geocoding candidate
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
    updatedAt: Date.now(),
  };
}
