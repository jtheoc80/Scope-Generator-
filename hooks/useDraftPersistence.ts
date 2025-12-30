'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ProposalDraft,
  DraftServiceItem,
  DraftPhoto,
  loadDraftFromStorage,
  saveDraftToStorage,
  clearDraftFromStorage,
  draftHasContent,
  draftsAreEqual,
  formatRelativeTime,
  createEmptyDraft,
} from '@/lib/draft-persistence';

// Debounce delay in milliseconds
const AUTOSAVE_DEBOUNCE_MS = 1000;

export interface UseDraftPersistenceOptions {
  userId: string | null;
  enabled?: boolean;
}

export interface DraftPersistenceState {
  /** Whether the draft is currently being saved */
  isSaving: boolean;
  /** Last saved timestamp (Unix ms) or null if never saved */
  lastSavedAt: number | null;
  /** Formatted relative time of last save */
  lastSavedRelative: string | null;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Whether a draft was restored on mount */
  wasRestored: boolean;
}

export interface UseDraftPersistenceReturn extends DraftPersistenceState {
  /** Save the current draft immediately */
  saveDraft: (draft: ProposalDraft) => void;
  /** Schedule a debounced save */
  scheduleSave: (draft: ProposalDraft) => void;
  /** Clear the saved draft */
  resetDraft: () => void;
  /** Load existing draft (returns null if none found or invalid) */
  loadDraft: () => ProposalDraft | null;
  /** Update the saved reference (call after restore to prevent immediate re-save) */
  markAsSaved: (draft: ProposalDraft) => void;
}

/**
 * Hook for managing draft persistence with autosave and restore
 */
export function useDraftPersistence(
  options: UseDraftPersistenceOptions
): UseDraftPersistenceReturn {
  const { userId, enabled = true } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [lastSavedRelative, setLastSavedRelative] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [wasRestored, setWasRestored] = useState(false);

  // Refs for debouncing and tracking
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDraftRef = useRef<ProposalDraft | null>(null);
  const relativeTimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update relative time display periodically
  useEffect(() => {
    if (lastSavedAt) {
      setLastSavedRelative(formatRelativeTime(lastSavedAt));

      // Update every 10 seconds
      relativeTimeIntervalRef.current = setInterval(() => {
        setLastSavedRelative(formatRelativeTime(lastSavedAt));
      }, 10000);
    }

    return () => {
      if (relativeTimeIntervalRef.current) {
        clearInterval(relativeTimeIntervalRef.current);
      }
    };
  }, [lastSavedAt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (relativeTimeIntervalRef.current) {
        clearInterval(relativeTimeIntervalRef.current);
      }
    };
  }, []);

  /**
   * Save draft immediately
   */
  const saveDraft = useCallback(
    (draft: ProposalDraft) => {
      if (!enabled) return;

      // Don't save empty drafts
      if (!draftHasContent(draft)) {
        return;
      }

      // Skip if unchanged
      if (lastSavedDraftRef.current && draftsAreEqual(draft, lastSavedDraftRef.current)) {
        setHasUnsavedChanges(false);
        return;
      }

      setIsSaving(true);

      const success = saveDraftToStorage(userId, draft);

      if (success) {
        const now = Date.now();
        setLastSavedAt(now);
        setLastSavedRelative(formatRelativeTime(now));
        setHasUnsavedChanges(false);
        lastSavedDraftRef.current = draft;
      }

      setIsSaving(false);
    },
    [userId, enabled]
  );

  /**
   * Schedule a debounced save
   */
  const scheduleSave = useCallback(
    (draft: ProposalDraft) => {
      if (!enabled) return;

      // Mark as having unsaved changes
      if (!lastSavedDraftRef.current || !draftsAreEqual(draft, lastSavedDraftRef.current)) {
        setHasUnsavedChanges(true);
      }

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Schedule new save
      debounceTimerRef.current = setTimeout(() => {
        saveDraft(draft);
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [saveDraft, enabled]
  );

  /**
   * Clear the saved draft
   */
  const resetDraft = useCallback(() => {
    if (!enabled) return;

    clearDraftFromStorage(userId);
    lastSavedDraftRef.current = null;
    setLastSavedAt(null);
    setLastSavedRelative(null);
    setHasUnsavedChanges(false);
    setWasRestored(false);
  }, [userId, enabled]);

  /**
   * Load existing draft from storage
   */
  const loadDraft = useCallback((): ProposalDraft | null => {
    if (!enabled) return null;

    const result = loadDraftFromStorage(userId);

    if (result.success && result.draft) {
      // Store reference and timestamp
      lastSavedDraftRef.current = result.draft;
      if (result.timestamp) {
        setLastSavedAt(result.timestamp);
        setLastSavedRelative(formatRelativeTime(result.timestamp));
      }
      setWasRestored(true);
      setHasUnsavedChanges(false);
      return result.draft;
    }

    // If failed but had data, clear invalid draft
    if (result.error && result.error !== 'No draft data') {
      console.warn('Clearing invalid draft:', result.error);
      clearDraftFromStorage(userId);
    }

    return null;
  }, [userId, enabled]);

  /**
   * Mark current draft as saved (use after restore to prevent re-save)
   */
  const markAsSaved = useCallback((draft: ProposalDraft) => {
    lastSavedDraftRef.current = draft;
    setHasUnsavedChanges(false);
  }, []);

  return {
    isSaving,
    lastSavedAt,
    lastSavedRelative,
    hasUnsavedChanges,
    wasRestored,
    saveDraft,
    scheduleSave,
    resetDraft,
    loadDraft,
    markAsSaved,
  };
}

// Re-export types and utilities for convenience
export type { ProposalDraft, DraftServiceItem, DraftPhoto };
export { createEmptyDraft, draftHasContent };
