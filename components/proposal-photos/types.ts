/**
 * Types for proposal photo layout system
 * 
 * Photos support trust without turning the proposal into a photo dump.
 * Layout supports: hero banner, existing conditions grid, inline scope photos, and appendix gallery.
 */

export type PhotoCategory = 
  | 'hero'           // Wide shot for cover banner (1 photo)
  | 'existing'       // Existing conditions (2-6 photos)
  | 'shower'         // Scope section: Shower System
  | 'vanity'         // Scope section: Vanity & Tops
  | 'flooring'       // Scope section: Flooring
  | 'tub'            // Scope section: Tub
  | 'toilet'         // Scope section: Toilet
  | 'plumbing'       // Scope section: Plumbing
  | 'electrical'     // Scope section: Electrical
  | 'damage'         // Scope section: Damage/Repairs
  | 'kitchen'        // Scope section: Kitchen
  | 'cabinets'       // Scope section: Cabinets
  | 'countertops'    // Scope section: Countertops
  | 'roofing'        // Scope section: Roofing
  | 'siding'         // Scope section: Siding
  | 'windows'        // Scope section: Windows/Doors
  | 'hvac'           // Scope section: HVAC
  | 'other';         // Appendix/remaining photos

export interface ProposalPhoto {
  id: string;
  url: string;
  category: PhotoCategory;
  caption?: string;
  /** Optional: which scope section this photo relates to (for matching) */
  scopeSection?: string;
  /** Order within category (lower = first) */
  order?: number;
  /** Original filename for reference */
  filename?: string;
  /** When the photo was taken/uploaded */
  createdAt?: Date;
}

/**
 * Organized photos for proposal layout
 */
export interface OrganizedPhotos {
  /** Single hero photo for cover banner */
  hero: ProposalPhoto | null;
  /** 2-6 photos for existing conditions grid */
  existingConditions: ProposalPhoto[];
  /** Photos mapped by scope section keyword */
  scopePhotos: Record<string, ProposalPhoto[]>;
  /** All remaining photos for appendix gallery */
  appendix: ProposalPhoto[];
}

/**
 * Common caption templates for existing conditions
 */
export const EXISTING_CONDITION_CAPTIONS: Record<string, string> = {
  shower: 'Current tub/shower surround',
  tub: 'Existing tub condition',
  vanity: 'Flooring condition near vanity',
  flooring: 'Current flooring',
  damage: 'Water staining at curb',
  toilet: 'Existing toilet area',
  plumbing: 'Plumbing condition',
  electrical: 'Electrical panel/fixtures',
  kitchen: 'Current kitchen layout',
  cabinets: 'Existing cabinetry',
  countertops: 'Countertop condition',
  roofing: 'Roof condition overview',
  siding: 'Exterior siding',
  windows: 'Window/door condition',
  hvac: 'HVAC system',
};

/**
 * Scope section keywords for photo matching
 */
export const SCOPE_SECTION_KEYWORDS: Record<string, string[]> = {
  shower: ['shower', 'tub/shower', 'shower system', 'shower surround', 'shower pan', 'shower door'],
  vanity: ['vanity', 'vanities', 'sink', 'bathroom sink', 'countertop'],
  flooring: ['floor', 'flooring', 'tile', 'lvp', 'vinyl', 'hardwood'],
  tub: ['tub', 'bathtub', 'soaking tub', 'freestanding tub'],
  toilet: ['toilet', 'wc', 'commode'],
  plumbing: ['plumbing', 'pipe', 'drain', 'water line', 'supply line', 'rough-in'],
  electrical: ['electrical', 'outlet', 'switch', 'lighting', 'fixture', 'gfci'],
  damage: ['damage', 'repair', 'rot', 'mold', 'water damage', 'stain'],
  kitchen: ['kitchen', 'cook', 'range', 'stove', 'oven'],
  cabinets: ['cabinet', 'drawer', 'storage', 'cupboard'],
  countertops: ['countertop', 'granite', 'quartz', 'marble', 'laminate'],
  roofing: ['roof', 'shingle', 'flashing', 'gutter', 'soffit', 'fascia'],
  siding: ['siding', 'exterior', 'cladding'],
  windows: ['window', 'door', 'sliding', 'entry'],
  hvac: ['hvac', 'heating', 'cooling', 'duct', 'vent', 'furnace', 'ac'],
};

/**
 * Organize raw photos into proposal layout structure
 */
export function organizePhotosForProposal(
  photos: ProposalPhoto[],
  scopeItems: string[] = []
): OrganizedPhotos {
  // Sort photos by order, then by category
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });

  // Find hero photo (explicitly marked or first wide/site shot)
  const heroPhoto = sortedPhotos.find(p => p.category === 'hero') || null;

  // Find existing conditions photos (explicitly marked)
  const existingPhotos = sortedPhotos
    .filter(p => p.category === 'existing')
    .slice(0, 6); // Max 6 for existing conditions

  // Build scope photos map
  const scopePhotos: Record<string, ProposalPhoto[]> = {};
  const usedPhotoIds = new Set<string>();

  if (heroPhoto) usedPhotoIds.add(heroPhoto.id);
  existingPhotos.forEach(p => usedPhotoIds.add(p.id));

  // Match photos to scope sections
  for (const scopeItem of scopeItems) {
    const scopeLower = scopeItem.toLowerCase();
    
    // Find matching category for this scope item
    for (const [category, keywords] of Object.entries(SCOPE_SECTION_KEYWORDS)) {
      if (keywords.some(kw => scopeLower.includes(kw))) {
        // Find photos matching this category
        const matchingPhotos = sortedPhotos.filter(p => 
          !usedPhotoIds.has(p.id) && 
          (p.category === category || p.scopeSection?.toLowerCase().includes(category))
        );

        if (matchingPhotos.length > 0) {
          const photoToUse = matchingPhotos[0];
          if (!scopePhotos[scopeItem]) {
            scopePhotos[scopeItem] = [];
          }
          scopePhotos[scopeItem].push(photoToUse);
          usedPhotoIds.add(photoToUse.id);
        }
        break;
      }
    }
  }

  // All remaining photos go to appendix
  const appendixPhotos = sortedPhotos.filter(p => !usedPhotoIds.has(p.id));

  return {
    hero: heroPhoto,
    existingConditions: existingPhotos,
    scopePhotos,
    appendix: appendixPhotos,
  };
}

/**
 * Generate a smart caption for a photo based on its category
 */
export function generatePhotoCaption(photo: ProposalPhoto): string {
  if (photo.caption) return photo.caption;
  
  const categoryCaption = EXISTING_CONDITION_CAPTIONS[photo.category];
  if (categoryCaption) return categoryCaption;
  
  return 'Site photo';
}
