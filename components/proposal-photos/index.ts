/**
 * Proposal Photo Layout Components
 * 
 * A collection of components for displaying photos in proposals.
 * Supports trust-building without turning the proposal into a photo dump.
 * 
 * Layout structure:
 * 1. Cover/Header - Hero photo as banner with logo/customer info
 * 2. Existing Conditions - 2-6 photos in a clean grid with captions
 * 3. Scope Sections - 1-2 photos per scope item (optional)
 * 4. Appendix Gallery - All remaining photos as thumbnails with lightbox
 */

// Types
export type { 
  ProposalPhoto, 
  PhotoCategory, 
  OrganizedPhotos 
} from './types';

export { 
  organizePhotosForProposal, 
  generatePhotoCaption,
  EXISTING_CONDITION_CAPTIONS,
  SCOPE_SECTION_KEYWORDS,
} from './types';

// Components
export { HeroPhoto } from './hero-photo';
export { ExistingConditionsGrid } from './existing-conditions-grid';
export { ScopePhotoInline } from './scope-photo-inline';
export { AppendixGallery } from './appendix-gallery';
