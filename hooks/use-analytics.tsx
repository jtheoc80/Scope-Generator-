'use client';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '@/lib/analytics';

export const usePageTracking = () => {
  const [location] = useLocation();

  useEffect(() => {
    trackPageView(location);
  }, [location]);
};
