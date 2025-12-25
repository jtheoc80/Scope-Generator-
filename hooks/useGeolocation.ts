'use client';

import { useState, useCallback } from 'react';

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface GeolocationState {
  coords: GeolocationCoords | null;
  timestamp: number | null;
  isLoading: boolean;
  error: GeolocationError | null;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/**
 * Custom hook to get the user's current geolocation using the browser's Geolocation API.
 * 
 * @param options - Optional configuration for the Geolocation API
 * @returns Geolocation state and a function to request the current position
 * 
 * @example
 * ```tsx
 * const { coords, isLoading, error, getCurrentPosition } = useGeolocation();
 * 
 * const handleGetLocation = () => {
 *   getCurrentPosition();
 * };
 * 
 * if (coords) {
 *   console.log(`Latitude: ${coords.latitude}, Longitude: ${coords.longitude}`);
 * }
 * ```
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    timestamp: null,
    isLoading: false,
    error: null,
  });

  const getCurrentPosition = useCallback(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: {
          code: 0,
          message: 'Geolocation is not supported by your browser',
        },
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    const mergedOptions = { ...defaultOptions, ...options };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          },
          timestamp: position.timestamp,
          isLoading: false,
          error: null,
        });
      },
      (error) => {
        let errorMessage: string;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting your location.';
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: {
            code: error.code,
            message: errorMessage,
          },
        }));
      },
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    );
  }, [options]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      coords: null,
      timestamp: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    getCurrentPosition,
    clearError,
    reset,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  };
}
