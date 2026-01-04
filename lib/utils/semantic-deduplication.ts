/**
 * Semantic deduplication utilities for findings and issues.
 * 
 * This module provides generic functions to deduplicate semantically similar
 * items based on their text content, using keyword extraction and semantic keys.
 */

/**
 * Generic item interface for deduplication.
 * Items must have confidence, category (including "damage"), and photoIds.
 */
export interface DeduplicatableItem {
  confidence: number;
  category: string;
  photoIds: number[];
}

/**
 * Extract normalized keywords from text for semantic deduplication.
 * Returns a sorted, unique set of meaningful words.
 */
function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  // Remove common filler words and punctuation
  const stopWords = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "need", "needs",
    "to", "of", "in", "for", "on", "with", "at", "by", "from", "or", "and",
    "possibly", "maybe", "likely", "detected", "issue", "damage", "problem",
    "some", "this", "that", "it", "its", "there", "here", "very", "just"
  ]);
  
  const words = lower
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  return [...new Set(words)].sort();
}

/**
 * Generate a semantic key for deduplication based on object + problem keywords.
 * This groups items that refer to the same object with the same problem.
 */
function getSemanticKey(text: string): string {
  const keywords = extractKeywords(text);
  
  // Common object keywords (what the issue is about)
  const objectKeywords = [
    "faucet", "sink", "toilet", "tub", "shower", "bathtub", "drain", "pipe",
    "wall", "ceiling", "floor", "door", "window", "cabinet", "counter",
    "light", "outlet", "switch", "fixture", "handle", "knob", "hinge",
    "trim", "baseboard", "molding", "tile", "grout", "caulk", "paint"
  ];
  
  // Problem keywords (what's wrong)
  const problemKeywords = [
    "leak", "leaking", "leaky", "drip", "dripping",
    "stain", "stained", "staining", "discolor", "discolored",
    "crack", "cracked", "broken", "damage", "damaged",
    "peel", "peeling", "chip", "chipped", "worn", "wear",
    "rust", "rusty", "corrode", "corroded", "corrosion",
    "mold", "mildew", "rot", "rotted", "rotting",
    "loose", "missing", "dated", "old", "outdated",
    "replace", "replacement", "repair", "fix", "upgrade",
    "clean", "cleaning", "refinish", "refinishing"
  ];
  
  const foundObjects = keywords.filter(k => objectKeywords.some(ok => k.includes(ok) || ok.includes(k)));
  const foundProblems = keywords.filter(k => problemKeywords.some(pk => k.includes(pk) || pk.includes(k)));
  
  // Create a semantic key from object + problem
  const objectKey = foundObjects.length > 0 ? foundObjects.sort().join("+") : "general";
  const problemKey = foundProblems.length > 0 ? foundProblems.sort().join("+") : "issue";
  
  return `${objectKey}:${problemKey}`;
}

/**
 * Deduplicate items that are semantically similar.
 * Keeps the item with the best description (shorter, cleaner).
 * 
 * @param items - Array of items to deduplicate
 * @param getTextField - Function to extract the text field from an item (e.g., item.label or item.issue)
 * @returns Deduplicated array of items
 */
export function deduplicateItems<T extends DeduplicatableItem>(
  items: T[],
  getTextField: (item: T) => string
): T[] {
  const semanticGroups = new Map<string, T[]>();
  
  for (const item of items) {
    const text = getTextField(item);
    const key = getSemanticKey(text);
    if (!semanticGroups.has(key)) {
      semanticGroups.set(key, []);
    }
    semanticGroups.get(key)!.push(item);
  }
  
  const deduplicated: T[] = [];
  
  for (const [, group] of semanticGroups) {
    if (group.length === 1) {
      deduplicated.push(group[0]);
    } else {
      // Pick the best representative from the group:
      // 1. Prefer "damage" category (more specific/actionable)
      // 2. Then prefer higher confidence
      // 3. Then prefer shorter, cleaner labels (less verbose)
      const best = [...group].sort((a, b) => {
        // Prefer damage category
        const aIsDamage = a.category === "damage" ? 1 : 0;
        const bIsDamage = b.category === "damage" ? 1 : 0;
        if (aIsDamage !== bIsDamage) return bIsDamage - aIsDamage;
        
        // Prefer higher confidence
        if (Math.abs(a.confidence - b.confidence) > 0.1) {
          return b.confidence - a.confidence;
        }
        
        // Prefer shorter labels (usually cleaner/more specific)
        return getTextField(a).length - getTextField(b).length;
      })[0];
      
      // Merge photoIds from all duplicates into a copy of the best item
      const allPhotoIds = new Set<number>();
      for (const item of group) {
        for (const photoId of item.photoIds) {
          allPhotoIds.add(photoId);
        }
      }
      
      // Create a shallow copy to avoid mutating the original object
      deduplicated.push({ ...best, photoIds: [...allPhotoIds] });
    }
  }
  
  return deduplicated;
}
