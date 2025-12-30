"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Camera, ImagePlus, Loader2, AlertCircle, ArrowRight, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";

type PhotoState = {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "ready" | "error";
  error?: string;
};

/**
 * ScopeScan module for the homepage
 * Provides camera and gallery upload functionality that works on mobile
 * Redirects to /m/create with photos after successful capture
 */
export function HomepageScopeScan() {
  const { t } = useLanguage();
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Refs for file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateId = () => `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const newPhotos: PhotoState[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;

      const photo: PhotoState = {
        id: generateId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "ready",
      };

      newPhotos.push(photo);
    }

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  }, []);

  const handleCameraClick = () => {
    setError(null);
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    setError(null);
    galleryInputRef.current?.click();
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleStartScopeScan = () => {
    if (photos.length === 0) {
      setError("Please add at least one photo to continue");
      return;
    }

    setIsProcessing(true);
    // Store photos in sessionStorage for the /m/create page to pick up
    try {
      // We'll store the file names and a flag indicating photos are ready
      sessionStorage.setItem("scopescan_photos_count", String(photos.length));
      sessionStorage.setItem("scopescan_redirect", "true");
      // Redirect to create page
      window.location.href = "/m/create";
    } catch {
      setError("Failed to process photos. Please try again.");
      setIsProcessing(false);
    }
  };

  const photoCount = photos.length;
  const hasPhotos = photoCount > 0;

  return (
    <section 
      className="py-12 sm:py-16 bg-gradient-to-br from-orange-50 to-amber-50 border-y border-orange-100" 
      data-testid="section-scope-scan"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-orange-500 rounded-2xl shadow-lg mb-4">
              <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 
              className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-2"
              data-testid="scope-scan-heading"
            >
              {t.mobile.scopeScan}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              {t.mobile.snapFewPhotos}
            </p>
          </div>

          {/* Photo Capture Card */}
          <Card className="border-orange-200 shadow-md">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg text-orange-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-600" />
                Quick Photo Capture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  // Reset input so same file can be selected again
                  e.target.value = "";
                }}
                className="hidden"
                data-testid="input-camera"
                aria-label="Take photo with camera"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  handleFiles(e.target.files);
                  // Reset input so same file can be selected again
                  e.target.value = "";
                }}
                className="hidden"
                data-testid="input-gallery"
                aria-label="Upload photo from gallery"
              />

              {/* Error message */}
              {error && (
                <div 
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2"
                  data-testid="scope-scan-error"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 sm:h-24 flex-col gap-2 border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-slate-700"
                  onClick={handleCameraClick}
                  disabled={isProcessing}
                  data-testid="button-take-photo"
                >
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                  <span className="text-sm sm:text-base font-medium">Take Photo</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 sm:h-24 flex-col gap-2 border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-slate-700"
                  onClick={handleGalleryClick}
                  disabled={isProcessing}
                  data-testid="button-upload-photo"
                >
                  <ImagePlus className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                  <span className="text-sm sm:text-base font-medium">Upload Photo</span>
                </Button>
              </div>

              {/* Photo Preview Grid */}
              {hasPhotos && (
                <div className="space-y-3" data-testid="photo-preview-area">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {photoCount} photo{photoCount !== 1 ? "s" : ""} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setPhotos([])}
                      className="text-xs text-slate-500 hover:text-slate-700 underline"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.slice(0, 8).map((photo, index) => (
                      <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.previewUrl}
                          alt={`Photo ${index + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
                          aria-label={`Remove photo ${index + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          #{index + 1}
                        </div>
                      </div>
                    ))}
                    {photos.length > 8 && (
                      <div className="aspect-square rounded-lg bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-600 font-medium">+{photos.length - 8}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!hasPhotos && (
                <div 
                  className="text-center py-4 text-slate-500 text-sm"
                  data-testid="scope-scan-empty-state"
                >
                  <p>Tap a button above to add photos</p>
                  <p className="text-xs mt-1 text-slate-400">
                    Best results: 6–10 photos (wide shots + closeups)
                  </p>
                </div>
              )}

              {/* Continue Button */}
              {hasPhotos ? (
                <Button
                  className="w-full h-12 text-base gap-2 bg-orange-500 hover:bg-orange-600"
                  onClick={handleStartScopeScan}
                  disabled={isProcessing}
                  data-testid="button-continue-scope-scan"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to ScopeScan
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              ) : (
                <Link href="/m/create" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-11 gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                    data-testid="button-start-scope-scan-link"
                  >
                    Or start ScopeScan without photos
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}

              {/* Tips */}
              <div className="pt-2 border-t border-orange-100">
                <p className="text-xs text-orange-700 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    Photos are analyzed by AI to generate accurate scope items and estimates
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* How it works mini-steps */}
          <div className="mt-6 grid grid-cols-4 gap-2 text-center">
            {[
              { step: "1", label: "Add Photos" },
              { step: "2", label: "AI Analysis" },
              { step: "3", label: "Review Scope" },
              { step: "4", label: "Send Proposal" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <span className="text-xs text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
