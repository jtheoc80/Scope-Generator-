'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Camera,
  Upload,
  X,
  Star,
  ImageIcon,
  Loader2,
  AlertCircle,
  Brain,
  Sparkles,
} from 'lucide-react';
import {
  type ProposalPhotoCategory,
  proposalPhotoCategories,
} from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export interface UploadedPhoto {
  id: string;
  /** Server-side numeric ID when persisted */
  serverId?: number;
  file?: File;
  url: string;
  /** Optional optimized variants (server-backed) */
  thumbUrl?: string;
  mediumUrl?: string;
  originalUrl?: string;
  category: ProposalPhotoCategory;
  caption: string;
  displayOrder: number;
  isUploading?: boolean;
  error?: string;
  /** Was this category auto-assigned by the learning system? */
  wasAutoAssigned?: boolean;
  /** Confidence level of the suggestion (0-100) */
  suggestionConfidence?: number;
}

/** Learning context for photo suggestions */
export interface LearningContext {
  tradeId?: string;
  jobTypeId?: string;
  zipcode?: string;
  city?: string;
  state?: string;
}

/** Photo suggestion from learning system */
interface PhotoSuggestion {
  category: ProposalPhotoCategory;
  confidence: number;
  reason: string;
  suggestedCaption?: string;
  captionOptions: string[];
}

interface ProposalPhotoUploadProps {
  photos: UploadedPhoto[];
  onPhotosChange: (photos: UploadedPhoto[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
  className?: string;
  /** If provided, the component becomes server-backed and refresh-safe */
  proposalId?: number | null;
  /** Optional: callback to lazily create a draft proposal before uploads */
  ensureProposalId?: () => Promise<number>;
  /** Learning context for smart suggestions */
  learningContext?: LearningContext;
  /** Enable learning system integration */
  enableLearning?: boolean;
}

const CATEGORY_LABELS: Record<ProposalPhotoCategory, string> = {
  hero: '⭐ Hero (Cover)',
  existing: '📸 Existing Conditions',
  shower: '🚿 Shower',
  vanity: '🪞 Vanity & Sink',
  flooring: '🏠 Flooring',
  tub: '🛁 Tub',
  toilet: '🚽 Toilet',
  plumbing: '🔧 Plumbing',
  electrical: '⚡ Electrical',
  damage: '⚠️ Damage/Repairs',
  kitchen: '🍳 Kitchen',
  cabinets: '🗄️ Cabinets',
  countertops: '📐 Countertops',
  roofing: '🏠 Roofing',
  siding: '🧱 Siding',
  windows: '🪟 Windows/Doors',
  hvac: '❄️ HVAC',
  other: '📎 Other',
};

/**
 * Photo upload component for proposals.
 * Supports drag-drop, category assignment, captions, and reordering.
 * 
 * UX Features:
 * - Smart auto-categorization based on file order AND learned preferences
 * - Visual feedback during drag operations
 * - Progress indicators for uploads
 * - Undo support for deletions
 * - Recommended photo tips
 * - Learning system integration for personalized suggestions
 */
export function ProposalPhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 20,
  disabled = false,
  className,
  proposalId,
  ensureProposalId,
  learningContext,
  enableLearning = true,
}: ProposalPhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState<UploadedPhoto | null>(null);
  const [captionSuggestions, setCaptionSuggestions] = useState<Record<string, string[]>>({});
  const [learningReady, setLearningReady] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateId = () => `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const isServerBacked = Boolean(proposalId || ensureProposalId);

  const fetchCanonicalPhotos = useCallback(async (pid: number) => {
    const res = await fetch(`/api/proposals/${pid}/photos`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch photos');
    const data = (await res.json()) as {
      photos: Array<{
        id: number;
        category: ProposalPhotoCategory;
        caption: string | null;
        displayOrder: number;
        urls?: { original: string; thumb: string; medium: string };
        publicUrl: string;
        thumbUrl?: string | null;
        mediumUrl?: string | null;
      }>;
    };
    return data.photos.map((p, idx) => ({
      id: `server-${p.id}`,
      serverId: p.id,
      url: p.urls?.thumb ?? p.thumbUrl ?? p.publicUrl,
      thumbUrl: p.urls?.thumb ?? p.thumbUrl ?? p.publicUrl,
      mediumUrl: p.urls?.medium ?? p.mediumUrl ?? p.publicUrl,
      originalUrl: p.urls?.original ?? p.publicUrl,
      category: p.category ?? 'other',
      caption: p.caption ?? '',
      displayOrder: typeof p.displayOrder === 'number' ? p.displayOrder : idx,
    }));
  }, []);

  // Hydrate from server truth when proposalId is present (refresh-safe).
  useEffect(() => {
    if (!isServerBacked || !proposalId) return;
    let cancelled = false;
    setIsHydrating(true);
    fetchCanonicalPhotos(proposalId)
      .then((serverPhotos) => {
        if (cancelled) return;
        onPhotosChange(serverPhotos);
      })
      .catch(() => {
        // Non-blocking: keep existing UI state if fetch fails.
      })
      .finally(() => {
        if (!cancelled) setIsHydrating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isServerBacked, proposalId, fetchCanonicalPhotos, onPhotosChange]);

  // Fetch caption suggestions when learning is enabled
  useEffect(() => {
    if (enableLearning && learningContext?.tradeId) {
      setLearningReady(true);
    }
  }, [enableLearning, learningContext]);

  // Fetch photo category suggestion from learning API
  const fetchPhotoSuggestion = async (photoOrder: number): Promise<PhotoSuggestion | null> => {
    if (!enableLearning || !learningContext) return null;
    
    try {
      const response = await fetch('/api/learning/photo-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          photoOrder,
          ...learningContext,
        }),
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch photo suggestion:', error);
    }
    return null;
  };

  // Track photo categorization for learning
  const trackPhotoCategory = async (
    photoOrder: number,
    category: ProposalPhotoCategory,
    caption: string | null,
    wasAutoAssigned: boolean,
    wasModified: boolean
  ) => {
    if (!enableLearning || !learningContext) return;
    
    try {
      await fetch('/api/learning/track/photo-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          photoOrder,
          category,
          caption,
          wasAutoAssigned,
          wasModified,
          ...learningContext,
        }),
      });
    } catch (error) {
      console.error('Failed to track photo category:', error);
    }
  };

  // Fetch caption suggestions for a category
  const fetchCaptionSuggestions = async (category: ProposalPhotoCategory): Promise<string[]> => {
    if (!enableLearning || !learningContext) return [];
    
    // Check cache first
    if (captionSuggestions[category]) {
      return captionSuggestions[category];
    }
    
    try {
      const response = await fetch('/api/learning/caption-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category,
          ...learningContext,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const suggestions = data.suggestions || [];
        setCaptionSuggestions(prev => ({ ...prev, [category]: suggestions }));
        return suggestions;
      }
    } catch (error) {
      console.error('Failed to fetch caption suggestions:', error);
    }
    return [];
  };

  // Smart auto-categorization using learning system when available
  const getSmartCategory = async (
    index: number, 
    totalNew: number, 
    existingCount: number
  ): Promise<{ category: ProposalPhotoCategory; confidence: number; wasAutoAssigned: boolean }> => {
    const photoOrder = existingCount + index + 1;
    
    // Try learning system first
    if (enableLearning && learningContext?.tradeId) {
      const suggestion = await fetchPhotoSuggestion(photoOrder);
      if (suggestion && suggestion.confidence >= 60) {
        return {
          category: suggestion.category,
          confidence: suggestion.confidence,
          wasAutoAssigned: true,
        };
      }
    }
    
    // Fall back to rule-based categorization
    let category: ProposalPhotoCategory = 'other';
    
    // First photo becomes hero if no photos exist
    if (existingCount === 0 && index === 0) {
      category = 'hero';
    }
    // Next 2-6 photos become existing conditions
    else {
      const currentExistingCount = photos.filter(p => p.category === 'existing').length;
      if (currentExistingCount + index < 6) {
        category = 'existing';
      }
    }
    
    return { category, confidence: 50, wasAutoAssigned: true };
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || disabled) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    if (filesToAdd.length === 0 && files.length > 0) {
      // Show feedback that max photos reached
      return;
    }

    // Create photos with temporary categories first for instant feedback
    const tempPhotos: UploadedPhoto[] = filesToAdd.map((file, index) => ({
      id: generateId(),
      file,
      url: URL.createObjectURL(file),
      category: 'other' as ProposalPhotoCategory,
      caption: '',
      displayOrder: photos.length + index,
      wasAutoAssigned: true,
      isUploading: isServerBacked ? true : false,
    }));

    // Immediately show photos
    onPhotosChange([...photos, ...tempPhotos]);

    // Then update with smart categories asynchronously
    const updatedPhotos = await Promise.all(
      tempPhotos.map(async (photo, index) => {
        const result = await getSmartCategory(index, filesToAdd.length, photos.length);
        return {
          ...photo,
          category: result.category,
          suggestionConfidence: result.confidence,
          wasAutoAssigned: result.wasAutoAssigned,
        };
      })
    );

    // Update with smart categories
    onPhotosChange([...photos, ...updatedPhotos]);

    if (!isServerBacked) return;

    // Server-backed upload: upload -> server returns canonical record -> refetch list.
    try {
      const pid =
        proposalId ??
        (ensureProposalId ? await ensureProposalId() : null);
      if (!pid) return;

      const uploads = updatedPhotos.map(async (p) => {
        if (!p.file) return;
        const form = new FormData();
        form.set('file', p.file);
        form.set('category', p.category);
        form.set('caption', p.caption);
        form.set('displayOrder', String(p.displayOrder));

        const res = await fetch(`/api/proposals/${pid}/photos`, {
          method: 'POST',
          credentials: 'include',
          body: form,
        });
        if (!res.ok) {
          const msg = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(msg?.message || 'Upload failed');
        }
      });

      const results = await Promise.allSettled(uploads);
      const anyRejected = results.some((r) => r.status === 'rejected');

      // Always refetch server truth when possible.
      const serverPhotos = await fetchCanonicalPhotos(pid);
      onPhotosChange(serverPhotos);

      // Revoke blob URLs for any temp previews we replaced.
      updatedPhotos.forEach((p) => {
        if (p.url?.startsWith('blob:')) URL.revokeObjectURL(p.url);
      });

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      // Mark temp photos as failed (keeps UI responsive; user can retry by re-adding).
      onPhotosChange(
        [...photos, ...updatedPhotos].map((p) =>
          updatedPhotos.some((u) => u.id === p.id)
            ? { ...p, isUploading: false, error: msg }
            : p
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, onPhotosChange, maxPhotos, disabled, enableLearning, learningContext, isServerBacked, proposalId, ensureProposalId, fetchCanonicalPhotos]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const updatePhoto = (id: string, updates: Partial<UploadedPhoto>) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    // Track category changes for learning
    if (updates.category && updates.category !== photo.category) {
      const photoOrder = photos.indexOf(photo) + 1;
      trackPhotoCategory(
        photoOrder,
        updates.category,
        updates.caption ?? photo.caption ?? null,
        photo.wasAutoAssigned ?? false,
        true // wasModified
      );
    }

    const next = photos.map(p => p.id === id ? { ...p, ...updates, wasAutoAssigned: false } : p);
    onPhotosChange(next);

    if (isServerBacked && photo.serverId && proposalId) {
      // Fire-and-forget persistence to server truth.
      void fetch(`/api/proposals/${proposalId}/photos/${photo.serverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          category: updates.category,
          caption: updates.caption,
          displayOrder: updates.displayOrder,
        }),
      });
    }
  };

  const removePhoto = (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;

    // Store for undo (don't revoke URL yet)
    setRecentlyDeleted(photo);
    // Store original index for restoration if needed
    const originalIndex = photos.findIndex(p => p.id === id);
    // Optimistically remove from UI
    const updatedPhotos = photos.filter(p => p.id !== id);
    onPhotosChange(updatedPhotos);

    // Handle server-backed deletion
    if (isServerBacked && photo.serverId && proposalId) {
      (async () => {
        try {
          const deleteResponse = await fetch(`/api/proposals/${proposalId}/photos/${photo.serverId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!deleteResponse.ok) {
            // Server deletion failed - try to refetch canonical truth
            throw new Error('Failed to delete photo on server');
          }

          // Deletion succeeded - refetch to ensure consistency
          try {
            const serverPhotos = await fetchCanonicalPhotos(proposalId);
            onPhotosChange(serverPhotos);
          } catch (refetchError) {
            // Refetch failed but deletion succeeded - optimistic removal is correct
            console.warn('Photo deleted but failed to refetch:', refetchError);
          }
        } catch (error) {
          // Server deletion failed - attempt to restore UI state
          console.error('Failed to delete photo:', error);
          
          try {
            // Try to refetch the canonical state from server
            const serverPhotos = await fetchCanonicalPhotos(proposalId);
            onPhotosChange(serverPhotos);
            // Clear undo state since we restored from server
            setRecentlyDeleted(null);
            
            // Show error to user
            toast({
              title: 'Failed to delete photo',
              description: 'The photo could not be deleted. Please try again.',
              variant: 'destructive',
            });
          } catch (refetchError) {
            // Both deletion and refetch failed - restore photo to UI manually
            console.error('Failed to refetch after delete error:', refetchError);
            
            // Restore the photo at its original position
            const restoredPhotos = [...updatedPhotos];
            restoredPhotos.splice(originalIndex, 0, photo);
            onPhotosChange(restoredPhotos);
            // Clear undo state since we manually restored
            setRecentlyDeleted(null);
            
            toast({
              title: 'Failed to delete photo',
              description: 'Unable to connect to the server. Please check your connection and try again.',
              variant: 'destructive',
            });
          }
        }
      })();
    }
    
    // Clear undo after 5 seconds and revoke URL
    setTimeout(() => {
      setRecentlyDeleted(prev => {
        if (prev?.id === photo.id && photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
        return prev?.id === photo.id ? null : prev;
      });
    }, 5000);
  };

  const undoDelete = () => {
    if (recentlyDeleted) {
      onPhotosChange([...photos, recentlyDeleted]);
      setRecentlyDeleted(null);
    }
  };

  const setAsHero = (id: string) => {
    onPhotosChange(photos.map(p => ({
      ...p,
      category: p.id === id ? 'hero' : (p.category === 'hero' ? 'existing' : p.category),
    })));
  };

  const heroPhoto = photos.find(p => p.category === 'hero');
  const existingPhotos = photos.filter(p => p.category === 'existing');
  const scopePhotos = photos.filter(p => 
    p.category !== 'hero' && p.category !== 'existing' && p.category !== 'other'
  );
  const otherPhotos = photos.filter(p => p.category === 'other');

  return (
    <div className={cn('space-y-6', className)} data-testid="photo-uploader">
      {/* Undo Toast */}
      {recentlyDeleted && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4">
          <span className="text-sm">Photo removed</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={undoDelete}
            className="h-7 text-xs"
          >
            Undo
          </Button>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer',
          isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50',
          disabled && 'opacity-50 cursor-not-allowed',
          photos.length >= maxPhotos && 'border-amber-300 bg-amber-50'
        )}
        onClick={() => !disabled && photos.length < maxPhotos && fileInputRef.current?.click()}
        data-testid="photo-upload-area"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || photos.length >= maxPhotos}
          data-testid="photo-upload-input"
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            isDragging ? 'bg-primary/20' : 'bg-slate-100',
            photos.length >= maxPhotos && 'bg-amber-100'
          )}>
            <Upload className={cn(
              'w-6 h-6',
              isDragging ? 'text-primary' : 'text-slate-500',
              photos.length >= maxPhotos && 'text-amber-600'
            )} />
          </div>
          <div>
            <p className="font-medium text-slate-700">
              {photos.length >= maxPhotos 
                ? 'Maximum photos reached' 
                : isDragging 
                  ? 'Drop photos here' 
                  : 'Drag & drop photos or click to browse'}
            </p>
            <p className={cn(
              'text-sm mt-1',
              photos.length >= maxPhotos ? 'text-amber-600' : 'text-slate-500'
            )}>
              {photos.length}/{maxPhotos} photos • JPG, PNG up to 10MB each
            </p>
          </div>
        </div>
      </div>
      
      {/* Helpful tips for empty state */}
      {photos.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Photo Tips for Better Proposals
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>First photo</strong> becomes the hero banner on your proposal</li>
            <li>• <strong>2-6 photos</strong> work best for &quot;Existing Conditions&quot; section</li>
            <li>• Include close-ups of problem areas (water damage, wear, etc.)</li>
            <li>• Wide shots help show the overall scope of work</li>
          </ul>
        </div>
      )}

      {/* Photo Summary */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {heroPhoto && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> 1 Hero
            </span>
          )}
          {existingPhotos.length > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
              <Camera className="w-3 h-3" /> {existingPhotos.length} Existing Conditions
            </span>
          )}
          {scopePhotos.length > 0 && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> {scopePhotos.length} Scope Photos
            </span>
          )}
          {otherPhotos.length > 0 && (
            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
              {otherPhotos.length} Other
            </span>
          )}
        </div>
      )}

      {isHydrating && (
        <div className="text-xs text-slate-500">
          Loading photos…
        </div>
      )}

      {/* Learning Status Indicator */}
      {enableLearning && learningReady && photos.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          <Brain className="w-4 h-4 text-primary" />
          <span>Smart suggestions enabled • Learning your preferences</span>
        </div>
      )}

      <div data-testid="photo-grid" className="space-y-6">
      {/* Hero Photo Section */}
      {heroPhoto && (
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            ⭐ Hero Photo (Cover Banner)
          </Label>
          <PhotoCard
            photo={heroPhoto}
            onUpdate={(updates) => updatePhoto(heroPhoto.id, updates)}
            onRemove={() => removePhoto(heroPhoto.id)}
            onRequestCaptionSuggestions={() => fetchCaptionSuggestions(heroPhoto.category)}
            isHero
          />
        </div>
      )}

      {/* Existing Conditions Grid */}
      {existingPhotos.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            📸 Existing Conditions ({existingPhotos.length} photos)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {existingPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onUpdate={(updates) => updatePhoto(photo.id, updates)}
                onRemove={() => removePhoto(photo.id)}
                onSetAsHero={() => setAsHero(photo.id)}
                onRequestCaptionSuggestions={() => fetchCaptionSuggestions(photo.category)}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Scope Photos */}
      {scopePhotos.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            🎯 Scope Section Photos ({scopePhotos.length} photos)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {scopePhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onUpdate={(updates) => updatePhoto(photo.id, updates)}
                onRemove={() => removePhoto(photo.id)}
                onSetAsHero={() => setAsHero(photo.id)}
                onRequestCaptionSuggestions={() => fetchCaptionSuggestions(photo.category)}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Photos */}
      {otherPhotos.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            📎 Additional Photos ({otherPhotos.length} photos)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {otherPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onUpdate={(updates) => updatePhoto(photo.id, updates)}
                onRemove={() => removePhoto(photo.id)}
                onSetAsHero={() => setAsHero(photo.id)}
                onRequestCaptionSuggestions={() => fetchCaptionSuggestions(photo.category)}
                compact
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

interface PhotoCardProps {
  photo: UploadedPhoto;
  onUpdate: (updates: Partial<UploadedPhoto>) => void;
  onRemove: () => void;
  onSetAsHero?: () => void;
  isHero?: boolean;
  compact?: boolean;
  captionSuggestions?: string[];
  onRequestCaptionSuggestions?: () => Promise<string[]>;
}

function PhotoCard({
  photo,
  onUpdate,
  onRemove,
  onSetAsHero,
  isHero = false,
  compact = false,
  captionSuggestions = [],
  onRequestCaptionSuggestions,
}: PhotoCardProps) {
  const [showCaptionSuggestions, setShowCaptionSuggestions] = useState(false);
  const [loadedSuggestions, setLoadedSuggestions] = useState<string[]>(captionSuggestions);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleCaptionFocus = async () => {
    if (onRequestCaptionSuggestions && loadedSuggestions.length === 0) {
      const suggestions = await onRequestCaptionSuggestions();
      setLoadedSuggestions(suggestions);
    }
    setShowCaptionSuggestions(true);
  };

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden bg-white',
      isHero ? 'border-amber-300' : 'border-slate-200',
      photo.error && 'border-red-300'
    )} data-testid="photo-item">
      {/* Image Preview */}
      <div className={cn(
        'relative bg-slate-100',
        isHero ? 'aspect-video' : 'aspect-square'
      )}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption || 'Photo preview'}
          className={cn('absolute inset-0 w-full h-full object-cover', !isLoaded && 'opacity-0')}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
          decoding="async"
        />
        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse" />
        )}
        
        {/* Loading overlay */}
        {photo.isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center" data-testid="photo-upload-progress">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        
        {/* Error overlay */}
        {photo.error && (
          <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
            <div className="text-white text-center">
              <AlertCircle className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs">{photo.error}</p>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="absolute top-2 right-2 flex gap-1">
          {!isHero && onSetAsHero && (
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 bg-white/90 hover:bg-white"
              onClick={onSetAsHero}
              title="Set as hero photo"
            >
              <Star className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            className="h-7 w-7"
            onClick={onRemove}
            title="Remove photo"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Hero badge */}
        {isHero && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            ⭐ Hero
          </div>
        )}

        {/* Learning confidence indicator */}
        {photo.wasAutoAssigned && photo.suggestionConfidence && photo.suggestionConfidence >= 70 && (
          <div className="absolute bottom-2 left-2 bg-green-500/90 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
            <Brain className="w-3 h-3" />
            {photo.suggestionConfidence}%
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className={cn('p-2 space-y-2', compact && 'p-2')}>
        {/* Category Select with learning indicator */}
        <div className="relative">
          <Select
            value={photo.category}
            onValueChange={(value) => onUpdate({ category: value as ProposalPhotoCategory })}
          >
            <SelectTrigger className={cn(
              'h-8 text-xs',
              compact && 'h-7',
              photo.wasAutoAssigned && photo.suggestionConfidence && photo.suggestionConfidence >= 70 && 'border-green-300 bg-green-50/50'
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {proposalPhotoCategories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {photo.wasAutoAssigned && photo.suggestionConfidence && photo.suggestionConfidence >= 70 && (
            <div className="absolute -right-1 -top-1">
              <Sparkles className="w-3 h-3 text-green-500" />
            </div>
          )}
        </div>
        
        {/* Caption with suggestions */}
        {!compact && (
          <div className="relative">
            <Input
              placeholder="Add caption (optional)"
              value={photo.caption}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              onFocus={handleCaptionFocus}
              onBlur={() => setTimeout(() => setShowCaptionSuggestions(false), 200)}
              className="h-8 text-xs"
            />
            
            {/* Caption suggestions dropdown */}
            {showCaptionSuggestions && loadedSuggestions.length > 0 && !photo.caption && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-32 overflow-auto">
                <div className="px-2 py-1 text-[10px] text-slate-500 border-b flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Suggested captions
                </div>
                {loadedSuggestions.slice(0, 5).map((suggestion, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 transition-colors"
                    onMouseDown={() => onUpdate({ caption: suggestion })}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProposalPhotoUpload;
