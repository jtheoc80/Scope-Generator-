import { NextRequest } from "next/server";
import { requireMobileAuth } from "@/src/lib/mobile/auth";
import { storage } from "@/lib/services/storage";
import { db } from "@/server/db";
import { mobileJobPhotos } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getRequestId, jsonError, logEvent, withRequestId } from "@/src/lib/mobile/observability";
import { ensureVisionWorker } from "@/src/lib/mobile/vision/worker";
import {
  type Finding,
  type Unknown,
  type ClarifyingQuestion,
  type FindingsSummary,
  PAINTING_CLARIFYING_QUESTIONS,
  detectPaintingJob,
  requiresScopeConfirmation,
  generateScopeTiers,
} from "@/src/lib/mobile/findings/types";

export const runtime = "nodejs";

/**
 * GET /api/mobile/jobs/:jobId/findings
 * 
 * Returns aggregated findings summary from all photo analyses.
 * This is the "Findings → Clarify Scope → Price" gate step.
 * 
 * Response includes:
 * - findings: What the AI detected in photos
 * - unknowns: Things the AI is uncertain about
 * - needsClarification: Whether user must answer questions before pricing
 * - clarifyingQuestions: Questions to ask user (if needed)
 * - suggestedTiers: Scope tier options (minimum/recommended/premium)
 */
export async function GET(
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

    // Ensure vision worker is running
    ensureVisionWorker();

    // Get all photos for this job
    const photos = await db
      .select()
      .from(mobileJobPhotos)
      .where(eq(mobileJobPhotos.jobId, id));

    if (photos.length === 0) {
      return withRequestId(requestId, {
        status: "no_photos",
        findings: [],
        unknowns: [],
        needsClarification: false,
        clarifyingQuestions: [],
        overallConfidence: 0,
        photosAnalyzed: 0,
        photosTotal: 0,
        isPaintingJob: false,
      } satisfies FindingsSummary);
    }

    const readyPhotos = photos.filter((p) => p.findingsStatus === "ready");
    const doneCount = photos.filter(
      (p) => p.findingsStatus === "ready" || p.findingsStatus === "failed"
    ).length;

    if (doneCount < photos.length) {
      // Still analyzing
      return withRequestId(requestId, {
        status: "analyzing",
        findings: [],
        unknowns: [],
        needsClarification: false,
        clarifyingQuestions: [],
        overallConfidence: 0,
        photosAnalyzed: doneCount,
        photosTotal: photos.length,
        isPaintingJob: false,
      } satisfies FindingsSummary);
    }

    // Aggregate findings from all photos
    const { 
      findings, 
      unknowns, 
      detectedTrade, 
      isPaintingJob, 
      overallConfidence,
      suggestedProblem,
      needsMorePhotos,
      aggregatedClarificationReasons,
    } = aggregateFindings(readyPhotos);

    // Determine if clarification is needed
    const scopeCheck = requiresScopeConfirmation(findings);
    const hasAmbiguousScope = readyPhotos.some(p => {
      const f = p.findings as { combined?: { scopeAmbiguous?: boolean } } | null;
      return f?.combined?.scopeAmbiguous === true;
    });
    
    const needsClarification = 
      scopeCheck.required || 
      hasAmbiguousScope || 
      isPaintingJob ||
      aggregatedClarificationReasons.length > 0;

    // Generate clarifying questions
    const clarifyingQuestions = generateClarifyingQuestions(
      findings,
      isPaintingJob,
      aggregatedClarificationReasons,
      scopeCheck.reason
    );

    // Generate scope tiers
    const suggestedTiers = generateScopeTiers(findings, isPaintingJob);

    logEvent("mobile.findings.summary.ok", {
      requestId,
      jobId: id,
      photosTotal: photos.length,
      photosAnalyzed: readyPhotos.length,
      findingsCount: findings.length,
      unknownsCount: unknowns.length,
      needsClarification,
      isPaintingJob,
      detectedTrade,
      ms: Date.now() - t0,
    });

    const response: FindingsSummary = {
      status: "ready",
      findings,
      unknowns,
      needsClarification,
      clarifyingQuestions,
      suggestedTiers,
      overallConfidence,
      photosAnalyzed: readyPhotos.length,
      photosTotal: photos.length,
      suggestedProblem,
      needsMorePhotos,
      detectedTrade,
      isPaintingJob,
    };

    return withRequestId(requestId, response);
  } catch (error) {
    console.error("Error getting findings summary:", error);
    return jsonError(requestId, 500, "INTERNAL", "Failed to get findings summary");
  }
}

/**
 * Aggregate findings from all analyzed photos into a unified summary.
 */
function aggregateFindings(photos: Array<typeof mobileJobPhotos.$inferSelect>) {
  const findingsMap = new Map<string, Finding>();
  const unknownsSet = new Set<string>();
  const clarificationReasons = new Set<string>();
  let detectedTrade: string | undefined;
  let isPaintingJob = false;
  let totalConfidence = 0;
  let confidenceCount = 0;
  const needsMorePhotosSet = new Set<string>();

  for (const photo of photos) {
    const findings = photo.findings as {
      combined?: {
        confidence?: number;
        summaryLabels?: string[];
        needsMorePhotos?: string[];
        needsClarification?: boolean;
        scopeAmbiguous?: boolean;
        clarificationReasons?: string[];
        detectedTrade?: string;
        isPaintingRelated?: boolean;
        estimatedSeverity?: string;
      };
      llm?: {
        result?: {
          damage?: string[];
          issues?: string[];
          materials?: string[];
          objects?: Array<{ name: string; notes?: string }>;
          labels?: string[];
          needsClarification?: boolean;
          scopeAmbiguous?: boolean;
          clarificationReasons?: string[];
          suggestedScopeOptions?: Array<{ id: string; label: string; description?: string }>;
          detectedTrade?: string;
          isPaintingRelated?: boolean;
          estimatedSeverity?: string;
        };
      };
    } | null;

    if (!findings) continue;

    const combined = findings.combined || {};
    const llmResult = findings.llm?.result || {};

    // Track confidence
    if (combined.confidence !== undefined) {
      totalConfidence += combined.confidence;
      confidenceCount++;
    }

    // Detect trade
    if (combined.detectedTrade && !detectedTrade) {
      detectedTrade = combined.detectedTrade;
    } else if (llmResult.detectedTrade && !detectedTrade) {
      detectedTrade = llmResult.detectedTrade;
    }

    // Detect painting
    if (combined.isPaintingRelated || llmResult.isPaintingRelated) {
      isPaintingJob = true;
    }

    // Collect clarification reasons
    const reasons = combined.clarificationReasons || llmResult.clarificationReasons || [];
    for (const reason of reasons) {
      clarificationReasons.add(reason);
    }

    // Collect needs more photos
    const needsMore = combined.needsMorePhotos || [];
    for (const item of needsMore) {
      needsMorePhotosSet.add(item);
    }

    // Extract damage as findings
    const damageItems = llmResult.damage || [];
    for (const damage of damageItems) {
      const key = `damage:${damage.toLowerCase()}`;
      if (!findingsMap.has(key)) {
        findingsMap.set(key, {
          id: key,
          issue: damage,
          description: `Detected damage: ${damage}`,
          confidence: combined.confidence ?? 0.6,
          category: "damage",
          photoIds: [],
          severity: getSeverityFromEstimate(llmResult.estimatedSeverity || combined.estimatedSeverity),
        });
      }
      findingsMap.get(key)!.photoIds.push(photo.id);
    }

    // Extract issues as findings
    const issueItems = llmResult.issues || [];
    for (const issue of issueItems) {
      const lowerIssue = issue.toLowerCase();
      let category: Finding["category"] = "repair";
      
      // Categorize based on keywords
      if (lowerIssue.includes("paint") || lowerIssue.includes("peel") || lowerIssue.includes("fad")) {
        category = "painting";
        isPaintingJob = true;
      } else if (lowerIssue.includes("plumb") || lowerIssue.includes("pipe") || lowerIssue.includes("leak")) {
        category = "plumbing";
      } else if (lowerIssue.includes("electric") || lowerIssue.includes("wire") || lowerIssue.includes("outlet")) {
        category = "electrical";
      } else if (lowerIssue.includes("upgrade") || lowerIssue.includes("dated") || lowerIssue.includes("outdated")) {
        category = "upgrade";
      }

      const key = `issue:${lowerIssue}`;
      if (!findingsMap.has(key)) {
        findingsMap.set(key, {
          id: key,
          issue: issue,
          description: `Issue detected: ${issue}`,
          confidence: combined.confidence ?? 0.7,
          category,
          photoIds: [],
          severity: getSeverityFromEstimate(llmResult.estimatedSeverity || combined.estimatedSeverity),
        });
      }
      findingsMap.get(key)!.photoIds.push(photo.id);
    }

    // Extract objects with notes as findings
    const objects = llmResult.objects || [];
    for (const obj of objects) {
      if (obj.notes) {
        const notesLower = obj.notes.toLowerCase();
        let category: Finding["category"] = "repair";
        
        if (notesLower.includes("paint") || notesLower.includes("peel") || notesLower.includes("fad")) {
          category = "painting";
          isPaintingJob = true;
        } else if (notesLower.includes("damage") || notesLower.includes("broken") || notesLower.includes("crack")) {
          category = "damage";
        } else if (notesLower.includes("dated") || notesLower.includes("outdated") || notesLower.includes("old")) {
          category = "upgrade";
        }

        const key = `object:${obj.name.toLowerCase()}:${obj.notes.substring(0, 30).toLowerCase()}`;
        if (!findingsMap.has(key)) {
          findingsMap.set(key, {
            id: key,
            issue: `${obj.name} - ${obj.notes}`,
            description: obj.notes,
            confidence: combined.confidence ?? 0.65,
            category,
            photoIds: [],
          });
        }
        findingsMap.get(key)!.photoIds.push(photo.id);
      }
    }

    // Mark scope ambiguity as unknowns
    if (combined.scopeAmbiguous || llmResult.scopeAmbiguous) {
      unknownsSet.add("Exact scope of work cannot be determined from photos alone");
    }
  }

  // Check for painting in findings
  const allFindings = Array.from(findingsMap.values());
  if (!isPaintingJob) {
    isPaintingJob = detectPaintingJob(allFindings);
  }

  // Build unknowns array
  const unknowns: Unknown[] = Array.from(unknownsSet).map((desc, i) => ({
    id: `unknown-${i}`,
    description: desc,
    impactsScope: true,
    impactsPricing: true,
  }));

  // Add painting-specific unknown if detected
  if (isPaintingJob) {
    unknowns.push({
      id: "unknown-paint-scope",
      description: "Extent of painting needed beyond photographed area",
      impactsScope: true,
      impactsPricing: true,
    });
    unknowns.push({
      id: "unknown-color-change",
      description: "Whether customer wants color change (affects primer coats)",
      impactsScope: false,
      impactsPricing: true,
    });
  }

  // Generate suggested problem statement
  const damageFindings = allFindings.filter(f => f.category === "damage");
  const paintFindings = allFindings.filter(f => f.category === "painting");
  
  let suggestedProblem: string | undefined;
  if (paintFindings.length > 0) {
    suggestedProblem = `Address painting issues: ${paintFindings.slice(0, 2).map(f => f.issue).join(", ")}`;
  } else if (damageFindings.length > 0) {
    suggestedProblem = `Repair damage: ${damageFindings.slice(0, 2).map(f => f.issue).join(", ")}`;
  } else if (allFindings.length > 0) {
    suggestedProblem = `Address: ${allFindings[0].issue}`;
  }

  return {
    findings: allFindings.sort((a, b) => b.confidence - a.confidence).slice(0, 15),
    unknowns,
    detectedTrade: detectedTrade || (isPaintingJob ? "painting" : undefined),
    isPaintingJob,
    overallConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0.5,
    suggestedProblem,
    needsMorePhotos: Array.from(needsMorePhotosSet).slice(0, 6),
    aggregatedClarificationReasons: Array.from(clarificationReasons),
  };
}

/**
 * Convert severity estimate string to enum
 */
function getSeverityFromEstimate(estimate?: string): Finding["severity"] {
  if (!estimate) return undefined;
  if (estimate === "spot") return "low";
  if (estimate === "partial") return "medium";
  if (estimate === "full") return "high";
  return undefined;
}

/**
 * Generate clarifying questions based on findings and context
 */
function generateClarifyingQuestions(
  findings: Finding[],
  isPaintingJob: boolean,
  clarificationReasons: string[],
  scopeReason?: string
): ClarifyingQuestion[] {
  const questions: ClarifyingQuestion[] = [];

  // Add painting-specific questions if painting job detected
  if (isPaintingJob) {
    questions.push(...PAINTING_CLARIFYING_QUESTIONS);
  } else if (clarificationReasons.length > 0 || scopeReason) {
    // Add dynamic scope question based on AI-detected ambiguity
    const helpText = scopeReason 
      ? `Based on analysis: ${scopeReason}`
      : clarificationReasons.length > 0 
        ? `Clarification needed: ${clarificationReasons.slice(0, 2).join("; ")}`
        : undefined;
    
    questions.push({
      id: "scope_level",
      question: "What level of work are you looking for?",
      questionType: "single_select",
      options: [
        {
          value: "minimum",
          label: "Minimum repair",
          description: "Fix only the critical issues",
          priceMultiplier: 1.0,
        },
        {
          value: "recommended",
          label: "Recommended",
          description: "Address all identified issues",
          priceMultiplier: 1.5,
          isDefault: true,
        },
        {
          value: "premium",
          label: "Premium",
          description: "Complete overhaul with preventive work",
          priceMultiplier: 2.0,
        },
      ],
      required: true,
      impactArea: "scope",
      helpText,
    });
  } else {
    // Generic scope question for non-painting jobs
    questions.push({
      id: "scope_level",
      question: "What level of work are you looking for?",
      questionType: "single_select",
      options: [
        {
          value: "minimum",
          label: "Minimum repair",
          description: "Fix only the critical issues",
          priceMultiplier: 1.0,
        },
        {
          value: "recommended",
          label: "Recommended",
          description: "Address all identified issues",
          priceMultiplier: 1.5,
          isDefault: true,
        },
        {
          value: "premium",
          label: "Premium",
          description: "Complete overhaul with preventive work",
          priceMultiplier: 2.0,
        },
      ],
      required: true,
      impactArea: "scope",
    });
  }

  // Add general area size question if not painting-specific
  if (!isPaintingJob) {
    questions.push({
      id: "work_area_size",
      question: "Approximate size of work area?",
      questionType: "single_select",
      options: [
        { value: "small", label: "Small (< 100 sq ft)", priceMultiplier: 1.0 },
        { value: "medium", label: "Medium (100-300 sq ft)", priceMultiplier: 1.5 },
        { value: "large", label: "Large (300+ sq ft)", priceMultiplier: 2.0 },
      ],
      required: false,
      impactArea: "pricing",
    });
  }

  // Add confirmation question if many issues or high-value job
  if (findings.length >= 5) {
    questions.push({
      id: "confirm_all_items",
      question: "We identified multiple issues. Would you like us to address all of them?",
      questionType: "boolean",
      defaultValue: true,
      required: true,
      helpText: "You can also select specific items in the next step",
      impactArea: "scope",
    });
  }

  return questions;
}
