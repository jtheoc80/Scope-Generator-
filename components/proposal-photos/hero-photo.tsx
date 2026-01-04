'use client';

import { cn } from '@/lib/utils';
import type { ProposalPhoto } from './types';

interface HeroPhotoProps {
  photo: ProposalPhoto;
  /** Company logo to overlay */
  companyLogo?: string | null;
  /** Company name for alt text */
  companyName?: string;
  /** Customer name for display */
  customerName?: string;
  /** Property address */
  address?: string;
  className?: string;
}

/**
 * Hero banner photo for proposal cover.
 * Shows a wide/cropped hero shot with optional logo and customer info overlay.
 */
export function HeroPhoto({
  photo,
  companyLogo,
  companyName = 'Company',
  customerName,
  address,
  className,
}: HeroPhotoProps) {
  return (
    <div className={cn('relative w-full', className)}>
      {/* Hero image container with aspect ratio */}
      <div className="relative w-full h-48 md:h-64 lg:h-72 overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption || 'Project site overview'}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-end p-6">
          <div className="flex items-end justify-between w-full">
            {/* Customer info */}
            <div className="text-white">
              {customerName && (
                <h2 className="text-xl md:text-2xl font-bold drop-shadow-lg">
                  {customerName}
                </h2>
              )}
              {address && (
                <p className="text-sm md:text-base text-white/90 drop-shadow-md mt-1">
                  {address}
                </p>
              )}
            </div>
            
            {/* Company logo */}
            {companyLogo && (
              <div className="bg-white/95 rounded-lg p-2 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companyLogo}
                  alt={`${companyName} logo`}
                  className="w-auto h-8 md:h-10 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroPhoto;
