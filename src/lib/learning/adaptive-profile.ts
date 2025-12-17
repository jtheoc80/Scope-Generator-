/**
 * Adaptive User Profile System
 * 
 * Silently learns user preferences over time.
 * After 7 days of usage, the app becomes instinctive and
 * automatically applies learned defaults.
 * 
 * Learning Areas:
 * - Pricing patterns (always +10%, -5%, etc.)
 * - Scope preferences (always adds certain items, removes others)
 * - Photo organization preferences
 * - Common job types and their configurations
 * - Regional pricing adjustments
 * - Time-of-day patterns
 * - Seasonal patterns
 */

// ==========================================
// Types
// ==========================================

export interface UserProfile {
  userId: string;
  /** When user first started using the app */
  firstSeen: Date;
  /** Days of active usage */
  daysActive: number;
  /** Total actions recorded */
  totalActions: number;
  /** Is the learning period complete? (7+ days) */
  isAdapted: boolean;
  /** Confidence level (0-100) */
  confidence: number;
  /** Learned preferences */
  preferences: LearnedPreferences;
  /** Last updated */
  updatedAt: Date;
}

export interface LearnedPreferences {
  // Pricing
  pricing: {
    /** Default adjustment percentage from suggested price */
    defaultAdjustment: number;
    /** Per-job-type adjustments */
    byJobType: Record<string, number>;
    /** Regional adjustments */
    byRegion: Record<string, number>;
    /** Confidence in pricing predictions */
    confidence: number;
  };
  
  // Scope
  scope: {
    /** Items user always adds */
    alwaysAdd: string[];
    /** Items user always removes */
    alwaysRemove: string[];
    /** Per-job-type additions */
    addByJobType: Record<string, string[]>;
    /** Per-job-type removals */
    removeByJobType: Record<string, string[]>;
    /** Confidence in scope predictions */
    confidence: number;
  };
  
  // Photos
  photos: {
    /** Preferred category by photo position */
    categoryByPosition: Record<number, string>;
    /** Common captions by category */
    captionsByCategory: Record<string, string[]>;
    /** Confidence in photo predictions */
    confidence: number;
  };
  
  // Workflow
  workflow: {
    /** Preferred job types (most common) */
    commonJobTypes: string[];
    /** Common service areas (zipcodes) */
    commonAreas: string[];
    /** Average photos per proposal */
    avgPhotoCount: number;
    /** Average scope items per proposal */
    avgScopeItems: number;
  };
}

export interface ActionEvent {
  type: string;
  timestamp: Date;
  context: Record<string, unknown>;
  data: Record<string, unknown>;
}

// ==========================================
// Constants
// ==========================================

const LEARNING_PERIOD_DAYS = 7;
const MIN_ACTIONS_FOR_PATTERN = 3;
const HIGH_CONFIDENCE_THRESHOLD = 5;
const PATTERN_THRESHOLD = 0.7; // 70% consistency = pattern

// ==========================================
// Profile Management
// ==========================================

/**
 * Get or create user profile from localStorage
 */
export function getUserProfile(userId: string): UserProfile {
  if (typeof window === 'undefined') {
    return createEmptyProfile(userId);
  }

  const key = `adaptive_profile_${userId}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      const profile = JSON.parse(stored) as UserProfile;
      profile.firstSeen = new Date(profile.firstSeen);
      profile.updatedAt = new Date(profile.updatedAt);
      return updateProfileStatus(profile);
    } catch {
      return createEmptyProfile(userId);
    }
  }
  
  return createEmptyProfile(userId);
}

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  
  const key = `adaptive_profile_${profile.userId}`;
  profile.updatedAt = new Date();
  localStorage.setItem(key, JSON.stringify(profile));
}

/**
 * Create empty profile for new user
 */
function createEmptyProfile(userId: string): UserProfile {
  return {
    userId,
    firstSeen: new Date(),
    daysActive: 0,
    totalActions: 0,
    isAdapted: false,
    confidence: 0,
    preferences: {
      pricing: {
        defaultAdjustment: 0,
        byJobType: {},
        byRegion: {},
        confidence: 0,
      },
      scope: {
        alwaysAdd: [],
        alwaysRemove: [],
        addByJobType: {},
        removeByJobType: {},
        confidence: 0,
      },
      photos: {
        categoryByPosition: {},
        captionsByCategory: {},
        confidence: 0,
      },
      workflow: {
        commonJobTypes: [],
        commonAreas: [],
        avgPhotoCount: 0,
        avgScopeItems: 0,
      },
    },
    updatedAt: new Date(),
  };
}

/**
 * Update profile status (check if learning period complete)
 */
function updateProfileStatus(profile: UserProfile): UserProfile {
  const now = new Date();
  const daysSinceFirst = Math.floor(
    (now.getTime() - new Date(profile.firstSeen).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  profile.daysActive = daysSinceFirst;
  profile.isAdapted = daysSinceFirst >= LEARNING_PERIOD_DAYS && profile.totalActions >= 10;
  
  // Calculate overall confidence
  const confidenceFactors = [
    profile.preferences.pricing.confidence,
    profile.preferences.scope.confidence,
    profile.preferences.photos.confidence,
  ];
  profile.confidence = Math.round(
    confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length
  );
  
  return profile;
}

// ==========================================
// Action Tracking (Silent Background)
// ==========================================

/**
 * Get action history from localStorage
 */
function getActionHistory(userId: string): ActionEvent[] {
  if (typeof window === 'undefined') return [];
  
  const key = `adaptive_actions_${userId}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      const actions = JSON.parse(stored) as ActionEvent[];
      // Keep only last 30 days of actions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return actions.filter(a => new Date(a.timestamp) > thirtyDaysAgo);
    } catch {
      return [];
    }
  }
  
  return [];
}

/**
 * Save action to history
 */
function saveAction(userId: string, action: ActionEvent): void {
  if (typeof window === 'undefined') return;
  
  const key = `adaptive_actions_${userId}`;
  const history = getActionHistory(userId);
  history.push(action);
  
  // Keep only last 500 actions
  const trimmed = history.slice(-500);
  localStorage.setItem(key, JSON.stringify(trimmed));
}

/**
 * Track user action silently
 */
export function trackAction(
  userId: string,
  type: string,
  context: Record<string, unknown>,
  data: Record<string, unknown>
): void {
  const action: ActionEvent = {
    type,
    timestamp: new Date(),
    context,
    data,
  };
  
  // Save action
  saveAction(userId, action);
  
  // Update profile
  const profile = getUserProfile(userId);
  profile.totalActions++;
  
  // Learn from action
  learnFromAction(profile, action);
  
  // Save updated profile
  saveUserProfile(profile);
}

// ==========================================
// Learning Engine
// ==========================================

/**
 * Learn from a single action
 */
function learnFromAction(profile: UserProfile, action: ActionEvent): void {
  switch (action.type) {
    case 'price_adjust':
      learnPricingPattern(profile, action);
      break;
    case 'scope_add':
      learnScopeAddPattern(profile, action);
      break;
    case 'scope_remove':
      learnScopeRemovePattern(profile, action);
      break;
    case 'photo_categorize':
      learnPhotoPattern(profile, action);
      break;
    case 'proposal_create':
      learnWorkflowPattern(profile, action);
      break;
  }
}

/**
 * Learn pricing patterns
 */
function learnPricingPattern(profile: UserProfile, action: ActionEvent): void {
  const { adjustmentPercent, jobTypeId, zipcode } = action.data as {
    adjustmentPercent?: number;
    jobTypeId?: string;
    zipcode?: string;
  };
  
  if (adjustmentPercent === undefined) return;
  
  const prefs = profile.preferences.pricing;
  const history = getActionHistory(profile.userId)
    .filter(a => a.type === 'price_adjust');
  
  // Calculate average adjustment
  const adjustments = history
    .map(a => (a.data as { adjustmentPercent?: number }).adjustmentPercent)
    .filter((a): a is number => a !== undefined);
  
  if (adjustments.length >= MIN_ACTIONS_FOR_PATTERN) {
    prefs.defaultAdjustment = Math.round(
      adjustments.reduce((a, b) => a + b, 0) / adjustments.length
    );
    prefs.confidence = Math.min(100, adjustments.length * 10);
  }
  
  // Learn job-type specific adjustment
  if (jobTypeId) {
    const jobAdjustments = history
      .filter(a => (a.data as { jobTypeId?: string }).jobTypeId === jobTypeId)
      .map(a => (a.data as { adjustmentPercent?: number }).adjustmentPercent)
      .filter((a): a is number => a !== undefined);
    
    if (jobAdjustments.length >= MIN_ACTIONS_FOR_PATTERN) {
      prefs.byJobType[jobTypeId] = Math.round(
        jobAdjustments.reduce((a, b) => a + b, 0) / jobAdjustments.length
      );
    }
  }
  
  // Learn regional adjustment
  if (zipcode) {
    const regionAdjustments = history
      .filter(a => (a.data as { zipcode?: string }).zipcode === zipcode)
      .map(a => (a.data as { adjustmentPercent?: number }).adjustmentPercent)
      .filter((a): a is number => a !== undefined);
    
    if (regionAdjustments.length >= MIN_ACTIONS_FOR_PATTERN) {
      prefs.byRegion[zipcode] = Math.round(
        regionAdjustments.reduce((a, b) => a + b, 0) / regionAdjustments.length
      );
    }
  }
}

/**
 * Learn scope addition patterns
 */
function learnScopeAddPattern(profile: UserProfile, action: ActionEvent): void {
  const { scopeItem, jobTypeId } = action.data as {
    scopeItem?: string;
    jobTypeId?: string;
  };
  
  if (!scopeItem) return;
  
  const prefs = profile.preferences.scope;
  const history = getActionHistory(profile.userId)
    .filter(a => a.type === 'scope_add');
  
  // Count how often this item is added
  const itemCount = history.filter(
    a => (a.data as { scopeItem?: string }).scopeItem?.toLowerCase() === scopeItem.toLowerCase()
  ).length;
  
  // If added consistently, mark as "always add"
  if (itemCount >= HIGH_CONFIDENCE_THRESHOLD) {
    if (!prefs.alwaysAdd.includes(scopeItem)) {
      prefs.alwaysAdd.push(scopeItem);
    }
  }
  
  // Learn job-type specific additions
  if (jobTypeId) {
    const jobItems = history
      .filter(a => (a.data as { jobTypeId?: string }).jobTypeId === jobTypeId)
      .map(a => (a.data as { scopeItem?: string }).scopeItem)
      .filter((s): s is string => !!s);
    
    // Count occurrences
    const counts: Record<string, number> = {};
    for (const item of jobItems) {
      counts[item] = (counts[item] || 0) + 1;
    }
    
    // Items added 70%+ of the time for this job type
    const totalJobProposals = new Set(
      history
        .filter(a => (a.data as { jobTypeId?: string }).jobTypeId === jobTypeId)
        .map(a => (a.context as { proposalId?: string }).proposalId)
    ).size;
    
    if (totalJobProposals >= MIN_ACTIONS_FOR_PATTERN) {
      prefs.addByJobType[jobTypeId] = Object.entries(counts)
        .filter(([, count]) => count / totalJobProposals >= PATTERN_THRESHOLD)
        .map(([item]) => item);
    }
  }
  
  prefs.confidence = Math.min(100, history.length * 5);
}

/**
 * Learn scope removal patterns
 */
function learnScopeRemovePattern(profile: UserProfile, action: ActionEvent): void {
  const { scopeItem, jobTypeId } = action.data as {
    scopeItem?: string;
    jobTypeId?: string;
  };
  
  if (!scopeItem) return;
  
  const prefs = profile.preferences.scope;
  const history = getActionHistory(profile.userId)
    .filter(a => a.type === 'scope_remove');
  
  // Count how often this item is removed
  const itemCount = history.filter(
    a => (a.data as { scopeItem?: string }).scopeItem?.toLowerCase() === scopeItem.toLowerCase()
  ).length;
  
  // If removed consistently, mark as "always remove"
  if (itemCount >= HIGH_CONFIDENCE_THRESHOLD) {
    if (!prefs.alwaysRemove.includes(scopeItem)) {
      prefs.alwaysRemove.push(scopeItem);
    }
  }
  
  // Learn job-type specific removals
  if (jobTypeId) {
    const jobItems = history
      .filter(a => (a.data as { jobTypeId?: string }).jobTypeId === jobTypeId)
      .map(a => (a.data as { scopeItem?: string }).scopeItem)
      .filter((s): s is string => !!s);
    
    const counts: Record<string, number> = {};
    for (const item of jobItems) {
      counts[item] = (counts[item] || 0) + 1;
    }
    
    const totalJobProposals = new Set(
      history
        .filter(a => (a.data as { jobTypeId?: string }).jobTypeId === jobTypeId)
        .map(a => (a.context as { proposalId?: string }).proposalId)
    ).size;
    
    if (totalJobProposals >= MIN_ACTIONS_FOR_PATTERN) {
      prefs.removeByJobType[jobTypeId] = Object.entries(counts)
        .filter(([, count]) => count / totalJobProposals >= PATTERN_THRESHOLD)
        .map(([item]) => item);
    }
  }
}

/**
 * Learn photo categorization patterns
 */
function learnPhotoPattern(profile: UserProfile, action: ActionEvent): void {
  const { photoOrder, category, caption } = action.data as {
    photoOrder?: number;
    category?: string;
    caption?: string;
  };
  
  if (!photoOrder || !category) return;
  
  const prefs = profile.preferences.photos;
  const history = getActionHistory(profile.userId)
    .filter(a => a.type === 'photo_categorize');
  
  // Learn category by position
  const positionCategories = history
    .filter(a => (a.data as { photoOrder?: number }).photoOrder === photoOrder)
    .map(a => (a.data as { category?: string }).category)
    .filter((c): c is string => !!c);
  
  if (positionCategories.length >= MIN_ACTIONS_FOR_PATTERN) {
    // Find most common category for this position
    const counts: Record<string, number> = {};
    for (const cat of positionCategories) {
      counts[cat] = (counts[cat] || 0) + 1;
    }
    
    const [topCategory, topCount] = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (topCount / positionCategories.length >= PATTERN_THRESHOLD) {
      prefs.categoryByPosition[photoOrder] = topCategory;
    }
  }
  
  // Learn common captions by category
  if (caption && caption.length > 5) {
    if (!prefs.captionsByCategory[category]) {
      prefs.captionsByCategory[category] = [];
    }
    
    const captions = prefs.captionsByCategory[category];
    if (!captions.includes(caption) && captions.length < 10) {
      captions.push(caption);
    }
  }
  
  prefs.confidence = Math.min(100, history.length * 5);
}

/**
 * Learn workflow patterns
 */
function learnWorkflowPattern(profile: UserProfile, action: ActionEvent): void {
  const { jobTypeId, zipcode, photoCount, scopeCount } = action.data as {
    jobTypeId?: string;
    zipcode?: string;
    photoCount?: number;
    scopeCount?: number;
  };
  
  const prefs = profile.preferences.workflow;
  const history = getActionHistory(profile.userId)
    .filter(a => a.type === 'proposal_create');
  
  // Learn common job types
  const jobTypes = history
    .map(a => (a.data as { jobTypeId?: string }).jobTypeId)
    .filter((j): j is string => !!j);
  
  const jobCounts: Record<string, number> = {};
  for (const job of jobTypes) {
    jobCounts[job] = (jobCounts[job] || 0) + 1;
  }
  
  prefs.commonJobTypes = Object.entries(jobCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([job]) => job);
  
  // Learn common areas
  const areas = history
    .map(a => (a.data as { zipcode?: string }).zipcode)
    .filter((z): z is string => !!z);
  
  const areaCounts: Record<string, number> = {};
  for (const area of areas) {
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  }
  
  prefs.commonAreas = Object.entries(areaCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([area]) => area);
  
  // Learn averages
  const photoCounts = history
    .map(a => (a.data as { photoCount?: number }).photoCount)
    .filter((p): p is number => p !== undefined);
  
  if (photoCounts.length > 0) {
    prefs.avgPhotoCount = Math.round(
      photoCounts.reduce((a, b) => a + b, 0) / photoCounts.length
    );
  }
  
  const scopeCounts = history
    .map(a => (a.data as { scopeCount?: number }).scopeCount)
    .filter((s): s is number => s !== undefined);
  
  if (scopeCounts.length > 0) {
    prefs.avgScopeItems = Math.round(
      scopeCounts.reduce((a, b) => a + b, 0) / scopeCounts.length
    );
  }
}

// ==========================================
// Apply Learned Preferences
// ==========================================

/**
 * Get pricing adjustment based on learned preferences
 */
export function getLearnedPricingAdjustment(
  userId: string,
  jobTypeId?: string,
  zipcode?: string
): { adjustment: number; confidence: number } | null {
  const profile = getUserProfile(userId);
  
  // Only apply if adapted (7+ days)
  if (!profile.isAdapted) {
    return null;
  }
  
  const prefs = profile.preferences.pricing;
  
  // Try job-type specific first
  if (jobTypeId && prefs.byJobType[jobTypeId] !== undefined) {
    return {
      adjustment: prefs.byJobType[jobTypeId],
      confidence: prefs.confidence,
    };
  }
  
  // Try regional adjustment
  if (zipcode && prefs.byRegion[zipcode] !== undefined) {
    return {
      adjustment: prefs.byRegion[zipcode],
      confidence: prefs.confidence,
    };
  }
  
  // Fall back to default
  if (prefs.confidence >= 30) {
    return {
      adjustment: prefs.defaultAdjustment,
      confidence: prefs.confidence,
    };
  }
  
  return null;
}

/**
 * Get scope modifications based on learned preferences
 */
export function getLearnedScopeModifications(
  userId: string,
  currentScope: string[],
  jobTypeId?: string
): { add: string[]; remove: string[] } | null {
  const profile = getUserProfile(userId);
  
  // Only apply if adapted
  if (!profile.isAdapted) {
    return null;
  }
  
  const prefs = profile.preferences.scope;
  const scopeLower = new Set(currentScope.map(s => s.toLowerCase()));
  
  const add: string[] = [];
  const remove: string[] = [];
  
  // Always-add items
  for (const item of prefs.alwaysAdd) {
    if (!scopeLower.has(item.toLowerCase())) {
      add.push(item);
    }
  }
  
  // Job-type specific additions
  if (jobTypeId && prefs.addByJobType[jobTypeId]) {
    for (const item of prefs.addByJobType[jobTypeId]) {
      if (!scopeLower.has(item.toLowerCase()) && !add.includes(item)) {
        add.push(item);
      }
    }
  }
  
  // Always-remove items (just flag, don't auto-remove)
  for (const item of prefs.alwaysRemove) {
    if (scopeLower.has(item.toLowerCase())) {
      remove.push(item);
    }
  }
  
  // Job-type specific removals
  if (jobTypeId && prefs.removeByJobType[jobTypeId]) {
    for (const item of prefs.removeByJobType[jobTypeId]) {
      if (scopeLower.has(item.toLowerCase()) && !remove.includes(item)) {
        remove.push(item);
      }
    }
  }
  
  if (add.length === 0 && remove.length === 0) {
    return null;
  }
  
  return { add, remove };
}

/**
 * Get photo category based on learned preferences
 */
export function getLearnedPhotoCategory(
  userId: string,
  photoOrder: number
): { category: string; confidence: number } | null {
  const profile = getUserProfile(userId);
  
  // Only apply if adapted
  if (!profile.isAdapted) {
    return null;
  }
  
  const prefs = profile.preferences.photos;
  
  if (prefs.categoryByPosition[photoOrder]) {
    return {
      category: prefs.categoryByPosition[photoOrder],
      confidence: prefs.confidence,
    };
  }
  
  return null;
}

/**
 * Get learned captions for a category
 */
export function getLearnedCaptions(
  userId: string,
  category: string
): string[] {
  const profile = getUserProfile(userId);
  return profile.preferences.photos.captionsByCategory[category] || [];
}

/**
 * Check if user is in learning period
 */
export function isInLearningPeriod(userId: string): boolean {
  const profile = getUserProfile(userId);
  return !profile.isAdapted;
}

/**
 * Get learning progress
 */
export function getLearningProgress(userId: string): {
  daysActive: number;
  daysRemaining: number;
  actionsRecorded: number;
  isComplete: boolean;
  confidence: number;
} {
  const profile = getUserProfile(userId);
  
  return {
    daysActive: profile.daysActive,
    daysRemaining: Math.max(0, LEARNING_PERIOD_DAYS - profile.daysActive),
    actionsRecorded: profile.totalActions,
    isComplete: profile.isAdapted,
    confidence: profile.confidence,
  };
}

export const adaptiveProfile = {
  getUserProfile,
  saveUserProfile,
  trackAction,
  getLearnedPricingAdjustment,
  getLearnedScopeModifications,
  getLearnedPhotoCategory,
  getLearnedCaptions,
  isInLearningPeriod,
  getLearningProgress,
};

export default adaptiveProfile;
