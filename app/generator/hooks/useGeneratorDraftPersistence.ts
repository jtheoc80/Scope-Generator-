'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useDraftPersistence, type ProposalDraft } from '@/hooks/useDraftPersistence';
import type { UploadedPhoto } from '@/components/proposal-photo-upload';

/**
 * Service item interface (mirrors the one in page.tsx)
 */
export interface ServiceItem {
  id: string;
  tradeId: string;
  jobTypeId: string;
  jobSize: number;
  homeArea: string;
  footage: number | null;
  options: Record<string, boolean | string>;
}

/**
 * Form values interface
 */
export interface GeneratorFormValues {
  clientName?: string;
  address?: string;
}

/**
 * State setters interface - passed from the parent component
 */
export interface GeneratorStateSetters {
  setServices: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
  setPhotos: React.Dispatch<React.SetStateAction<UploadedPhoto[]>>;
  setEnhancedScopes: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setStep: React.Dispatch<React.SetStateAction<1 | 2>>;
  setSavedProposalId: React.Dispatch<React.SetStateAction<number | null>>;
  setFinalizeErrors: React.Dispatch<React.SetStateAction<{ clientName?: string; address?: string }>>;
}

/**
 * Current state interface - read from the parent component
 */
export interface GeneratorCurrentState {
  services: ServiceItem[];
  photos: UploadedPhoto[];
  enhancedScopes: Record<string, string[]>;
  watchedValues: GeneratorFormValues;
}

/**
 * Options for the useGeneratorDraftPersistence hook
 */
export interface UseGeneratorDraftPersistenceOptions {
  userId: string | null;
  isAuthLoading: boolean;
  form: UseFormReturn<GeneratorFormValues>;
  state: GeneratorCurrentState;
  setters: GeneratorStateSetters;
  onReset?: () => void;
}

/**
 * Return type for the hook
 */
export interface UseGeneratorDraftPersistenceReturn {
  /** Whether autosave is in progress */
  isAutoSaving: boolean;
  /** Relative time since last save (e.g., "just now", "2 min ago") */
  lastSavedRelative: string | null;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Whether a draft was restored from localStorage */
  draftRestored: boolean;
  /** Handle reset draft action */
  handleResetDraft: () => void;
}

/**
 * Hook that encapsulates all draft persistence logic for the Generator page.
 * 
 * Features:
 * - Restores draft from localStorage on mount (after auth settles)
 * - Autosaves draft on changes (debounced)
 * - Provides reset functionality
 * - Shows save status indicators
 */
export function useGeneratorDraftPersistence(
  options: UseGeneratorDraftPersistenceOptions
): UseGeneratorDraftPersistenceReturn {
  const { userId, isAuthLoading, form, state, setters, onReset } = options;
  const { services, photos, enhancedScopes, watchedValues } = state;
  const { setServices, setPhotos, setEnhancedScopes, setStep, setSavedProposalId, setFinalizeErrors } = setters;

  // Track if draft was restored
  const [draftRestored, setDraftRestored] = useState(false);
  
  // Track if initial restore has been attempted
  const restoreAttemptedRef = useRef(false);

  // Base draft persistence hook
  const {
    isSaving: isAutoSaving,
    lastSavedRelative,
    hasUnsavedChanges,
    wasRestored,
    scheduleSave,
    resetDraft,
    loadDraft,
    markAsSaved,
  } = useDraftPersistence({
    userId,
    enabled: true,
  });

  // Convert current state to ProposalDraft format
  const getCurrentDraft = useCallback((): ProposalDraft => {
    return {
      clientName: watchedValues.clientName || '',
      address: watchedValues.address || '',
      services: services.map(s => ({
        id: s.id,
        tradeId: s.tradeId,
        jobTypeId: s.jobTypeId,
        jobSize: s.jobSize,
        homeArea: s.homeArea,
        footage: s.footage,
        options: s.options,
      })),
      photos: photos.map(p => ({
        id: p.id,
        url: p.url,
        category: p.category,
        caption: p.caption,
        displayOrder: p.displayOrder,
      })),
      enhancedScopes,
    };
  }, [watchedValues.clientName, watchedValues.address, services, photos, enhancedScopes]);

  // Restore draft from localStorage on mount (once auth settles)
  useEffect(() => {
    // Wait for auth to settle
    if (isAuthLoading) return;
    
    // Only attempt restore once
    if (restoreAttemptedRef.current) return;
    restoreAttemptedRef.current = true;
    
    const savedDraft = loadDraft();
    if (savedDraft) {
      // Restore form values
      form.setValue('clientName', savedDraft.clientName);
      form.setValue('address', savedDraft.address);
      
      // Restore services
      if (savedDraft.services.length > 0) {
        setServices(savedDraft.services.map(s => ({
          id: s.id,
          tradeId: s.tradeId,
          jobTypeId: s.jobTypeId,
          jobSize: s.jobSize,
          homeArea: s.homeArea,
          footage: s.footage,
          options: s.options,
        })));
      }
      
      // Restore photos (with type-safe defaults)
      if (savedDraft.photos.length > 0) {
        setPhotos(savedDraft.photos.map((p, index) => ({
          id: p.id,
          url: p.url,
          category: (p.category as UploadedPhoto['category']) || 'other',
          caption: p.caption || '',
          displayOrder: p.displayOrder ?? index,
        })));
      }
      
      // Restore enhanced scopes
      if (Object.keys(savedDraft.enhancedScopes).length > 0) {
        setEnhancedScopes(savedDraft.enhancedScopes);
      }
      
      setDraftRestored(true);
      
      // Mark as saved to prevent immediate re-save
      markAsSaved(savedDraft);
    }
  }, [isAuthLoading, loadDraft, markAsSaved, form, setServices, setPhotos, setEnhancedScopes]);

  // Autosave on draft changes (debounced)
  useEffect(() => {
    // Skip during initial auth loading or before restore attempt
    if (isAuthLoading || !restoreAttemptedRef.current) return;
    
    const draft = getCurrentDraft();
    scheduleSave(draft);
  }, [getCurrentDraft, scheduleSave, isAuthLoading]);

  // Handle reset draft
  const handleResetDraft = useCallback(() => {
    // Clear localStorage
    resetDraft();
    
    // Reset form
    form.reset({ clientName: '', address: '' });
    
    // Reset services to initial state
    setServices([
      { id: crypto.randomUUID(), tradeId: "", jobTypeId: "", jobSize: 2, homeArea: "", footage: null, options: {} }
    ]);
    
    // Reset other state
    setPhotos([]);
    setEnhancedScopes({});
    setStep(1);
    setSavedProposalId(null);
    setDraftRestored(false);
    setFinalizeErrors({});
    
    // Allow another restore attempt if user navigates away and back
    restoreAttemptedRef.current = false;
    
    // Call optional callback
    onReset?.();
  }, [resetDraft, form, setServices, setPhotos, setEnhancedScopes, setStep, setSavedProposalId, setFinalizeErrors, onReset]);

  return {
    isAutoSaving,
    lastSavedRelative,
    hasUnsavedChanges,
    draftRestored: draftRestored && wasRestored,
    handleResetDraft,
  };
}
