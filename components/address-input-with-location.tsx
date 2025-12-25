'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { useLocationToAddress } from '@/hooks/useLocationToAddress';
import { cn } from '@/lib/utils';

interface AddressInputWithLocationProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

/**
 * Address input field with a "Use My Location" button that uses the browser's
 * Geolocation API to get the user's current position and converts it to an address
 * using Google's Geocoding API.
 */
export function AddressInputWithLocation({
  value,
  onChange,
  placeholder = 'Enter address',
  className,
  inputClassName,
  disabled,
  'data-testid': dataTestId,
}: AddressInputWithLocationProps) {
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const {
    isLoading,
    error,
    getLocationAndAddress,
    isSupported,
  } = useLocationToAddress();

  const handleGetLocation = async () => {
    setLocationError(null);
    
    const result = await getLocationAndAddress();
    
    if (result?.formattedAddress) {
      onChange(result.formattedAddress);
    } else if (error) {
      setLocationError(error.message);
    }
  };

  // Clear error when user starts typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationError(null);
    onChange(e.target.value);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn('flex-1', inputClassName)}
          disabled={disabled || isLoading}
          data-testid={dataTestId}
        />
        {isSupported && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGetLocation}
            disabled={disabled || isLoading}
            title="Use my current location"
            data-testid={dataTestId ? `${dataTestId}-location-btn` : 'location-btn'}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {(locationError || error) && (
        <p className="text-sm text-destructive">
          {locationError || error?.message}
        </p>
      )}
    </div>
  );
}
