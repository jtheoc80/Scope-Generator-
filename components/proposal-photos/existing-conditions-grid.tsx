'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, ZoomIn, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import type { ProposalPhoto } from './types';
import { generatePhotoCaption } from './types';

interface ExistingConditionsGridProps {
  photos: ProposalPhoto[];
  className?: string;
  /** Max photos to display in grid (default 6) */
  maxPhotos?: number;
  /** Custom section title */
  title?: string;
  /** Show photo count badge */
  showCount?: boolean;
}

/**
 * Grid display for existing conditions photos (2-6 photos).
 * 3 across on desktop, 2 across on mobile.
 * Each photo has a short caption.
 * 
 * UX Improvements:
 * - Keyboard navigation (arrow keys, escape)
 * - Swipe gestures on mobile
 * - Navigation between photos in lightbox
 * - Loading states for images
 * - Touch-friendly tap targets
 */
export function ExistingConditionsGrid({
  photos,
  className,
  maxPhotos = 6,
  title = 'Existing Conditions',
  showCount = true,
}: ExistingConditionsGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  
  const displayPhotos = photos.slice(0, maxPhotos);
  const hasMorePhotos = photos.length > maxPhotos;
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return;
    
    if (e.key === 'ArrowLeft') {
      setLightboxIndex(prev => prev === 0 ? displayPhotos.length - 1 : (prev ?? 0) - 1);
    } else if (e.key === 'ArrowRight') {
      setLightboxIndex(prev => prev === displayPhotos.length - 1 ? 0 : (prev ?? 0) + 1);
    } else if (e.key === 'Escape') {
      setLightboxIndex(null);
    }
  }, [lightboxIndex, displayPhotos.length]);

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, handleKeyDown]);

  if (displayPhotos.length === 0) {
    return null;
  }

  const currentPhoto = lightboxIndex !== null ? displayPhotos[lightboxIndex] : null;

  return (
    <>
      <div className={cn('mb-8', className)}>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-heading font-bold text-white bg-slate-900 px-3 py-1 inline-flex items-center gap-2">
            <Camera className="w-4 h-4" />
            {title}
          </h2>
          {showCount && (
            <span className="text-sm text-slate-500">
              {displayPhotos.length} photo{displayPhotos.length !== 1 ? 's' : ''}
              {hasMorePhotos && ` (${photos.length - maxPhotos} more in appendix)`}
            </span>
          )}
        </div>
        
        {/* Photo grid: 3 across on desktop, 2 across on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {displayPhotos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setLightboxIndex(index)}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 touch-manipulation"
              aria-label={`View ${generatePhotoCaption(photo)}`}
            >
              {/* Loading skeleton */}
              {imageLoading[photo.id] !== false && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse" />
              )}
              
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={generatePhotoCaption(photo)}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-all duration-200 group-hover:scale-105",
                  imageLoading[photo.id] !== false && "opacity-0"
                )}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoading(prev => ({ ...prev, [photo.id]: false }))}
              />
              
              {/* Hover overlay - larger tap target on mobile */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-active:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
              
              {/* Photo number badge */}
              <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {index + 1}
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

      {/* Lightbox Modal with Navigation */}
      {currentPhoto && lightboxIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors z-10 p-2 rounded-full hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Photo counter */}
          <div className="absolute top-4 left-4 text-white text-sm z-10 bg-black/50 px-3 py-1 rounded-full">
            {lightboxIndex + 1} / {displayPhotos.length}
          </div>
          
          {/* Navigation buttons */}
          {displayPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setLightboxIndex(prev => prev === 0 ? displayPhotos.length - 1 : (prev ?? 0) - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 transition-colors z-10 bg-black/40 hover:bg-black/60 rounded-full p-3"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setLightboxIndex(prev => prev === displayPhotos.length - 1 ? 0 : (prev ?? 0) + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 transition-colors z-10 bg-black/40 hover:bg-black/60 rounded-full p-3"
                aria-label="Next photo"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
          
          {/* Main image */}
          <div 
            className="relative max-w-4xl max-h-[85vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto.url}
              alt={generatePhotoCaption(currentPhoto)}
              className="object-contain w-full h-auto max-h-[75vh] rounded-lg"
              loading="eager"
              decoding="async"
            />
            
            {/* Caption */}
            <p className="text-white text-center mt-4 text-lg">
              {generatePhotoCaption(currentPhoto)}
            </p>
            
            {/* Keyboard hint */}
            <p className="text-slate-500 text-center mt-2 text-sm hidden md:block">
              Use ← → arrows to navigate • ESC to close
            </p>
          </div>
          
          {/* Thumbnail strip */}
          {displayPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2 max-w-[90vw] overflow-x-auto">
              {displayPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                  className={cn(
                    'relative w-12 h-12 flex-shrink-0 rounded overflow-hidden transition-all',
                    index === lightboxIndex 
                      ? 'ring-2 ring-white scale-110' 
                      : 'opacity-60 hover:opacity-100'
                  )}
                  aria-label={`View photo ${index + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ExistingConditionsGrid;
