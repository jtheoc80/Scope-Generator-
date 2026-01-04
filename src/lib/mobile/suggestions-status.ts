export type SuggestionsStatus =
  | "available"
  | "insufficient_photos"
  | "gated"
  | "queued"
  | "error"
  | "none";

export type DeriveSuggestionsStatusInput = {
  detectedIssuesCount: number;
  photosCount: number;
  aiSuggestionsCount: number;

  /**
   * If the UI is already showing any “AI Suggestion” content, we must not
   * claim suggestions are unavailable. Today this includes e.g. `suggestedProblem`.
   */
  hasAnyAiSuggestionContent: boolean;

  /**
   * True when the suggestions pipeline is still running (async job, polling, etc).
   */
  isProcessing: boolean;

  /**
   * True when the user is not entitled / feature is gated.
   * (Backend should ideally return an explicit reason enum.)
   */
  isGated: boolean;

  /**
   * True when upstream errors prevented generation.
   */
  hasError: boolean;
};

export const REQUIRED_MIN_PHOTOS_FOR_SUGGESTIONS = 2;

export function deriveSuggestionsStatus(input: DeriveSuggestionsStatusInput): SuggestionsStatus {
  // 1) If any suggestion content is already present, it's "available" for UX purposes.
  if (input.hasAnyAiSuggestionContent || input.aiSuggestionsCount > 0) return "available";

  // 2) Follow the requested priority order for "missing" reasons.
  if (input.isGated) return "gated";

  if (input.photosCount > 0 && input.photosCount < REQUIRED_MIN_PHOTOS_FOR_SUGGESTIONS) {
    return "insufficient_photos";
  }

  if (input.isProcessing) return "queued";

  if (input.hasError) return "error";

  return "none";
}

