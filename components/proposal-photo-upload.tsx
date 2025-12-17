'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
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
  GripVertical,
  Star,
  ImageIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  type ProposalPhotoCategory,
  proposalPhotoCategories,
} from '@shared/schema';

export interface UploadedPhoto {
  id: string;
  file?: File;
  url: string;
  category: ProposalPhotoCategory;
  caption: string;
  displayOrder: number;
  isUploading?: boolean;
  error?: string;
}

interface ProposalPhotoUploadProps {
  photos: UploadedPhoto[];
  onPhotosChange: (photos: UploadedPhoto[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
  className?: string;
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
 */
export function ProposalPhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 20,
  disabled = false,
  className,
}: ProposalPhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    const newPhotos: UploadedPhoto[] = filesToAdd.map((file, index) => ({
      id: generateId(),
      file,
      url: URL.createObjectURL(file),
      category: photos.length === 0 && index === 0 ? 'hero' : 'existing',
      caption: '',
      displayOrder: photos.length + index,
    }));

    onPhotosChange([...photos, ...newPhotos]);
  }, [photos, onPhotosChange, maxPhotos, disabled]);

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
    onPhotosChange(photos.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePhoto = (id: string) => {
    const photo = photos.find(p => p.id === id);
    if (photo?.url.startsWith('blob:')) {
      URL.revokeObjectURL(photo.url);
    }
    onPhotosChange(photos.filter(p => p.id !== id));
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
    <div className={cn('space-y-6', className)}>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-slate-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Upload className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-slate-700">
              {isDragging ? 'Drop photos here' : 'Drag & drop photos or click to browse'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {photos.length}/{maxPhotos} photos • JPG, PNG up to 10MB each
            </p>
          </div>
        </div>
      </div>

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
                compact
              />
            ))}
          </div>
        </div>
      )}
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
}

function PhotoCard({
  photo,
  onUpdate,
  onRemove,
  onSetAsHero,
  isHero = false,
  compact = false,
}: PhotoCardProps) {
  return (
    <div className={cn(
      'border rounded-lg overflow-hidden bg-white',
      isHero ? 'border-amber-300' : 'border-slate-200',
      photo.error && 'border-red-300'
    )}>
      {/* Image Preview */}
      <div className={cn(
        'relative bg-slate-100',
        isHero ? 'aspect-video' : 'aspect-square'
      )}>
        <Image
          src={photo.url}
          alt={photo.caption || 'Photo preview'}
          fill
          className="object-cover"
          sizes={isHero ? '(max-width: 768px) 100vw, 600px' : '200px'}
        />
        
        {/* Loading overlay */}
        {photo.isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
      </div>
      
      {/* Controls */}
      <div className={cn('p-2 space-y-2', compact && 'p-2')}>
        {/* Category Select */}
        <Select
          value={photo.category}
          onValueChange={(value) => onUpdate({ category: value as ProposalPhotoCategory })}
        >
          <SelectTrigger className={cn('h-8 text-xs', compact && 'h-7')}>
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
        
        {/* Caption */}
        {!compact && (
          <Input
            placeholder="Add caption (optional)"
            value={photo.caption}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            className="h-8 text-xs"
          />
        )}
      </div>
    </div>
  );
}

export default ProposalPhotoUpload;
