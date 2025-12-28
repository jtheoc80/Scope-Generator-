'use client';

import React, { useEffect, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Libraries must be defined outside component to avoid re-renders
const libraries: ('places')[] = ['places'];

type Props = {
  value: string;
  onChange: (val: string) => void;
  onResolvedLatLng?: (lat: number, lng: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'data-testid'?: string;
};

export default function JobAddressField({ 
  value, 
  onChange, 
  onResolvedLatLng,
  placeholder = '123 Main St, City, State',
  className,
  disabled,
  'data-testid': testId,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);
  const onResolvedLatLngRef = useRef(onResolvedLatLng);

  // Keep refs updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onResolvedLatLngRef.current = onResolvedLatLng;
  }, [onResolvedLatLng]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Attach Autocomplete once
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autoRef.current) return;

    autoRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['place_id', 'formatted_address', 'geometry'],
      componentRestrictions: { country: 'us' }, // Restrict to US addresses
    });

    autoRef.current.addListener('place_changed', () => {
      const place = autoRef.current?.getPlace();
      const formatted = place?.formatted_address ?? '';
      
      // Update the controlled input value
      if (formatted) {
        onChangeRef.current(formatted);
      }

      // Provide lat/lng if callback is given
      const loc = place?.geometry?.location;
      if (loc && onResolvedLatLngRef.current) {
        onResolvedLatLngRef.current(loc.lat(), loc.lng());
      }
    });

    // Cleanup on unmount
    return () => {
      if (autoRef.current) {
        google.maps.event.clearInstanceListeners(autoRef.current);
        autoRef.current = null;
      }
    };
  }, [isLoaded]);

  if (loadError) {
    return (
      <div className="text-sm text-destructive">
        Address autocomplete failed to load. Please refresh and try again.
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="street-address"
        disabled={disabled || !isLoaded}
        data-testid={testId}
        className="flex-1"
      />
    </div>
  );
}
