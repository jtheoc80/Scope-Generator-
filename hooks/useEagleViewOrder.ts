/**
 * useEagleViewOrder Hook
 * 
 * React hook for managing EagleView roof measurement orders.
 * Handles order creation, status polling, and state management.
 * 
 * Only for roofing jobs - returns null/disabled state for other trades.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type EagleViewOrderStatus = 
  | 'idle'           // No order created yet
  | 'creating'       // Creating order
  | 'queued'         // Order submitted, waiting
  | 'processing'     // EagleView is processing
  | 'completed'      // Report ready
  | 'failed'         // Error occurred
  | 'not_available'; // Not available (wrong trade, not configured, etc.)

export interface RoofingMeasurements {
  squares: number;
  roofAreaSqFt: number;
  pitchBreakdown: Array<{ pitch: string; areaSqFt: number }>;
  ridgesFt: number;
  hipsFt: number;
  valleysFt: number;
  eavesFt: number;
  rakesFt: number;
  flashingFt?: number;
  dripEdgeFt?: number;
  stepFlashingFt?: number;
  facets?: number;
  stories?: number;
  predominantPitch?: string;
}

export interface EagleViewOrderState {
  status: EagleViewOrderStatus;
  orderId: string | null;
  eagleviewOrderId: string | null;
  reportUrl: string | null;
  measurements: RoofingMeasurements | null;
  errorMessage: string | null;
  isLoading: boolean;
}

interface UseEagleViewOrderOptions {
  jobId: string;
  trade: string;
  address: string;
  enabled?: boolean;
  pollInterval?: number;
}

interface UseEagleViewOrderReturn extends EagleViewOrderState {
  createOrder: () => Promise<void>;
  refresh: () => Promise<void>;
  canCreateOrder: boolean;
  isRoofing: boolean;
}

export function useEagleViewOrder({
  jobId,
  trade,
  address,
  enabled = true,
  pollInterval = 4000,
}: UseEagleViewOrderOptions): UseEagleViewOrderReturn {
  const [state, setState] = useState<EagleViewOrderState>({
    status: 'idle',
    orderId: null,
    eagleviewOrderId: null,
    reportUrl: null,
    measurements: null,
    errorMessage: null,
    isLoading: false,
  });

  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const isPollingRef = useRef(false);

  const isRoofing = trade.toLowerCase() === 'roofing';
  const canCreateOrder = isRoofing && enabled && address.length > 10;

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  // Fetch current order status
  const fetchStatus = useCallback(async (): Promise<EagleViewOrderState | null> => {
    if (!jobId || !isRoofing) return null;

    try {
      const response = await fetch(`/api/roofing/eagleview/status?jobId=${encodeURIComponent(jobId)}`);
      
      if (response.status === 404) {
        // No order exists
        return {
          status: 'idle',
          orderId: null,
          eagleviewOrderId: null,
          reportUrl: null,
          measurements: null,
          errorMessage: null,
          isLoading: false,
        };
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to fetch status');
      }

      const data = await response.json();
      
      return {
        status: data.status as EagleViewOrderStatus,
        orderId: data.orderId,
        eagleviewOrderId: data.eagleviewOrderId,
        reportUrl: data.reportUrl || null,
        measurements: data.measurements || null,
        errorMessage: data.errorMessage || null,
        isLoading: false,
      };
    } catch (error) {
      console.error('EagleView status fetch error:', error);
      return null;
    }
  }, [jobId, isRoofing]);

  // Poll for status updates
  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    const poll = async () => {
      if (!mountedRef.current) {
        isPollingRef.current = false;
        return;
      }

      const newState = await fetchStatus();
      
      if (!mountedRef.current) {
        isPollingRef.current = false;
        return;
      }

      if (newState) {
        setState(newState);

        // Continue polling if still in progress
        if (['queued', 'processing'].includes(newState.status)) {
          pollTimeoutRef.current = setTimeout(poll, pollInterval);
        } else {
          isPollingRef.current = false;
        }
      } else {
        // Retry on error
        pollTimeoutRef.current = setTimeout(poll, pollInterval * 2);
      }
    };

    poll();
  }, [fetchStatus, pollInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  // Create a new order
  const createOrder = useCallback(async () => {
    if (!canCreateOrder) return;

    setState(prev => ({ ...prev, status: 'creating', isLoading: true, errorMessage: null }));

    try {
      const response = await fetch('/api/roofing/eagleview/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          trade: 'roofing',
          address,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to create order');
      }

      const data = await response.json();

      setState({
        status: data.status as EagleViewOrderStatus || 'queued',
        orderId: data.orderId,
        eagleviewOrderId: data.eagleviewOrderId,
        reportUrl: null,
        measurements: null,
        errorMessage: null,
        isLoading: false,
      });

      // Start polling for updates
      startPolling();
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Failed to create order',
        isLoading: false,
      }));
    }
  }, [canCreateOrder, jobId, address, startPolling]);

  // Manual refresh
  const refresh = useCallback(async () => {
    if (!isRoofing) return;

    setState(prev => ({ ...prev, isLoading: true }));
    const newState = await fetchStatus();
    
    if (newState && mountedRef.current) {
      setState(newState);

      // If in progress, start polling
      if (['queued', 'processing'].includes(newState.status)) {
        startPolling();
      }
    } else if (mountedRef.current) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isRoofing, fetchStatus, startPolling]);

  // Initial fetch on mount if roofing
  useEffect(() => {
    if (!isRoofing || !enabled) {
      setState(prev => ({ ...prev, status: 'not_available' }));
      return;
    }

    refresh();

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRoofing, enabled, jobId]);

  return {
    ...state,
    createOrder,
    refresh,
    canCreateOrder,
    isRoofing,
  };
}
