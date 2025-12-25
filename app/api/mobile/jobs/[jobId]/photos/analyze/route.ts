import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { mobileJobPhotos } from "@shared/schema";
import { and, desc, eq, isNull, lte, or } from "drizzle-orm";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { analyzeWithRekognition } from "@/src/lib/mobile/vision/rekognition";
import { analyzeWithGptVision, validateFindings } from "@/src/lib/mobile/vision/gpt";
import { ensureVisionWorker } from "@/src/lib/mobile/vision/worker";

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
  suggestedIssues: DetectedIssue[]; // Instant suggestions based on detected objects
  photosAnalyzed: number;
  photosTotal: number;
  suggestedProblem?: string;
  needsMorePhotos?: string[];
};

const LOCK_EXPIRY_MS = 2 * 60 * 1000;

// Object-to-suggestions mapping for instant results
// When Rekognition detects these objects, we suggest common issues contractors address
const OBJECT_SUGGESTIONS: Record<string, Array<{ label: string; category: DetectedIssue["category"] }>> = {
  // Lighting
  "chandelier": [
    { label: "Replace or update light fixture", category: "upgrade" },
    { label: "Missing or broken light shades/globes", category: "repair" },
    { label: "Update to modern lighting", category: "upgrade" },
  ],
  "light fixture": [
    { label: "Replace or update light fixture", category: "upgrade" },
    { label: "Update to modern lighting", category: "upgrade" },
  ],
  "lamp": [
    { label: "Replace or update lighting", category: "upgrade" },
  ],
  "ceiling light": [
    { label: "Replace ceiling light fixture", category: "upgrade" },
    { label: "Update to recessed lighting", category: "upgrade" },
  ],
  // Ceiling
  "ceiling": [
    { label: "Popcorn ceiling removal", category: "upgrade" },
    { label: "Ceiling repair or repaint", category: "repair" },
    { label: "Crown molding installation", category: "upgrade" },
  ],
  // Walls
  "wall": [
    { label: "Repaint walls", category: "upgrade" },
    { label: "Repair drywall damage", category: "repair" },
    { label: "Update wall texture", category: "upgrade" },
  ],
  "tile": [
    { label: "Replace or update tile", category: "upgrade" },
    { label: "Regrout tile", category: "repair" },
    { label: "Repair cracked/damaged tile", category: "repair" },
  ],
  // Windows & Doors
  "window": [
    { label: "Replace windows", category: "upgrade" },
    { label: "Update window trim", category: "upgrade" },
    { label: "Repair window seals", category: "repair" },
  ],
  "door": [
    { label: "Replace door", category: "upgrade" },
    { label: "Update door hardware", category: "upgrade" },
    { label: "Repair/adjust door", category: "repair" },
  ],
  // Flooring
  "floor": [
    { label: "Replace flooring", category: "upgrade" },
    { label: "Refinish hardwood floors", category: "repair" },
    { label: "Repair damaged flooring", category: "repair" },
  ],
  "hardwood": [
    { label: "Refinish hardwood floors", category: "repair" },
    { label: "Repair scratched/damaged hardwood", category: "repair" },
  ],
  "carpet": [
    { label: "Replace carpet", category: "upgrade" },
    { label: "Deep clean carpet", category: "maintenance" },
  ],
  // Kitchen
  "cabinet": [
    { label: "Repaint or refinish cabinets", category: "upgrade" },
    { label: "Replace cabinet hardware", category: "upgrade" },
    { label: "Replace cabinets", category: "upgrade" },
  ],
  "countertop": [
    { label: "Replace countertops", category: "upgrade" },
    { label: "Repair countertop damage", category: "repair" },
  ],
  "sink": [
    { label: "Replace sink", category: "upgrade" },
    { label: "Replace faucet", category: "upgrade" },
    { label: "Fix sink leak", category: "repair" },
  ],
  "faucet": [
    { label: "Replace faucet", category: "upgrade" },
    { label: "Fix leaky faucet", category: "repair" },
  ],
  // Bathroom
  "toilet": [
    { label: "Replace toilet", category: "upgrade" },
    { label: "Repair toilet", category: "repair" },
  ],
  "bathtub": [
    { label: "Refinish or replace bathtub", category: "upgrade" },
    { label: "Repair tub/shower", category: "repair" },
  ],
  "shower": [
    { label: "Update shower fixtures", category: "upgrade" },
    { label: "Repair shower leak", category: "repair" },
    { label: "Replace showerhead", category: "upgrade" },
  ],
  // Exterior
  "roof": [
    { label: "Roof repair", category: "repair" },
    { label: "Replace roofing", category: "upgrade" },
    { label: "Clean gutters", category: "maintenance" },
  ],
  "siding": [
    { label: "Repair siding", category: "repair" },
    { label: "Replace siding", category: "upgrade" },
    { label: "Power wash exterior", category: "maintenance" },
  ],
  "deck": [
    { label: "Refinish deck", category: "repair" },
    { label: "Repair deck boards", category: "repair" },
    { label: "Replace deck", category: "upgrade" },
  ],
  "fence": [
    { label: "Repair fence", category: "repair" },
    { label: "Replace fence", category: "upgrade" },
    { label: "Stain/paint fence", category: "maintenance" },
  ],
  // Trim & Molding
  "baseboard": [
    { label: "Replace baseboards", category: "upgrade" },
    { label: "Repaint trim", category: "upgrade" },
  ],
  "molding": [
    { label: "Replace or update molding", category: "upgrade" },
    { label: "Add crown molding", category: "upgrade" },
  ],
  "trim": [
    { label: "Replace or update trim", category: "upgrade" },
    { label: "Repaint trim", category: "upgrade" },
  ],
};

// Generate instant suggestions based on Rekognition labels (no AI wait required)
function generateInstantSuggestions(
  photos: Array<typeof mobileJobPhotos.$inferSelect>
): DetectedIssue[] {
  const suggestionMap = new Map<string, DetectedIssue>();
  const seenObjects = new Set<string>();

  for (const photo of photos) {
    // Try to get Rekognition labels from findings or quickLabels
    const findings = photo.findings as {
      detector?: {
        result?: {
          labels?: Array<{ name: string; confidence: number }>;
        };
      };
    } | null;
    
    const quickLabels = (photo as { quickLabels?: string[] }).quickLabels || [];
    const detectorLabels = findings?.detector?.result?.labels || [];
    
    // Combine quick labels and detector labels
    const allLabels = [
      ...quickLabels.map(l => ({ name: l, confidence: 85 })),
      ...detectorLabels,
    ];

    for (const label of allLabels) {
      const lowerName = label.name.toLowerCase();
      
      // Check each object type for matching suggestions
      for (const [objectType, suggestions] of Object.entries(OBJECT_SUGGESTIONS)) {
        if (lowerName.includes(objectType) && !seenObjects.has(objectType)) {
          seenObjects.add(objectType);
          
          // Add suggestions for this object type
          for (const suggestion of suggestions) {
            const key = `suggest:${suggestion.label.toLowerCase()}`;
            if (!suggestionMap.has(key)) {
              suggestionMap.set(key, {
                id: key,
                label: suggestion.label,
                description: `Common issue for ${objectType}`,
                confidence: 0.75,
                category: suggestion.category,
                photoIds: [photo.id],
              });
            } else {
              suggestionMap.get(key)!.photoIds.push(photo.id);
            }
          }
        }
      }
    }
  }

  return Array.from(suggestionMap.values()).slice(0, 8);
}

// Fast Rekognition-only analysis for instant results
async function runQuickAnalysis(photo: typeof mobileJobPhotos.$inferSelect): Promise<string[]> {
  try {
    const rek = await analyzeWithRekognition({ 
      imageUrl: photo.publicUrl,
      maxLabels: 10,
      minConfidence: 60,
    });
    return rek.labels.map(l => l.name);
  } catch {
    return [];
  }
}

function backoffSeconds(attempts: number) {
  const table = [0, 1, 3, 8, 20, 45];
  return table[Math.min(attempts, table.length - 1)] ?? 60;
}

async function lockNextPhoto(params: {
  jobId: number;
  lockedBy: string;
  now: Date;
  lockExpiry: Date;
}): Promise<(typeof mobileJobPhotos.$inferSelect) | null> {
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
    .limit(5);

  for (const photo of candidates) {
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

    if (locked) return locked;
  }

  return null;
}

async function runVisionForPhoto(photo: typeof mobileJobPhotos.$inferSelect) {
  const now = new Date();
  const attempts = photo.findingsAttempts ?? 1;

  try {
    let rek: Awaited<ReturnType<typeof analyzeWithRekognition>> | null = null;
    let rekError: string | undefined;
    try {
      rek = await analyzeWithRekognition({ imageUrl: photo.publicUrl });
    } catch (e) {
      rekError = e instanceof Error ? e.message : String(e);
    }

    const labelNames = rek?.labels?.map((l) => l.name) ?? [];

    let gpt: Awaited<ReturnType<typeof analyzeWithGptVision>> | null = null;
    let gptError: string | undefined;
    try {
      gpt = await analyzeWithGptVision({
        imageUrl: photo.publicUrl,
        kind: photo.kind,
        rekognitionLabels: labelNames,
      });
    } catch (e) {
      gptError = e instanceof Error ? e.message : String(e);
    }

    if (!rek && !gpt) {
      throw new Error(`VISION_FAILED: rekognition=${rekError || "unknown"} gpt=${gptError || "unknown"}`);
    }

    const findings = validateFindings({
      version: "v1",
      imageUrl: photo.publicUrl,
      kind: photo.kind,
      detector: rek
        ? { status: "ready", result: rek }
        : { status: "failed", error: rekError || "REKOGNITION_FAILED" },
      llm: gpt
        ? { status: "ready", result: { ...gpt, provider: "openai" } }
        : { status: "failed", error: gptError || "GPT_VISION_FAILED" },
      combined: {
        confidence: Math.max(0, Math.min(1, ((gpt?.confidence ?? 0.5) * 0.9) + 0.1)),
        summaryLabels: Array.from(new Set([...(gpt?.labels || []), ...labelNames.slice(0, 5)])).slice(0, 10),
        needsMorePhotos: gpt?.needsMorePhotos || [],
      },
    });

    await db
      .update(mobileJobPhotos)
      .set({
        findings,
        findingsStatus: "ready",
        findingsError: null,
        analyzedAt: now,
        findingsLockedBy: null,
        findingsLockedAt: null,
      })
      .where(eq(mobileJobPhotos.id, photo.id));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const next = new Date(Date.now() + backoffSeconds(attempts) * 1000);

    await db
      .update(mobileJobPhotos)
      .set({
        findingsStatus: attempts >= 5 ? "failed" : "pending",
        findingsError: msg,
        findingsNextAttemptAt: attempts >= 5 ? null : next,
        findingsLockedBy: null,
        findingsLockedAt: null,
      })
      .where(eq(mobileJobPhotos.id, photo.id));
  }
}

async function advanceAnalysis(params: { jobId: number; requestId: string; maxToProcess: number }) {
  // Best-effort: start the in-process worker (useful on Node deployments).
  // On serverless, this likely doesn't persist; the inline processing below still advances progress.
  ensureVisionWorker();

  const now = new Date();
  const lockExpiry = new Date(now.getTime() - LOCK_EXPIRY_MS);
  const lockedBy = `api-${params.requestId}-${Math.random().toString(16).slice(2)}`;

  let processed = 0;
  while (processed < params.maxToProcess) {
    const locked = await lockNextPhoto({ jobId: params.jobId, lockedBy, now, lockExpiry });
    if (!locked) break;
    await runVisionForPhoto(locked);
    processed += 1;
  }
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

    // Get all photos for this job first (for instant suggestions)
    const photos = await db.select().from(mobileJobPhotos).where(eq(mobileJobPhotos.jobId, id));

    if (photos.length === 0) {
      return withRequestId(requestId, {
        status: "no_photos",
        detectedIssues: [],
        suggestedIssues: [],
        photosAnalyzed: 0,
        photosTotal: 0,
      } as AnalyzeResponse);
    }

    // INSTANT: Run quick Rekognition analysis in PARALLEL for photos without labels
    // This gives us object detection in ~1-2 seconds total (not per photo)
    const photosNeedingQuickAnalysis = photos.filter(p => {
      const findings = p.findings as { detector?: { result?: { labels?: unknown[] } } } | null;
      const hasLabels = findings?.detector?.result?.labels?.length;
      return !hasLabels && p.findingsStatus !== "ready";
    });

    if (photosNeedingQuickAnalysis.length > 0) {
      // Run Rekognition in parallel for all photos (fast ~1-2s total)
      const quickResults = await Promise.allSettled(
        photosNeedingQuickAnalysis.map(async (photo) => {
          const labels = await runQuickAnalysis(photo);
          return { photoId: photo.id, labels };
        })
      );

      // Store quick labels for instant suggestions
      for (const result of quickResults) {
        if (result.status === "fulfilled" && result.value.labels.length > 0) {
          const photo = photos.find(p => p.id === result.value.photoId);
          if (photo) {
            // Attach labels to photo object for suggestion generation
            (photo as { quickLabels?: string[] }).quickLabels = result.value.labels;
            
            // Also store partial findings so we have them for future requests
            const existingFindings = photo.findings as Record<string, unknown> | null;
            await db
              .update(mobileJobPhotos)
              .set({
                findings: {
                  ...existingFindings,
                  version: "v1",
                  imageUrl: photo.publicUrl,
                  kind: photo.kind,
                  detector: {
                    status: "ready",
                    result: {
                      provider: "aws",
                      service: "rekognition",
                      model: "DetectLabels",
                      labels: result.value.labels.map(name => ({ name, confidence: 80 })),
                    },
                  },
                  llm: existingFindings?.llm || { status: "pending" },
                  combined: {
                    confidence: 0.5,
                    summaryLabels: result.value.labels.slice(0, 5),
                    needsMorePhotos: [],
                  },
                },
              })
              .where(eq(mobileJobPhotos.id, photo.id));
          }
        }
      }
    }

    // Generate INSTANT suggestions based on detected objects (no GPT wait)
    const suggestedIssues = generateInstantSuggestions(photos);

    // Start background full analysis (non-blocking)
    // Don't await this - let it run in background
    advanceAnalysis({ jobId: id, requestId, maxToProcess: 2 }).catch(() => {});

    // Ensure the vision worker is running for continued background processing
    ensureVisionWorker();

    const readyPhotos = photos.filter((p) => p.findingsStatus === "ready");
    const doneCount = photos.filter((p) => p.findingsStatus === "ready" || p.findingsStatus === "failed").length;

    // Extract issues from fully analyzed photos
    const detectedIssues = extractIssuesFromFindings(readyPhotos);
    const suggestedProblem = generateSuggestedProblem([...detectedIssues, ...suggestedIssues]);
    const needsMorePhotos = extractNeedsMorePhotos(readyPhotos);

    const stillPending = photos.length - doneCount;

    logEvent("mobile.photos.analyze.ok", {
      requestId,
      jobId: id,
      photosTotal: photos.length,
      photosAnalyzed: doneCount,
      issuesDetected: detectedIssues.length,
      suggestedIssues: suggestedIssues.length,
      ms: Date.now() - t0,
    });

    return withRequestId(requestId, {
      status: stillPending > 0 ? "analyzing" : "ready",
      detectedIssues,
      suggestedIssues,
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

    // Get all photos for this job
    const photos = await db
      .select()
      .from(mobileJobPhotos)
      .where(eq(mobileJobPhotos.jobId, id));

    if (photos.length === 0) {
      return withRequestId(requestId, {
        status: "no_photos",
        detectedIssues: [],
        suggestedIssues: [],
        photosAnalyzed: 0,
        photosTotal: 0,
      } as AnalyzeResponse);
    }

    // Advance analysis incrementally on each poll (non-blocking best-effort)
    advanceAnalysis({ jobId: id, requestId, maxToProcess: 1 }).catch(() => {});

    const readyPhotos = photos.filter((p) => p.findingsStatus === "ready");
    const doneCount = photos.filter((p) => p.findingsStatus === "ready" || p.findingsStatus === "failed").length;
    const detectedIssues = extractIssuesFromFindings(readyPhotos);
    
    // Always include instant suggestions based on detected objects
    const suggestedIssues = generateInstantSuggestions(photos);
    
    const suggestedProblem = generateSuggestedProblem([...detectedIssues, ...suggestedIssues]);
    const needsMorePhotos = extractNeedsMorePhotos(readyPhotos);

    return withRequestId(requestId, {
      status: doneCount === photos.length ? "ready" : "analyzing",
      detectedIssues,
      suggestedIssues,
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
