'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
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
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Attach Autocomplete once
  useEffect(() => {
    if (!isLoaded || !inputRef.current || autoRef.current) return;

    autoRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['formatted_address', 'geometry'],
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

  const useMyLocation = useCallback(async () => {
    if (!isLoaded || disabled) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const geocoder = new google.maps.Geocoder();
          const res = await geocoder.geocode({ location: { lat, lng } });

          const formatted = res.results?.[0]?.formatted_address;
          if (formatted) {
            onChangeRef.current(formatted);
          }
          if (onResolvedLatLngRef.current) {
            onResolvedLatLngRef.current(lat, lng);
          }
        } catch (err) {
          console.error('Geocoding error:', err);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        // Optionally: show toast "Allow location to prefill address"
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isLoaded, disabled]);

  if (loadError) {
    return (
      <div className="text-sm text-destructive">
        Maps failed to load. Please enter address manually.
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
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={useMyLocation}
        disabled={disabled || !isLoaded}
        title="Use my location"
        className="shrink-0"
      >
        {!isLoaded ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
