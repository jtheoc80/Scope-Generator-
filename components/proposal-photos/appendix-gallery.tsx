'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import type { ProposalPhoto } from './types';
import { generatePhotoCaption } from './types';

interface AppendixGalleryProps {
  photos: ProposalPhoto[];
  className?: string;
  /** Title for the section */
  title?: string;
}

/**
 * Appendix gallery for remaining photos.
 * Shows thumbnails with click-to-enlarge lightbox and navigation.
 */
export function AppendixGallery({
  photos,
  className,
  title = 'Photo Appendix',
}: AppendixGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  if (photos.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  
  const goToPrevious = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === 0 ? photos.length - 1 : lightboxIndex - 1);
    }
  };
  
  const goToNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === photos.length - 1 ? 0 : lightboxIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (lightboxIndex === null) return;
    
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') closeLightbox();
  };

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      <div className={cn('mb-8 break-inside-avoid', className)}>
        <h2 className="text-lg font-heading font-bold text-white bg-slate-700 px-3 py-1 inline-flex items-center gap-2 mb-4">
          <ImageIcon className="w-4 h-4" />
          {title}
        </h2>
        
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-4">
            Click any photo to view full size. {photos.length} photo{photos.length !== 1 ? 's' : ''} attached.
          </p>
          
          {/* Thumbnail grid: 4 across on desktop, 3 on tablet, 2 on mobile */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => openLightbox(index)}
                className="group relative aspect-square overflow-hidden rounded-md bg-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform hover:scale-105"
                title={generatePhotoCaption(photo)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={generatePhotoCaption(photo)}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                
                {/* Index badge */}
                <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal with Navigation */}
      {currentPhoto && lightboxIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Photo counter */}
          <div className="absolute top-4 left-4 text-white text-sm z-10">
            {lightboxIndex + 1} / {photos.length}
          </div>
          
          {/* Previous button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 transition-colors z-10 bg-black/40 rounded-full p-2"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          
          {/* Next button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 transition-colors z-10 bg-black/40 rounded-full p-2"
              aria-label="Next photo"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          
          {/* Main image */}
          <div 
            className="relative max-w-5xl max-h-[85vh] w-full mx-16"
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
            <div className="text-center mt-4">
              <p className="text-white text-lg">
                {generatePhotoCaption(currentPhoto)}
              </p>
              {currentPhoto.filename && (
                <p className="text-slate-400 text-sm mt-1">
                  {currentPhoto.filename}
                </p>
              )}
            </div>
          </div>
          
          {/* Thumbnail strip at bottom */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2 max-w-[90vw] overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                  className={cn(
                    'relative w-12 h-12 flex-shrink-0 rounded overflow-hidden transition-all',
                    index === lightboxIndex 
                      ? 'ring-2 ring-white scale-110' 
                      : 'opacity-60 hover:opacity-100'
                  )}
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

export default AppendixGallery;
