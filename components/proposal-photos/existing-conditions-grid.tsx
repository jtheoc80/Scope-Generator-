'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { X, ZoomIn } from 'lucide-react';
import type { ProposalPhoto } from './types';
import { generatePhotoCaption } from './types';

interface ExistingConditionsGridProps {
  photos: ProposalPhoto[];
  className?: string;
  /** Max photos to display in grid (default 6) */
  maxPhotos?: number;
}

/**
 * Grid display for existing conditions photos (2-6 photos).
 * 3 across on desktop, 2 across on mobile.
 * Each photo has a short caption.
 */
export function ExistingConditionsGrid({
  photos,
  className,
  maxPhotos = 6,
}: ExistingConditionsGridProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<ProposalPhoto | null>(null);
  
  const displayPhotos = photos.slice(0, maxPhotos);
  
  if (displayPhotos.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn('mb-8', className)}>
        <h2 className="text-lg font-heading font-bold text-white bg-slate-900 px-3 py-1 inline-block mb-4">
          Existing Conditions
        </h2>
        
        {/* Photo grid: 3 across on desktop, 2 across on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {displayPhotos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <Image
                src={photo.url}
                alt={generatePhotoCaption(photo)}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
              
              {/* Caption overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                <p className="text-white text-xs md:text-sm font-medium truncate">
                  {generatePhotoCaption(photo)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div 
            className="relative max-w-4xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={lightboxPhoto.url}
                alt={generatePhotoCaption(lightboxPhoto)}
                width={1200}
                height={900}
                className="object-contain w-full h-auto max-h-[80vh] rounded-lg"
              />
            </div>
            
            {/* Caption */}
            <p className="text-white text-center mt-4 text-lg">
              {generatePhotoCaption(lightboxPhoto)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default ExistingConditionsGrid;
