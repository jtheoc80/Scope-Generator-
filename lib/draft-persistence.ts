/**
 * Draft Persistence Module
 * 
 * Handles serialization, deserialization, and localStorage management
 * for proposal drafts. Includes schema versioning for graceful migration
 * and validation to prevent data corruption.
 */

// Schema version - increment when draft structure changes
// v2: Added window-specific fields (windowQuantity, windowSizePreset, windowWidthIn, windowHeightIn)
// v3: Added server-backed `proposalId` and drop non-refreshable blob photo URLs on restore
export const DRAFT_SCHEMA_VERSION = 3;

// localStorage key prefix
const STORAGE_KEY_PREFIX = 'scopegen_proposal_draft';

/**
 * Service item in the draft
 */
export interface DraftServiceItem {
  id: string;
  tradeId: string;
  jobTypeId: string;
  jobSize: number;
  homeArea: string;
  footage: number | null;
  options: Record<string, boolean | string>;
  // Window-specific fields (for window-replacement job type)
  // Optional for backward compatibility - defaults applied on load
  windowQuantity?: number;
  windowSizePreset?: string;
  windowWidthIn?: number | null;
  windowHeightIn?: number | null;
}

/**
 * Photo in the draft
 */
export interface DraftPhoto {
  id: string;
  url: string;
  category?: string;
  caption?: string;
  displayOrder?: number;
}

/**
 * The draft data structure
 */
export interface ProposalDraft {
  /** Server draft proposal id (enables refresh-safe photo hydration) */
  proposalId?: number | null;
  clientName: string;
  address: string;
  services: DraftServiceItem[];
  photos: DraftPhoto[];
  enhancedScopes: Record<string, string[]>;
}

/**
 * Persisted draft with metadata
 */
export interface PersistedDraft {
  version: number;
  timestamp: number;
  draft: ProposalDraft;
}

/**
 * Result of deserializing a draft
 */
export interface DeserializeResult {
  success: boolean;
  draft: ProposalDraft | null;
  timestamp: number | null;
  error?: string;
}

/**
 * Generate the localStorage key for a user
 * @param userId - User ID or null for anonymous users
 */
export function getDraftStorageKey(userId: string | null): string {
  const userPart = userId || 'anon';
  return `${STORAGE_KEY_PREFIX}_${userPart}`;
}

/**
 * Create an empty draft with default values
 */
export function createEmptyDraft(): ProposalDraft {
  return {
    proposalId: null,
    clientName: '',
    address: '',
    services: [
      {
        id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        tradeId: '',
        jobTypeId: '',
        jobSize: 2,
        homeArea: '',
        footage: null,
        options: {},
        // Window defaults
        windowQuantity: 1,
        windowSizePreset: "30x60",
        windowWidthIn: null,
        windowHeightIn: null,
      }
    ],
    photos: [],
    enhancedScopes: {},
  };
}

/**
 * Validate a draft object has the required structure
 */
function validateDraftStructure(draft: unknown): draft is ProposalDraft {
  if (typeof draft !== 'object' || draft === null) {
    return false;
  }

  const d = draft as Record<string, unknown>;

  // Required string fields (can be empty)
  if (typeof d.clientName !== 'string') return false;
  if (typeof d.address !== 'string') return false;

  // Optional server proposal ID
  if (
    d.proposalId !== undefined &&
    d.proposalId !== null &&
    typeof d.proposalId !== 'number'
  ) {
    return false;
  }

  // Services array
  if (!Array.isArray(d.services)) return false;
  for (const service of d.services) {
    if (typeof service !== 'object' || service === null) return false;
    const s = service as Record<string, unknown>;
    if (typeof s.id !== 'string') return false;
    if (typeof s.tradeId !== 'string') return false;
    if (typeof s.jobTypeId !== 'string') return false;
    if (typeof s.jobSize !== 'number') return false;
    if (typeof s.homeArea !== 'string') return false;
    if (s.footage !== null && typeof s.footage !== 'number') return false;
    if (typeof s.options !== 'object' || s.options === null) return false;
  }

  // Photos array (optional, can be empty)
  if (!Array.isArray(d.photos)) return false;

  // Enhanced scopes (optional)
  if (typeof d.enhancedScopes !== 'object' || d.enhancedScopes === null) return false;

  return true;
}

/**
 * Serialize a draft for storage
 * @param draft - The draft to serialize
 * @returns JSON string ready for localStorage
 */
export function serializeDraft(draft: ProposalDraft): string {
  const persisted: PersistedDraft = {
    version: DRAFT_SCHEMA_VERSION,
    timestamp: Date.now(),
    draft,
  };
  return JSON.stringify(persisted);
}

/**
 * Migrate a draft from an older schema version to the current version
 * @param draft - The draft to migrate
 * @param fromVersion - The version to migrate from
 * @returns Migrated draft
 */
function migrateDraft(draft: ProposalDraft, fromVersion: number): ProposalDraft {
  // v1 -> v2: Add window-specific fields with defaults
  if (fromVersion === 1) {
    return {
      ...draft,
      services: draft.services.map(s => ({
        ...s,
        windowQuantity: s.windowQuantity ?? 1,
        windowSizePreset: s.windowSizePreset ?? "30x60",
        windowWidthIn: s.windowWidthIn ?? null,
        windowHeightIn: s.windowHeightIn ?? null,
      })),
    };
  }

  // v2 -> v3: add proposalId + remove blob URLs (not refresh-safe)
  if (fromVersion === 2) {
    return {
      ...draft,
      proposalId: null,
      photos: Array.isArray(draft.photos)
        ? draft.photos.filter((p) => {
            if (!p || typeof p !== "object") {
              return false;
            }
            const url = (p as { url?: unknown }).url;
            if (typeof url !== "string") {
              return false;
            }
            const trimmed = url.trim();
            if (!trimmed) {
              return false;
            }
            return !trimmed.startsWith("blob:");
          })
        : [],
    };
  }
  
  return draft;
}

/**
 * Deserialize a draft from storage
 * @param raw - The raw JSON string from localStorage
 * @returns DeserializeResult with success status and draft data
 */
export function deserializeDraft(raw: string | null): DeserializeResult {
  if (!raw) {
    return { success: false, draft: null, timestamp: null, error: 'No draft data' };
  }

  try {
    const parsed = JSON.parse(raw);

    // Check for persisted structure
    if (typeof parsed !== 'object' || parsed === null) {
      return { success: false, draft: null, timestamp: null, error: 'Invalid draft format' };
    }

    const { version, timestamp, draft } = parsed as PersistedDraft;

    // Version check
    if (typeof version !== 'number') {
      return { success: false, draft: null, timestamp: null, error: 'Missing version' };
    }

    // Attempt migration from older versions (1 -> 3 supported)
    if (version < DRAFT_SCHEMA_VERSION && version >= 1) {
      const migratedDraft = migrateDraft(draft, version);
      
      // Validate migrated draft structure
      if (!validateDraftStructure(migratedDraft)) {
        return { success: false, draft: null, timestamp: null, error: 'Invalid draft structure after migration' };
      }

      return { success: true, draft: migratedDraft, timestamp };
    }

    // Schema version mismatch (too new) - fail gracefully
    if (version !== DRAFT_SCHEMA_VERSION) {
      return { 
        success: false, 
        draft: null, 
        timestamp: null, 
        error: `Schema version mismatch: expected ${DRAFT_SCHEMA_VERSION}, got ${version}` 
      };
    }

    // Timestamp check
    if (typeof timestamp !== 'number') {
      return { success: false, draft: null, timestamp: null, error: 'Missing timestamp' };
    }

    // Validate draft structure
    if (!validateDraftStructure(draft)) {
      return { success: false, draft: null, timestamp: null, error: 'Invalid draft structure' };
    }

    return { success: true, draft, timestamp };
  } catch (e) {
    return { 
      success: false, 
      draft: null, 
      timestamp: null, 
      error: `Parse error: ${e instanceof Error ? e.message : 'Unknown error'}` 
    };
  }
}

/**
 * Save draft to localStorage
 * @param userId - User ID or null for anonymous
 * @param draft - The draft to save
 * @returns true if saved successfully
 */
export function saveDraftToStorage(userId: string | null, draft: ProposalDraft): boolean {
  try {
    const key = getDraftStorageKey(userId);
    const serialized = serializeDraft(draft);
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.error('Failed to save draft to localStorage:', e);
    return false;
  }
}

/**
 * Load draft from localStorage
 * @param userId - User ID or null for anonymous
 * @returns DeserializeResult with draft data if found and valid
 */
export function loadDraftFromStorage(userId: string | null): DeserializeResult {
  try {
    const key = getDraftStorageKey(userId);
    const raw = localStorage.getItem(key);
    return deserializeDraft(raw);
  } catch (e) {
    console.error('Failed to load draft from localStorage:', e);
    return { 
      success: false, 
      draft: null, 
      timestamp: null, 
      error: `Storage error: ${e instanceof Error ? e.message : 'Unknown error'}` 
    };
  }
}

/**
 * Clear draft from localStorage
 * @param userId - User ID or null for anonymous
 * @returns true if cleared successfully
 */
export function clearDraftFromStorage(userId: string | null): boolean {
  try {
    const key = getDraftStorageKey(userId);
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Failed to clear draft from localStorage:', e);
    return false;
  }
}

/**
 * Check if a draft has meaningful content (worth saving)
 * @param draft - The draft to check
 * @returns true if draft has content worth preserving
 */
export function draftHasContent(draft: ProposalDraft): boolean {
  // Has client name or address
  if (draft.clientName.trim() || draft.address.trim()) {
    return true;
  }

  // Has a service with trade/job type selected
  for (const service of draft.services) {
    if (service.tradeId || service.jobTypeId) {
      return true;
    }
  }

  // Has photos
  if (draft.photos.length > 0) {
    return true;
  }

  // Has enhanced scopes
  if (Object.keys(draft.enhancedScopes).length > 0) {
    return true;
  }

  return false;
}

/**
 * Check if two drafts are equal (for change detection)
 * @param a - First draft
 * @param b - Second draft
 * @returns true if drafts are equal
 */
export function draftsAreEqual(a: ProposalDraft, b: ProposalDraft): boolean {
  // Quick shallow checks first
  if (a.clientName !== b.clientName) return false;
  if (a.address !== b.address) return false;
  if (a.services.length !== b.services.length) return false;
  if (a.photos.length !== b.photos.length) return false;

  // Deep comparison via JSON (simple but effective for our use case)
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * Format a timestamp as a relative time string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string like "just now", "2 min ago", etc.
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 10000) { // Less than 10 seconds
    return 'just now';
  }

  if (diff < 60000) { // Less than 1 minute
    const seconds = Math.floor(diff / 1000);
    return `${seconds}s ago`;
  }

  if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min ago`;
  }

  if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // More than 1 day - show date
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}
