'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, ZoomIn } from 'lucide-react';
import type { ProposalPhoto } from './types';
import { generatePhotoCaption } from './types';

interface ScopePhotoInlineProps {
  photos: ProposalPhoto[];
  className?: string;
  /** Display variant */
  variant?: 'single' | 'pair';
}

/**
 * Inline photo display for scope sections.
 * Shows 1-2 photos relevant to the specific scope item.
 */
export function ScopePhotoInline({
  photos,
  className,
  variant = 'single',
}: ScopePhotoInlineProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<ProposalPhoto | null>(null);
  
  const displayPhotos = variant === 'pair' ? photos.slice(0, 2) : photos.slice(0, 1);
  
  if (displayPhotos.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn(
        'my-3',
        variant === 'pair' ? 'grid grid-cols-2 gap-2' : '',
        className
      )}>
        {displayPhotos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setLightboxPhoto(photo)}
            className={cn(
              'group relative overflow-hidden rounded-lg bg-slate-100 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2',
              variant === 'single' ? 'aspect-video w-full max-w-md' : 'aspect-[4/3]'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={generatePhotoCaption(photo)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
            
            {/* Caption */}
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-4">
                <p className="text-white text-xs font-medium truncate">
                  {photo.caption}
                </p>
              </div>
            )}
          </button>
        ))}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxPhoto.url}
              alt={generatePhotoCaption(lightboxPhoto)}
              className="object-contain w-full h-auto max-h-[80vh] rounded-lg"
              loading="eager"
              decoding="async"
            />
            
            {lightboxPhoto.caption && (
              <p className="text-white text-center mt-4 text-lg">
                {lightboxPhoto.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ScopePhotoInline;
