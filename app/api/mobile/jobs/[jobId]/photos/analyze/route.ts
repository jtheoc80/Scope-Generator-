import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { mobileJobPhotos } from "@shared/schema";
import { and, desc, eq, isNull, lte, or } from "drizzle-orm";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { ensureVisionWorker } from "@/src/lib/mobile/vision/worker";
import { runVisionForPhoto } from "@/src/lib/mobile/vision/runner";

export type DetectedIssue = {
  id: string;
  label: string;
  description?: string;
  confidence: number;
  category: "damage" | "repair" | "maintenance" | "upgrade" | "inspection" | "other";
  photoIds: number[];
};

export type AnalyzeResponse = {
  status: "ready" | "analyzing" | "no_photos";
  detectedIssues: DetectedIssue[];
  photosAnalyzed: number;
  photosTotal: number;
  suggestedProblem?: string;
  needsMorePhotos?: string[];
};

const LOCK_EXPIRY_MS = 2 * 60 * 1000;

async function lockNextPhotos(params: {
  jobId: number;
  lockedBy: string;
  now: Date;
  lockExpiry: Date;
  limit: number;
}): Promise<(typeof mobileJobPhotos.$inferSelect)[]> {
  const candidates = await db
    .select()
    .from(mobileJobPhotos)
    .where(
      and(
        eq(mobileJobPhotos.jobId, params.jobId),
        or(
          eq(mobileJobPhotos.findingsStatus, "pending"),
          and(
            eq(mobileJobPhotos.findingsStatus, "processing"),
            or(isNull(mobileJobPhotos.findingsLockedAt), lte(mobileJobPhotos.findingsLockedAt, params.lockExpiry))
          )
        ),
        or(isNull(mobileJobPhotos.findingsNextAttemptAt), lte(mobileJobPhotos.findingsNextAttemptAt, params.now))
      )
    )
    .orderBy(desc(mobileJobPhotos.createdAt))
    .limit(params.limit * 2);

  const lockedPhotos: (typeof mobileJobPhotos.$inferSelect)[] = [];

  for (const photo of candidates) {
    if (lockedPhotos.length >= params.limit) break;

    const [locked] = await db
      .update(mobileJobPhotos)
      .set({
        findingsStatus: "processing",
        findingsLockedBy: params.lockedBy,
        findingsLockedAt: params.now,
        findingsAttempts: (photo.findingsAttempts ?? 0) + 1,
      })
      .where(
        and(
          eq(mobileJobPhotos.id, photo.id),
          or(isNull(mobileJobPhotos.findingsLockedAt), lte(mobileJobPhotos.findingsLockedAt, params.lockExpiry))
        )
      )
      .returning();

    if (locked) lockedPhotos.push(locked);
  }

  return lockedPhotos;
}

async function advanceAnalysis(params: { jobId: number; requestId: string; maxToProcess: number }) {
  // Best-effort: start the in-process worker (useful on Node deployments).
  // On serverless, this likely doesn't persist; the inline processing below still advances progress.
  ensureVisionWorker();

  const now = new Date();
  const lockExpiry = new Date(now.getTime() - LOCK_EXPIRY_MS);
  const lockedBy = `api-${params.requestId}-${Math.random().toString(16).slice(2)}`;

  let processed = 0;
  const startTime = Date.now();
  const maxTimeMs = 25000; // Max 25 seconds of processing per request
  
  while (processed < params.maxToProcess && (Date.now() - startTime) < maxTimeMs) {
    const remaining = params.maxToProcess - processed;
    // Process up to 8 photos in parallel per batch for faster analysis
    const batchSize = Math.min(remaining, 8);
    
    const lockedPhotos = await lockNextPhotos({ 
      jobId: params.jobId, 
      lockedBy, 
      now, 
      lockExpiry,
      limit: batchSize 
    });

    if (lockedPhotos.length === 0) break;

    // Run analysis in parallel with timeout protection
    const results = await Promise.allSettled(
      lockedPhotos.map(photo => 
        Promise.race([
          runVisionForPhoto(photo),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("ANALYSIS_TIMEOUT")), 20000)
          )
        ])
      )
    );
    
    // Log any failures
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        console.warn("advanceAnalysis.photoFailed", {
          photoId: lockedPhotos[i].id,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }
    
    processed += lockedPhotos.length;
  }
  
  logEvent("mobile.photos.analyze.advance", {
    requestId: params.requestId,
    jobId: params.jobId,
    processed,
    durationMs: Date.now() - startTime,
  });
}

// Helper to extract issues from vision findings
function extractIssuesFromFindings(
  photos: Array<typeof mobileJobPhotos.$inferSelect>
): DetectedIssue[] {
  const issueMap = new Map<string, DetectedIssue>();

  for (const photo of photos) {
    const findings = photo.findings as {
      combined?: {
        summaryLabels?: string[];
        needsMorePhotos?: string[];
        confidence?: number;
      };
      llm?: {
        result?: {
          damage?: string[];
          issues?: string[];
          materials?: string[];
          objects?: Array<{ name: string; notes?: string }>;
          labels?: string[];
        };
      };
      detector?: {
        result?: {
          labels?: Array<{ name: string; confidence: number }>;
        };
      };
    } | null;

    if (!findings) continue;

    const combined = findings.combined || {};
    const llmResult = findings.llm?.result || {};
    const detectorLabels = findings.detector?.result?.labels || [];

    // Extract damage issues
    const damageItems = llmResult.damage || [];
    for (const damage of damageItems) {
      const key = `damage:${damage.toLowerCase()}`;
      if (!issueMap.has(key)) {
        issueMap.set(key, {
          id: key,
          label: damage,
          description: `Detected damage: ${damage}`,
          confidence: combined.confidence ?? 0.6,
          category: "damage",
          photoIds: [],
        });
      }
      issueMap.get(key)!.photoIds.push(photo.id);
    }

    // Extract general issues (missing components, dated items, things needing replacement)
    const issueItems = llmResult.issues || [];
    for (const issue of issueItems) {
      const lowerIssue = issue.toLowerCase();
      // Determine category based on issue description
      let category: DetectedIssue["category"] = "repair";
      if (lowerIssue.includes("missing") || lowerIssue.includes("incomplete")) {
        category = "repair";
      } else if (lowerIssue.includes("dated") || lowerIssue.includes("outdated") || lowerIssue.includes("replace") || lowerIssue.includes("upgrade")) {
        category = "upgrade";
      } else if (lowerIssue.includes("safety") || lowerIssue.includes("hazard") || lowerIssue.includes("exposed")) {
        category = "damage";
      }

      const key = `issue:${lowerIssue}`;
      if (!issueMap.has(key)) {
        issueMap.set(key, {
          id: key,
          label: issue,
          description: `Issue detected: ${issue}`,
          confidence: combined.confidence ?? 0.7,
          category,
          photoIds: [],
        });
      }
      issueMap.get(key)!.photoIds.push(photo.id);
    }

    // Extract objects that might indicate repair needs
    const objects = llmResult.objects || [];
    for (const obj of objects) {
      if (obj.notes) {
        const key = `repair:${obj.name.toLowerCase()}:${obj.notes.toLowerCase().slice(0, 30)}`;
        if (!issueMap.has(key)) {
          // Determine category based on notes content
          const notesLower = obj.notes.toLowerCase();
          let category: DetectedIssue["category"] = "repair";
          if (notesLower.includes("dated") || notesLower.includes("outdated") || notesLower.includes("old") || notesLower.includes("replace")) {
            category = "upgrade";
          } else if (notesLower.includes("damage") || notesLower.includes("broken") || notesLower.includes("crack")) {
            category = "damage";
          }

          issueMap.set(key, {
            id: key,
            label: `${obj.name} - ${obj.notes}`,
            description: obj.notes,
            confidence: combined.confidence ?? 0.65,
            category,
            photoIds: [],
          });
        }
        issueMap.get(key)!.photoIds.push(photo.id);
      }
    }

    // Use high-confidence Rekognition labels for context
    for (const label of detectorLabels.slice(0, 5)) {
      const lowerName = label.name.toLowerCase();
      // Include labels that suggest issues - expanded keyword list
      const issueKeywords = [
        "crack", "rust", "damage", "leak", "stain", "mold", "rot", "wear", "broken",
        "missing", "incomplete", "old", "worn", "faded", "peeling", "chipped", "dent"
      ];
      if (issueKeywords.some(kw => lowerName.includes(kw))) {
        const key = `detected:${lowerName}`;
        if (!issueMap.has(key)) {
          issueMap.set(key, {
            id: key,
            label: label.name,
            description: `Detected in photo with ${Math.round(label.confidence)}% confidence`,
            confidence: label.confidence / 100,
            category: "inspection",
            photoIds: [],
          });
        }
        issueMap.get(key)!.photoIds.push(photo.id);
      }
    }

    // Add summary labels as potential issues only if they indicate a problem
    const summaryLabels = combined.summaryLabels || llmResult.labels || [];
    const problemIndicators = [
      "missing", "broken", "damaged", "worn", "dated", "old", "replace", "repair",
      "crack", "stain", "leak", "rust", "mold", "incomplete", "needs"
    ];
    for (const label of summaryLabels.slice(0, 5)) {
      const lowerLabel = label.toLowerCase();
      // Only add labels that suggest actual issues
      if (problemIndicators.some(ind => lowerLabel.includes(ind))) {
        const key = `label:${lowerLabel}`;
        if (!issueMap.has(key)) {
          issueMap.set(key, {
            id: key,
            label: label,
            confidence: 0.7,
            category: "other",
            photoIds: [],
          });
        }
        issueMap.get(key)!.photoIds.push(photo.id);
      }
    }
  }

  // Sort by confidence and return
  return Array.from(issueMap.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

function extractNeedsMorePhotos(
  photos: Array<typeof mobileJobPhotos.$inferSelect>
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const photo of photos) {
    const findings = photo.findings as { combined?: { needsMorePhotos?: string[] } } | null;
    const needs = findings?.combined?.needsMorePhotos || [];
    for (const item of needs) {
      const normalized = item.trim();
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(normalized);
      if (out.length >= 6) return out;
    }
  }

  return out;
}

// Generate suggested problem statement from issues
function generateSuggestedProblem(issues: DetectedIssue[]): string | undefined {
  const damageIssues = issues.filter(i => i.category === "damage");
  const repairIssues = issues.filter(i => i.category === "repair");
  
  if (damageIssues.length > 0) {
    return `Address ${damageIssues.map(i => i.label).join(", ")}`;
  }
  if (repairIssues.length > 0) {
    return `Repair needed: ${repairIssues[0].label}`;
  }
  if (issues.length > 0) {
    return `Inspect and address: ${issues[0].label}`;
  }
  return undefined;
}

// POST /api/mobile/jobs/:jobId/photos/analyze - Trigger analysis and get detected issues
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  const t0 = Date.now();
  
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");
    }

    const job = await storage.getMobileJob(id, authResult.userId);
    if (!job) {
      return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
    }

    // Advance analysis (best-effort). Keeps progress moving even on serverless deployments.
    // Process up to 10 photos to ensure quick initial analysis
    await advanceAnalysis({ jobId: id, requestId, maxToProcess: 10 });

    // Get all photos for this job (post-advance)
    const photos = await db.select().from(mobileJobPhotos).where(eq(mobileJobPhotos.jobId, id));

    if (photos.length === 0) {
      return withRequestId(requestId, {
        status: "no_photos",
        detectedIssues: [],
        photosAnalyzed: 0,
        photosTotal: 0,
      } as AnalyzeResponse);
    }

    const readyPhotos = photos.filter((p) => p.findingsStatus === "ready");
    const doneCount = photos.filter((p) => p.findingsStatus === "ready" || p.findingsStatus === "failed").length;

    // Extract issues from analyzed photos (ready only)
    const detectedIssues = extractIssuesFromFindings(readyPhotos);
    const suggestedProblem = generateSuggestedProblem(detectedIssues);
    const needsMorePhotos = extractNeedsMorePhotos(readyPhotos);

    const stillPending = photos.length - doneCount;

    logEvent("mobile.photos.analyze.ok", {
      requestId,
      jobId: id,
      photosTotal: photos.length,
      photosAnalyzed: doneCount,
      issuesDetected: detectedIssues.length,
      ms: Date.now() - t0,
    });

    return withRequestId(requestId, {
      status: stillPending > 0 ? "analyzing" : "ready",
      detectedIssues,
      photosAnalyzed: doneCount,
      photosTotal: photos.length,
      suggestedProblem,
      needsMorePhotos,
    } as AnalyzeResponse);
  } catch (error) {
    console.error("Error analyzing photos:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to analyze photos");
  }
}

// GET /api/mobile/jobs/:jobId/photos/analyze - Poll for analysis status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = getRequestId(request.headers);
  
  try {
    const authResult = await requireMobileAuth(request);
    if (!authResult.ok) return authResult.response;

    const { jobId } = await params;
    const id = parseInt(jobId);
    if (Number.isNaN(id)) {
      return jsonError(requestId, 400, "INVALID_INPUT", "Invalid jobId");
    }

    const job = await storage.getMobileJob(id, authResult.userId);
    if (!job) {
      return jsonError(requestId, 404, "NOT_FOUND", "Job not found");
    }

    // Advance analysis incrementally on each poll so progress doesn't stall.
    // Process up to 5 photos per poll for faster catch-up
    await advanceAnalysis({ jobId: id, requestId, maxToProcess: 5 });

    // Get all photos for this job
    const photos = await db
      .select()
      .from(mobileJobPhotos)
      .where(eq(mobileJobPhotos.jobId, id));

    if (photos.length === 0) {
      return withRequestId(requestId, {
        status: "no_photos",
        detectedIssues: [],
        photosAnalyzed: 0,
        photosTotal: 0,
      } as AnalyzeResponse);
    }

    const readyPhotos = photos.filter((p) => p.findingsStatus === "ready");
    const doneCount = photos.filter((p) => p.findingsStatus === "ready" || p.findingsStatus === "failed").length;
    const detectedIssues = extractIssuesFromFindings(readyPhotos);
    const suggestedProblem = generateSuggestedProblem(detectedIssues);
    const needsMorePhotos = extractNeedsMorePhotos(readyPhotos);

    return withRequestId(requestId, {
      status: doneCount === photos.length ? "ready" : "analyzing",
      detectedIssues,
      photosAnalyzed: doneCount,
      photosTotal: photos.length,
      suggestedProblem,
      needsMorePhotos,
    } as AnalyzeResponse);
  } catch (error) {
    console.error("Error getting analysis status:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to get analysis status");
  }
}
