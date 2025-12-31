'use client';

import React, { useEffect, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from '@/lib/google-maps-config';

type Props = {
  value: string;
  onChange: (val: string) => void;
  onResolvedLatLng?: (lat: number, lng: number) => void;
  onResolvedPlace?: (place: {
    placeId: string;
    formattedAddress: string;
    lat: number;
    lng: number;
  }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'data-testid'?: string;
};

export default function JobAddressField({ 
  value, 
  onChange, 
  onResolvedLatLng,
  onResolvedPlace,
  placeholder = '123 Main St, City, State',
  className,
  disabled,
  'data-testid': testId,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);
  const onResolvedLatLngRef = useRef(onResolvedLatLng);
  const onResolvedPlaceRef = useRef(onResolvedPlace);

  // Keep refs updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onResolvedLatLngRef.current = onResolvedLatLng;
  }, [onResolvedLatLng]);

  useEffect(() => {
    onResolvedPlaceRef.current = onResolvedPlace;
  }, [onResolvedPlace]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
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
      const placeId = place?.place_id ?? '';
      
      // Update the controlled input value
      if (formatted) {
        onChangeRef.current(formatted);
      }

      // Provide lat/lng if callback is given
      const loc = place?.geometry?.location;
      if (loc && onResolvedLatLngRef.current) {
        onResolvedLatLngRef.current(loc.lat(), loc.lng());
      }

      // Provide full place details if callback is given
      if (loc && placeId && formatted && onResolvedPlaceRef.current) {
        onResolvedPlaceRef.current({
          placeId,
          formattedAddress: formatted,
          lat: loc.lat(),
          lng: loc.lng(),
        });
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
