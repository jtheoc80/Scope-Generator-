import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { mobileJobPhotos } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { analyzeWithRekognition } from "@/src/lib/mobile/vision/rekognition";
import { analyzeWithGptVision } from "@/src/lib/mobile/vision/gpt";

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
};

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

    // Extract objects that might indicate repair needs
    const objects = llmResult.objects || [];
    for (const obj of objects) {
      if (obj.notes) {
        const key = `repair:${obj.name.toLowerCase()}`;
        if (!issueMap.has(key)) {
          issueMap.set(key, {
            id: key,
            label: `${obj.name} - ${obj.notes}`,
            description: obj.notes,
            confidence: combined.confidence ?? 0.5,
            category: "repair",
            photoIds: [],
          });
        }
        issueMap.get(key)!.photoIds.push(photo.id);
      }
    }

    // Use high-confidence Rekognition labels for context
    for (const label of detectorLabels.slice(0, 5)) {
      const lowerName = label.name.toLowerCase();
      // Only include labels that suggest issues
      const issueKeywords = ["crack", "rust", "damage", "leak", "stain", "mold", "rot", "wear", "broken"];
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

    // Add summary labels as potential issues
    const summaryLabels = combined.summaryLabels || llmResult.labels || [];
    for (const label of summaryLabels.slice(0, 3)) {
      const key = `label:${label.toLowerCase()}`;
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

  // Sort by confidence and return
  return Array.from(issueMap.values())
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
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

    // Check if any photos need analysis
    const pendingPhotos = photos.filter(p => p.findingsStatus === "pending" || p.findingsStatus === "processing");
    const analyzedPhotos = photos.filter(p => p.findingsStatus === "ready");

    // For photos without findings, try to analyze them directly
    for (const photo of pendingPhotos.slice(0, 3)) { // Limit to 3 for performance
      try {
        // Run Rekognition
        const rek = await analyzeWithRekognition({ imageUrl: photo.publicUrl });
        const labelNames = rek.labels.map(l => l.name);

        // Run GPT Vision
        const gpt = await analyzeWithGptVision({
          imageUrl: photo.publicUrl,
          kind: photo.kind,
          rekognitionLabels: labelNames,
        });

        // Build findings object
        const findings = {
          version: "v1",
          imageUrl: photo.publicUrl,
          kind: photo.kind,
          detector: { status: "ready", result: rek },
          llm: { status: "ready", result: { ...gpt, provider: "openai" } },
          combined: {
            confidence: Math.max(0, Math.min(1, (gpt.confidence ?? 0.5) * 0.9 + 0.1)),
            summaryLabels: Array.from(new Set([...(gpt.labels || []), ...labelNames.slice(0, 5)])).slice(0, 10),
            needsMorePhotos: gpt.needsMorePhotos || [],
          },
        };

        // Update photo with findings
        await db
          .update(mobileJobPhotos)
          .set({
            findings,
            findingsStatus: "ready",
            findingsError: null,
            analyzedAt: new Date(),
          })
          .where(eq(mobileJobPhotos.id, photo.id));

        // Add to analyzed list
        analyzedPhotos.push({ ...photo, findings, findingsStatus: "ready" });
      } catch (err) {
        console.error(`Failed to analyze photo ${photo.id}:`, err);
        // Continue with other photos
      }
    }

    // Extract issues from analyzed photos
    const detectedIssues = extractIssuesFromFindings(analyzedPhotos);
    const suggestedProblem = generateSuggestedProblem(detectedIssues);

    const stillPending = photos.length - analyzedPhotos.length;

    logEvent("mobile.photos.analyze.ok", {
      requestId,
      jobId: id,
      photosTotal: photos.length,
      photosAnalyzed: analyzedPhotos.length,
      issuesDetected: detectedIssues.length,
      ms: Date.now() - t0,
    });

    return withRequestId(requestId, {
      status: stillPending > 0 ? "analyzing" : "ready",
      detectedIssues,
      photosAnalyzed: analyzedPhotos.length,
      photosTotal: photos.length,
      suggestedProblem,
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

    const analyzedPhotos = photos.filter(p => p.findingsStatus === "ready");
    const detectedIssues = extractIssuesFromFindings(analyzedPhotos);
    const suggestedProblem = generateSuggestedProblem(detectedIssues);

    return withRequestId(requestId, {
      status: analyzedPhotos.length === photos.length ? "ready" : "analyzing",
      detectedIssues,
      photosAnalyzed: analyzedPhotos.length,
      photosTotal: photos.length,
      suggestedProblem,
    } as AnalyzeResponse);
  } catch (error) {
    console.error("Error getting analysis status:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to get analysis status");
  }
}
