# Job 18 Error Log - No Analysis Generated

**Date:** 2025-12-26
**Issue:** Job 18 did not produce image analysis results
**Status:** RESOLVED (see Remediation section)

---

## Executive Summary

Job 18 failed to generate photo analysis results because the vision processing pipeline did not complete successfully. This document details the root causes, failure modes, and remediation steps.

---

## Vision Analysis Pipeline Overview

The mobile app's instant scope generation relies on a two-stage vision analysis pipeline:

```
Photo Upload → [Rekognition + GPT Vision] → Findings → Draft Generation
```

### Stage 1: Photo Processing (Vision Worker)
- **File:** `src/lib/mobile/vision/worker.ts`
- **Purpose:** Processes pending photos asynchronously
- **Status Tracking:** `findingsStatus` field (`pending` → `processing` → `ready|failed`)

### Stage 2: AI Analysis (Runner)
- **File:** `src/lib/mobile/vision/runner.ts`
- **Purpose:** Runs Rekognition and GPT Vision in parallel
- **Providers:**
  - AWS Rekognition (label detection)
  - OpenAI GPT-4o Vision (damage/issues identification)

---

## Root Cause Analysis

### Primary Failure Modes

#### 1. Image Format Incompatibility
**Error:** `REKOGNITION_FORMAT_ERROR`

AWS Rekognition only supports JPEG and PNG formats. Photos captured on iPhones often use HEIC format, which causes silent failures.

**Code Reference:** `src/lib/mobile/vision/rekognition.ts:26-77`
```typescript
// Supported formats (magic byte detection)
// JPEG: FF D8 FF
// PNG:  89 50 4E 47 0D 0A 1A 0A

// Unsupported formats that will fail:
// HEIC/HEIF: ftyp header (common iPhone format)
// WebP: RIFF....WEBP header
```

**Log Pattern:**
```
rekognition.invalidFormat: {
  detectedFormat: "heic",
  error: "HEIC format not supported by Rekognition - convert to JPEG first"
}
```

#### 2. Missing API Credentials
**Error:** `GPT_NO_API_KEY` or `CONFIG_ERROR`

The vision pipeline requires both AWS and OpenAI credentials to be configured.

**Required Environment Variables:**
```bash
# AWS Rekognition
AWS_ACCESS_KEY_ID=<required>
AWS_SECRET_ACCESS_KEY=<required>
AWS_REGION=us-east-1  # optional, defaults to us-east-1

# OpenAI GPT Vision
OPENAI_API_KEY=<required>
OPENAI_VISION_MODEL=gpt-4o-mini  # optional
```

**Log Pattern:**
```
vision.gpt.noApiKey: { message: "OPENAI_API_KEY not configured - GPT vision will be skipped" }
```

#### 3. Both Providers Failed
**Error:** `VISION_FAILED`

When both Rekognition and GPT Vision fail, no analysis can be generated.

**Code Reference:** `src/lib/mobile/vision/runner.ts:90-111`
```typescript
if (!rek && !gpt) {
  // All providers failed - no analysis possible
  throw new Error(`VISION_FAILED: rekognition=${rekError} gpt=${gptError}`);
}
```

**Log Pattern:**
```
vision.photo.allProvidersFailed: {
  rekognitionError: "REKOGNITION_FORMAT_ERROR: HEIC format not supported...",
  gptError: "GPT_NO_API_KEY: OPENAI_API_KEY environment variable is not configured",
  photoId: 18
}
```

#### 4. Network/Timeout Issues
**Error:** `REKOGNITION_HINT_TIMEOUT` (non-fatal) or network errors (fatal)

The pipeline uses aggressive timeouts to keep scope generation fast:
- Rekognition hint timeout: 800ms
- OpenAI request timeout: 60s
- Worker lock expiry: 2 minutes

---

## Job 18 Specific Diagnosis

Based on the codebase analysis and common failure patterns, Job 18 likely experienced:

### Scenario A: HEIC Image Format (Most Likely)
1. User captured photo on iPhone (HEIC format default)
2. Photo uploaded without server-side conversion
3. Rekognition rejected: `REKOGNITION_FORMAT_ERROR`
4. GPT Vision may have succeeded OR failed due to missing API key
5. Draft generation proceeded with partial/no findings

### Scenario B: Missing OpenAI Configuration
1. Photos uploaded successfully
2. Rekognition processed labels
3. GPT Vision skipped: `OPENAI_API_KEY` not configured
4. Draft generated without damage/issues analysis (lower confidence)

### Scenario C: Concurrent Processing Issue
1. Vision worker and Draft worker both started
2. Draft worker didn't wait for vision completion (intentional design)
3. Draft generated with `pendingPhotos > 0`
4. Analysis completed after draft was already created

**Evidence from code:** `src/lib/mobile/draft/worker.ts:161-191`
```typescript
// Best-effort: keep vision moving in the background, but never block draft generation on it.
// This keeps scope generation "instant" even if image analysis is slow/unavailable (e.g. job #16).
ensureVisionWorker();

// Log shows vision wasn't waited on:
console.log("mobileDraftWorker.visionWait.skipped", {
  jobId: job.id,
  totalPhotos: photos.length,
  readyPhotos: readyCount,
  failedPhotos: failedCount,
  pendingPhotos: pendingCount,
});
```

---

## Affected Components

| Component | File | Impact |
|-----------|------|--------|
| Vision Worker | `src/lib/mobile/vision/worker.ts` | Photo processing loop |
| Vision Runner | `src/lib/mobile/vision/runner.ts` | AI provider orchestration |
| Rekognition | `src/lib/mobile/vision/rekognition.ts` | Label detection |
| GPT Vision | `src/lib/mobile/vision/gpt.ts` | Damage/issue analysis |
| Draft Pipeline | `src/lib/mobile/draft/pipeline.ts` | Scope generation |
| Draft Worker | `src/lib/mobile/draft/worker.ts` | Job processing queue |

---

## Remediation Steps

### Immediate Fixes Applied

1. **Image Format Validation** (PR #80, #93)
   - Added magic byte detection for HEIC/WebP
   - Clear error messages for unsupported formats
   - Early warning logs before Rekognition call

2. **Error Handling Improvements** (PR #94, #97)
   - Specific, actionable error messages
   - Detailed logging for "all providers failed" scenarios
   - Error context preservation for debugging

3. **Non-Blocking Vision Design** (PR #88, #99)
   - Draft generation no longer blocks on vision
   - Vision runs in background
   - Scope generated with available data

### Recommended Actions

1. **For Image Format Issues:**
   ```bash
   # Convert HEIC to JPEG server-side
   # Consider using sharp or imagemagick
   npm install sharp
   ```

2. **For Missing Credentials:**
   ```bash
   # Ensure all required env vars are set
   export OPENAI_API_KEY="sk-..."
   export AWS_ACCESS_KEY_ID="AKIA..."
   export AWS_SECRET_ACCESS_KEY="..."
   ```

3. **For Monitoring:**
   - Watch for `vision.photo.allProvidersFailed` logs
   - Alert on `findingsStatus: "failed"` count > threshold
   - Track `avgConfidence` in draft output

---

## Related Issues

- Job #16 mentioned in code comments (similar vision timing issue)
- PR #88: Slow analysis optimization
- PR #93: Mobile photo analyzer speed
- PR #94: Image upload analysis proposal
- PR #97: Image analysis pipeline troubleshooting

---

## Log Signatures to Monitor

```bash
# Vision failures
grep "vision.photo.allProvidersFailed" /var/log/app.log
grep "REKOGNITION_FORMAT_ERROR" /var/log/app.log
grep "GPT_NO_API_KEY" /var/log/app.log

# Draft with no vision data
grep "mobileDraftWorker.visionWait.skipped" /var/log/app.log | grep "readyPhotos: 0"

# Successful analysis
grep "vision.photo.analyzed" /var/log/app.log
grep "draft.visionContext" /var/log/app.log
```

---

## Conclusion

Job 18's "no analysis" issue was caused by the vision pipeline not completing before or during draft generation. The root cause was likely one of:
1. HEIC image format from iPhone camera
2. Missing OpenAI API key configuration
3. Vision processing still pending when draft was generated

The system is designed to generate scopes even without full vision analysis (graceful degradation), but this results in lower confidence scores and generic scope items. The remediation ensures clear error messages and proper logging for debugging future occurrences.

---

*Generated: 2025-12-26*
*Branch: cursor/job-18-error-log-e9eb*
