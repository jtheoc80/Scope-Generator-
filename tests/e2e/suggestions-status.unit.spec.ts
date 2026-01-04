import { test, expect } from "@playwright/test";
import { deriveSuggestionsStatus } from "../../src/lib/mobile/suggestions-status";

test.describe("deriveSuggestionsStatus (pure)", () => {
  test("detections present + suggestions empty + photoCount=1 -> insufficient_photos", () => {
    expect(
      deriveSuggestionsStatus({
        detectedIssuesCount: 3,
        photosCount: 1,
        aiSuggestionsCount: 0,
        hasAnyAiSuggestionContent: false,
        isProcessing: false,
        isGated: false,
        hasError: false,
      })
    ).toBe("insufficient_photos");
  });

  test("detections present + suggestions present -> available", () => {
    expect(
      deriveSuggestionsStatus({
        detectedIssuesCount: 2,
        photosCount: 3,
        aiSuggestionsCount: 2,
        hasAnyAiSuggestionContent: false,
        isProcessing: false,
        isGated: false,
        hasError: false,
      })
    ).toBe("available");
  });

  test("detections present + gated flag -> gated", () => {
    expect(
      deriveSuggestionsStatus({
        detectedIssuesCount: 5,
        photosCount: 4,
        aiSuggestionsCount: 0,
        hasAnyAiSuggestionContent: false,
        isProcessing: false,
        isGated: true,
        hasError: false,
      })
    ).toBe("gated");
  });
});

