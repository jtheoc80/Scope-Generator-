import { NextRequest, NextResponse } from 'next/server';

interface GoogleGeocodingResult {
  formatted_address: string;
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    location_type: string;
  };
  place_id: string;
  types: string[];
}

interface GoogleGeocodingResponse {
  results: GoogleGeocodingResult[];
  status: string;
  error_message?: string;
}

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
  types: string[];
  lat: number;
  lng: number;
}

/**
 * Extract address components from Google's geocoding result
 */
function extractAddressComponents(components: GoogleGeocodingResult['address_components']): AddressComponents {
  const result: AddressComponents = {};

  for (const component of components) {
    const types = component.types;

    if (types.includes('street_number')) {
      result.streetNumber = component.long_name;
    }
    if (types.includes('route')) {
      result.street = component.long_name;
    }
    if (types.includes('locality')) {
      result.city = component.long_name;
    }
    if (types.includes('administrative_area_level_2')) {
      result.county = component.long_name;
    }
    if (types.includes('administrative_area_level_1')) {
      result.state = component.long_name;
      result.stateCode = component.short_name;
    }
    if (types.includes('country')) {
      result.country = component.long_name;
      result.countryCode = component.short_name;
    }
    if (types.includes('postal_code')) {
      result.postalCode = component.long_name;
    }
    if (types.includes('neighborhood') || types.includes('sublocality')) {
      result.neighborhood = component.long_name;
    }
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    // Validate input
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Latitude and longitude must be numbers',
          }
        },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_LATITUDE',
            message: 'Latitude must be between -90 and 90',
          }
        },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_LONGITUDE',
            message: 'Longitude must be between -180 and 180',
          }
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY is not configured');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFIG_ERROR',
            message: 'Geocoding service is not configured. Please contact support.',
          }
        },
        { status: 500 }
      );
    }

    // Call Google Geocoding API
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${latitude},${longitude}`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('result_type', 'street_address|premise|subpremise|route');

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error('Google Geocoding API HTTP error:', response.status);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'API_ERROR',
            message: 'Failed to communicate with geocoding service',
          }
        },
        { status: 502 }
      );
    }

    const data: GoogleGeocodingResponse = await response.json();

    // Handle Google API status codes
    switch (data.status) {
      case 'OK':
        if (data.results.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NO_RESULTS',
                message: 'No address found for these coordinates',
              }
            },
            { status: 404 }
          );
        }

        // Use the first (most specific) result
        const result = data.results[0];
        const addressComponents = extractAddressComponents(result.address_components);

        const geocodeResult: ReverseGeocodeResult = {
          formattedAddress: result.formatted_address,
          components: addressComponents,
          placeId: result.place_id,
          locationType: result.geometry.location_type,
          types: result.types,
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        };

        return NextResponse.json({
          success: true,
          data: geocodeResult,
          // Include all results in case the client wants to choose a different one
          allResults: data.results.map(r => ({
            formattedAddress: r.formatted_address,
            components: extractAddressComponents(r.address_components),
            placeId: r.place_id,
            locationType: r.geometry.location_type,
            types: r.types,
            lat: r.geometry.location.lat,
            lng: r.geometry.location.lng,
          })),
        });

      case 'ZERO_RESULTS':
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_RESULTS',
              message: 'No address found for these coordinates',
            }
          },
          { status: 404 }
        );

      case 'OVER_QUERY_LIMIT':
        console.error('Google Geocoding API quota exceeded');
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'QUOTA_EXCEEDED',
              message: 'Geocoding service quota exceeded. Please try again later.',
            }
          },
          { status: 429 }
        );

      case 'REQUEST_DENIED':
        console.error('Google Geocoding API request denied:', data.error_message);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'REQUEST_DENIED',
              message: 'Geocoding request was denied. Please contact support.',
            }
          },
          { status: 403 }
        );

      case 'INVALID_REQUEST':
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Invalid geocoding request',
            }
          },
          { status: 400 }
        );

      default:
        console.error('Unknown Google Geocoding API status:', data.status);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNKNOWN_ERROR',
              message: 'An unexpected error occurred',
            }
          },
          { status: 500 }
        );
    }
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred while processing your request',
        }
      },
      { status: 500 }
    );
  }
}
