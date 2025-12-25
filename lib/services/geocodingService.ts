/**
 * Geocoding Service
 * 
 * Client-side service for interacting with the geocoding API.
 * The actual Google API call is made server-side to keep the API key secure.
 */

export interface AddressComponents {
  streetNumber?: string;
  street?: string;
  city?: string;
  county?: string;
  state?: string;
  stateCode?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
  neighborhood?: string;
}

export interface ReverseGeocodeResult {
  formattedAddress: string;
  components: AddressComponents;
  placeId: string;
  locationType: string;
}

export interface ReverseGeocodeResponse {
  success: boolean;
  data?: ReverseGeocodeResult;
  allResults?: ReverseGeocodeResult[];
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Convert latitude/longitude coordinates to a formatted address using Google's Geocoding API.
 * 
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Promise containing the address information or an error
 * 
 * @example
 * ```ts
 * const result = await reverseGeocode(37.7749, -122.4194);
 * if (result.success && result.data) {
 *   console.log(result.data.formattedAddress);
 *   // "123 Main St, San Francisco, CA 94102, USA"
 * }
 * ```
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResponse> {
  try {
    const response = await fetch('/api/geocoding/reverse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to get address from coordinates',
        },
      };
    }

    return data;
  } catch (error) {
    console.error('Error calling reverse geocoding API:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to geocoding service. Please check your internet connection.',
      },
    };
  }
}

/**
 * Format an address from its components.
 * 
 * @param components - Address components from geocoding result
 * @returns Formatted address string
 */
export function formatAddressFromComponents(components: AddressComponents): string {
  const parts: string[] = [];

  // Street address
  if (components.streetNumber && components.street) {
    parts.push(`${components.streetNumber} ${components.street}`);
  } else if (components.street) {
    parts.push(components.street);
  }

  // City
  if (components.city) {
    parts.push(components.city);
  }

  // State and postal code
  if (components.stateCode && components.postalCode) {
    parts.push(`${components.stateCode} ${components.postalCode}`);
  } else if (components.stateCode) {
    parts.push(components.stateCode);
  } else if (components.state && components.postalCode) {
    parts.push(`${components.state} ${components.postalCode}`);
  } else if (components.state) {
    parts.push(components.state);
  }

  return parts.join(', ');
}

/**
 * Get a short version of the address (street address only).
 */
export function getStreetAddress(components: AddressComponents): string {
  if (components.streetNumber && components.street) {
    return `${components.streetNumber} ${components.street}`;
  }
  return components.street || '';
}

/**
 * Get city and state from address components.
 */
export function getCityState(components: AddressComponents): string {
  const parts: string[] = [];
  
  if (components.city) {
    parts.push(components.city);
  }
  
  if (components.stateCode) {
    parts.push(components.stateCode);
  } else if (components.state) {
    parts.push(components.state);
  }
  
  return parts.join(', ');
}

export const geocodingService = {
  reverseGeocode,
  formatAddressFromComponents,
  getStreetAddress,
  getCityState,
};
