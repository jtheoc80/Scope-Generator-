'use client';

import { useState, useCallback } from 'react';
import { useGeolocation, GeolocationCoords, UseGeolocationOptions } from './useGeolocation';
import { 
  reverseGeocode, 
  ReverseGeocodeResult, 
  AddressComponents 
} from '@/lib/services/geocodingService';

export interface LocationToAddressState {
  // Geolocation state
  coords: GeolocationCoords | null;
  // Address state
  address: ReverseGeocodeResult | null;
  allAddresses: ReverseGeocodeResult[] | null;
  // Loading states
  isGettingLocation: boolean;
  isGettingAddress: boolean;
  isLoading: boolean;
  // Error state
  error: {
    type: 'geolocation' | 'geocoding';
    code: string | number;
    message: string;
  } | null;
}

export interface UseLocationToAddressOptions extends UseGeolocationOptions {
  /** Whether to automatically get the address after getting location */
  autoGeocode?: boolean;
}

/**
 * Combined hook that gets the user's location and converts it to a formatted address.
 * 
 * @param options - Configuration options for geolocation and behavior
 * @returns State and functions for location-to-address conversion
 * 
 * @example
 * ```tsx
 * function AddressForm() {
 *   const {
 *     address,
 *     isLoading,
 *     error,
 *     getLocationAndAddress,
 *   } = useLocationToAddress();
 * 
 *   return (
 *     <div>
 *       <button onClick={getLocationAndAddress} disabled={isLoading}>
 *         {isLoading ? 'Getting address...' : 'Use My Location'}
 *       </button>
 *       
 *       {error && <p className="text-red-500">{error.message}</p>}
 *       
 *       {address && (
 *         <input 
 *           type="text" 
 *           value={address.formattedAddress} 
 *           readOnly 
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLocationToAddress(options: UseLocationToAddressOptions = {}) {
  const { autoGeocode = true, ...geolocationOptions } = options;
  
  const {
    coords,
    isLoading: isGettingLocation,
    error: geolocationError,
    getCurrentPosition,
    isSupported,
  } = useGeolocation(geolocationOptions);

  const [addressState, setAddressState] = useState<{
    address: ReverseGeocodeResult | null;
    allAddresses: ReverseGeocodeResult[] | null;
    isLoading: boolean;
    error: { code: string; message: string } | null;
  }>({
    address: null,
    allAddresses: null,
    isLoading: false,
    error: null,
  });

  /**
   * Get the address for specific coordinates
   */
  const getAddressFromCoords = useCallback(async (latitude: number, longitude: number) => {
    setAddressState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    const result = await reverseGeocode(latitude, longitude);

    if (result.success && result.data) {
      setAddressState({
        address: result.data,
        allAddresses: result.allResults || null,
        isLoading: false,
        error: null,
      });
      return result.data;
    } else {
      setAddressState({
        address: null,
        allAddresses: null,
        isLoading: false,
        error: result.error || { code: 'UNKNOWN', message: 'Failed to get address' },
      });
      return null;
    }
  }, []);

  /**
   * Get the current location and then convert it to an address
   */
  const getLocationAndAddress = useCallback(async () => {
    return new Promise<ReverseGeocodeResult | null>((resolve) => {
      // Reset address state
      setAddressState({
        address: null,
        allAddresses: null,
        isLoading: false,
        error: null,
      });

      // Check if geolocation is supported
      if (!isSupported) {
        resolve(null);
        return;
      }

      // Create a custom position handler that also gets the address
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Start address lookup
          setAddressState(prev => ({
            ...prev,
            isLoading: true,
          }));

          const result = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );

          if (result.success && result.data) {
            setAddressState({
              address: result.data,
              allAddresses: result.allResults || null,
              isLoading: false,
              error: null,
            });
            resolve(result.data);
          } else {
            setAddressState({
              address: null,
              allAddresses: null,
              isLoading: false,
              error: result.error || { code: 'UNKNOWN', message: 'Failed to get address' },
            });
            resolve(null);
          }
        },
        (error) => {
          // Geolocation error - don't set address error, the geolocation hook handles this
          resolve(null);
        },
        {
          enableHighAccuracy: geolocationOptions.enableHighAccuracy ?? true,
          timeout: geolocationOptions.timeout ?? 10000,
          maximumAge: geolocationOptions.maximumAge ?? 0,
        }
      );

      // Also trigger the geolocation hook to update its state
      getCurrentPosition();
    });
  }, [getCurrentPosition, isSupported, geolocationOptions]);

  /**
   * Clear all state
   */
  const reset = useCallback(() => {
    setAddressState({
      address: null,
      allAddresses: null,
      isLoading: false,
      error: null,
    });
  }, []);

  /**
   * Clear just the error
   */
  const clearError = useCallback(() => {
    setAddressState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Combine error states
  const combinedError = geolocationError
    ? {
        type: 'geolocation' as const,
        code: geolocationError.code,
        message: geolocationError.message,
      }
    : addressState.error
    ? {
        type: 'geocoding' as const,
        code: addressState.error.code,
        message: addressState.error.message,
      }
    : null;

  return {
    // Geolocation state
    coords,
    isGettingLocation,
    
    // Address state
    address: addressState.address,
    allAddresses: addressState.allAddresses,
    isGettingAddress: addressState.isLoading,
    
    // Combined state
    isLoading: isGettingLocation || addressState.isLoading,
    error: combinedError,
    
    // Functions
    getLocationAndAddress,
    getAddressFromCoords,
    getCurrentPosition,
    reset,
    clearError,
    
    // Support check
    isSupported,
  };
}

// Re-export types for convenience
export type { GeolocationCoords, ReverseGeocodeResult, AddressComponents };
