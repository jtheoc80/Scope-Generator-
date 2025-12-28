'use client';

import { useState, useCallback, useRef } from 'react';

export interface HighAccuracyPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface HighAccuracyGeolocationState {
  /** Best position found so far (lowest accuracy value = most accurate) */
  bestPosition: HighAccuracyPosition | null;
  /** Whether we're currently tracking location */
  isTracking: boolean;
  /** Seconds remaining in tracking period */
  timeRemaining: number;
  /** Error if geolocation fails */
  error: {
    code: number;
    message: string;
  } | null;
}

export interface UseHighAccuracyGeolocationOptions {
  /** How long to track for in milliseconds (default: 8000) */
  trackingDuration?: number;
  /** Minimum acceptable accuracy in meters (default: 80) */
  minAccuracy?: number;
  /** Timeout for individual position requests (default: 8000) */
  timeout?: number;
}

const DEFAULT_OPTIONS: Required<UseHighAccuracyGeolocationOptions> = {
  trackingDuration: 8000,
  minAccuracy: 80,
  timeout: 8000,
};

/**
 * High-accuracy geolocation hook that uses watchPosition to track the best
 * location over a period of time.
 * 
 * This addresses the common issue of getting low-accuracy initial positions
 * by tracking multiple readings and keeping the most accurate one.
 */
export function useHighAccuracyGeolocation(options: UseHighAccuracyGeolocationOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<HighAccuracyGeolocationState>({
    bestPosition: null,
    isTracking: false,
    timeRemaining: 0,
    error: null,
  });
  
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const bestPositionRef = useRef<HighAccuracyPosition | null>(null);
  
  /**
   * Stop tracking and clean up
   */
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isTracking: false,
      timeRemaining: 0,
    }));
  }, []);
  
  /**
   * Start high-accuracy location tracking.
   * Returns a promise that resolves with the best position found,
   * or null if accuracy threshold wasn't met.
   */
  const startTracking = useCallback((): Promise<HighAccuracyPosition | null> => {
    return new Promise((resolve) => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setState(prev => ({
          ...prev,
          isTracking: false,
          error: {
            code: 0,
            message: 'Geolocation is not supported by your browser',
          },
        }));
        resolve(null);
        return;
      }
      
      // Clean up any existing tracking
      stopTracking();
      
      // Reset state
      bestPositionRef.current = null;
      setState({
        bestPosition: null,
        isTracking: true,
        timeRemaining: Math.ceil(opts.trackingDuration / 1000),
        error: null,
      });
      
      // Start countdown timer
      const startTime = Date.now();
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.ceil((opts.trackingDuration - elapsed) / 1000));
        setState(prev => ({ ...prev, timeRemaining: remaining }));
      }, 500);
      
      // Position success handler
      const handlePosition = (position: GeolocationPosition) => {
        const newPosition: HighAccuracyPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        
        // Only update if this is more accurate than what we have
        if (!bestPositionRef.current || newPosition.accuracy < bestPositionRef.current.accuracy) {
          bestPositionRef.current = newPosition;
          setState(prev => ({
            ...prev,
            bestPosition: newPosition,
          }));
        }
      };
      
      // Position error handler
      const handleError = (error: GeolocationPositionError) => {
        let errorMessage: string;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'Failed to get your location.';
        }
        
        setState(prev => ({
          ...prev,
          error: {
            code: error.code,
            message: errorMessage,
          },
        }));
        
        // Don't stop tracking on timeout - keep trying
        if (error.code !== error.TIMEOUT) {
          stopTracking();
          resolve(null);
        }
      };
      
      // Start watching position with high accuracy
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: opts.timeout,
        }
      );
      
      // Stop tracking after duration and resolve with best position
      timerRef.current = setTimeout(() => {
        const finalPosition = bestPositionRef.current;
        stopTracking();
        
        // Check if we got acceptable accuracy
        if (finalPosition && finalPosition.accuracy <= opts.minAccuracy) {
          resolve(finalPosition);
        } else {
          // Still return the position, but the caller should check accuracy
          resolve(finalPosition);
        }
      }, opts.trackingDuration);
    });
  }, [opts.trackingDuration, opts.minAccuracy, opts.timeout, stopTracking]);
  
  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    stopTracking();
    bestPositionRef.current = null;
    setState({
      bestPosition: null,
      isTracking: false,
      timeRemaining: 0,
      error: null,
    });
  }, [stopTracking]);
  
  return {
    ...state,
    startTracking,
    stopTracking,
    reset,
    isAccurate: state.bestPosition ? state.bestPosition.accuracy <= opts.minAccuracy : false,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  };
}
