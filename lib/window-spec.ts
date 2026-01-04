/**
 * Window Specification Constants and Helpers
 * Used for Window Replacement job type pricing and scope generation.
 */

/**
 * Predefined window size presets
 * Format: "WxH" where W = width in inches, H = height in inches
 */
export const WINDOW_SIZE_PRESETS = [
  { value: "24x36", label: '24" × 36"', width: 24, height: 36 },
  { value: "28x54", label: '28" × 54"', width: 28, height: 54 },
  { value: "30x60", label: '30" × 60"', width: 30, height: 60 },
  { value: "32x60", label: '32" × 60"', width: 32, height: 60 },
  { value: "36x60", label: '36" × 60"', width: 36, height: 60 },
  { value: "36x72", label: '36" × 72"', width: 36, height: 72 },
  { value: "48x60", label: '48" × 60"', width: 48, height: 60 },
  { value: "60x60", label: '60" × 60"', width: 60, height: 60 },
  { value: "custom", label: "Custom Size", width: 0, height: 0 },
] as const;

export type WindowSizePresetValue = typeof WINDOW_SIZE_PRESETS[number]["value"];

/**
 * Default window configuration values
 */
export const WINDOW_DEFAULTS = {
  quantity: 1,
  sizePreset: "30x60" as WindowSizePresetValue,
  minQuantity: 1,
  maxQuantity: 50,
  minCustomDimension: 12, // inches
  maxCustomDimension: 120, // inches
};

/**
 * Size multipliers based on window area
 * - small: <= 30x54 (1620 sq in)
 * - standard: 30x60 to 36x72 (1800 - 2592 sq in) 
 * - large: >= 48x60 (2880 sq in)
 */
export const WINDOW_SIZE_MULTIPLIERS = {
  small: 0.9,
  standard: 1.0,
  large: 1.2,
} as const;

/**
 * Calculate window area in square inches
 */
export function calculateWindowArea(widthIn: number, heightIn: number): number {
  return widthIn * heightIn;
}

/**
 * Get the size category (small/standard/large) based on dimensions
 */
export function getWindowSizeCategory(
  widthIn: number,
  heightIn: number
): keyof typeof WINDOW_SIZE_MULTIPLIERS {
  const area = calculateWindowArea(widthIn, heightIn);

  // small: <= 30x54 (1620 sq in)
  if (area <= 1620) {
    return "small";
  }

  // large: >= 48x60 (2880 sq in)
  if (area >= 2880) {
    return "large";
  }

  // standard: everything in between
  return "standard";
}

/**
 * Get the price multiplier based on window size
 */
export function getWindowSizeMultiplier(widthIn: number, heightIn: number): number {
  const category = getWindowSizeCategory(widthIn, heightIn);
  return WINDOW_SIZE_MULTIPLIERS[category];
}

/**
 * Get dimensions from a preset value
 * Returns null if preset is "custom" or not found
 */
export function getDimensionsFromPreset(
  preset: WindowSizePresetValue
): { width: number; height: number } | null {
  if (preset === "custom") {
    return null;
  }
  const found = WINDOW_SIZE_PRESETS.find((p) => p.value === preset);
  if (!found || found.value === "custom") {
    return null;
  }
  return { width: found.width, height: found.height };
}

/**
 * Format window spec for display in scope text and preview
 * 
 * @param quantity - Number of windows
 * @param sizePreset - Preset value (e.g., "30x60", "custom")
 * @param customWidthIn - Custom width (only used if preset is "custom")
 * @param customHeightIn - Custom height (only used if preset is "custom")
 * @returns Formatted string like "3 windows (30" × 60")" or "1 window (custom 42" × 48")"
 */
export function formatWindowSpec(
  quantity: number,
  sizePreset: WindowSizePresetValue | string,
  customWidthIn?: number,
  customHeightIn?: number
): string {
  const windowWord = quantity === 1 ? "window" : "windows";

  let sizeStr: string;
  if (sizePreset === "custom" && customWidthIn && customHeightIn) {
    sizeStr = `custom ${customWidthIn}" × ${customHeightIn}"`;
  } else {
    const preset = WINDOW_SIZE_PRESETS.find((p) => p.value === sizePreset);
    if (preset && preset.value !== "custom") {
      sizeStr = preset.label;
    } else {
      // Fallback: try to parse the preset as "WxH"
      const match = sizePreset.match(/^(\d+)x(\d+)$/);
      if (match) {
        sizeStr = `${match[1]}" × ${match[2]}"`;
      } else {
        sizeStr = "standard size";
      }
    }
  }

  return `${quantity} ${windowWord} (${sizeStr})`;
}

/**
 * Format short window spec (for headers/summaries)
 * 
 * @returns e.g., "3 windows, 30×60"
 */
export function formatWindowSpecShort(
  quantity: number,
  sizePreset: WindowSizePresetValue | string,
  customWidthIn?: number,
  customHeightIn?: number
): string {
  const windowWord = quantity === 1 ? "window" : "windows";

  let sizeStr: string;
  if (sizePreset === "custom" && customWidthIn && customHeightIn) {
    sizeStr = `${customWidthIn}×${customHeightIn}`;
  } else if (sizePreset !== "custom") {
    // Use the WxH format directly
    sizeStr = sizePreset.replace("x", "×");
  } else {
    sizeStr = "custom";
  }

  return `${quantity} ${windowWord}, ${sizeStr}`;
}

/**
 * Validate window quantity
 */
export function isValidWindowQuantity(quantity: number): boolean {
  return (
    Number.isInteger(quantity) &&
    quantity >= WINDOW_DEFAULTS.minQuantity &&
    quantity <= WINDOW_DEFAULTS.maxQuantity
  );
}

/**
 * Validate custom window dimensions
 */
export function isValidCustomDimension(dimension: number): boolean {
  return (
    Number.isFinite(dimension) &&
    dimension >= WINDOW_DEFAULTS.minCustomDimension &&
    dimension <= WINDOW_DEFAULTS.maxCustomDimension
  );
}

/**
 * Get effective dimensions for pricing calculations
 * Handles both preset and custom sizes
 */
export function getEffectiveDimensions(
  sizePreset: WindowSizePresetValue | string,
  customWidthIn?: number,
  customHeightIn?: number
): { width: number; height: number } {
  if (sizePreset === "custom" && customWidthIn && customHeightIn) {
    return { width: customWidthIn, height: customHeightIn };
  }

  const presetDims = getDimensionsFromPreset(sizePreset as WindowSizePresetValue);
  if (presetDims) {
    return presetDims;
  }

  // Default to standard 30x60 if invalid
  return { width: 30, height: 60 };
}
