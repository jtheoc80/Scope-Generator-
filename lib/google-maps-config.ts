/**
 * Shared Google Maps configuration
 * Centralizes library loading to avoid conflicts from multiple loaders
 */

// Libraries must be defined outside component to avoid re-renders
// This array is shared across all Google Maps usages in the app
export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing")[] = [
  "places",
  "geometry",
  "drawing",
];

// Type for the libraries tuple (for type safety with useJsApiLoader)
export type GoogleMapsLibraries = typeof GOOGLE_MAPS_LIBRARIES;

// Google Maps loader ID - must be consistent across all usages
export const GOOGLE_MAPS_LOADER_ID = "google-maps-script";
