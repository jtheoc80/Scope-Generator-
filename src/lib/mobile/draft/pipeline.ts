import { aiService } from "@/lib/services/aiService";
import type { ProposalLineItem, ProposalTemplate, User } from "@shared/schema";
import { computePriceRange } from "./pricebook";
import { extractZip, getOneBuildTradePricingBestEffort, marketMultiplierFromOneBuild } from "./marketPricing";

export type MobileJobInput = {
  id: number;
  clientName: string;
  address: string;
  tradeId: string;
  tradeName: string | null;
  jobTypeId: string;
  jobTypeName: string;
  jobSize: number;
  jobNotes: string | null;
};

export type MobilePhotoInput = {
  publicUrl: string;
  kind: string;
};

export type MobileDraftOutput = {
  packages: Record<"GOOD" | "BETTER" | "BEST", { label: string; lineItems: ProposalLineItem[] }>;
  defaultPackage: "GOOD" | "BETTER" | "BEST";
  confidence: number;
  questions: string[];
  pricing: {
    pricebookVersion: string;
    inputs: unknown;
  };
};

// Extract detailed findings from photo analysis
function extractVisionContext(photos: Array<{ findings?: unknown }>): {
  damage: string[];
  issues: string[];
  objects: Array<{ name: string; notes?: string }>;
  materials: string[];
  labels: string[];
  needsMorePhotos: string[];
  avgConfidence: number;
} {
  const damage = new Set<string>();
  const issues = new Set<string>();
  const objects: Array<{ name: string; notes?: string }> = [];
  const materials = new Set<string>();
  const labels = new Set<string>();
  const needsMorePhotos = new Set<string>();
  const confidences: number[] = [];

  for (const photo of photos) {
    const f = photo.findings as {
      llm?: {
        result?: {
          damage?: string[];
          issues?: string[];
          objects?: Array<{ name: string; notes?: string }>;
          materials?: string[];
          labels?: string[];
          confidence?: number;
        };
        status?: string;
      };
      combined?: {
        summaryLabels?: string[];
        needsMorePhotos?: string[];
        confidence?: number;
      };
      detector?: {
        result?: {
          labels?: Array<{ name: string; confidence: number }>;
        };
      };
    } | null;

    if (!f) continue;

    // Extract from LLM (GPT) results - most valuable
    const llmResult = f.llm?.result;
    if (llmResult) {
      llmResult.damage?.forEach(d => damage.add(d));
      llmResult.issues?.forEach(i => issues.add(i));
      llmResult.materials?.forEach(m => materials.add(m));
      llmResult.labels?.forEach(l => labels.add(l));
      
      // Objects with notes are especially valuable
      if (llmResult.objects) {
        for (const obj of llmResult.objects) {
          if (obj.notes) {
            objects.push(obj);
          }
        }
      }
      
      if (typeof llmResult.confidence === "number") {
        confidences.push(llmResult.confidence);
      }
    }

    // Extract from combined results
    const combined = f.combined;
    if (combined) {
      combined.summaryLabels?.forEach(l => labels.add(l));
      combined.needsMorePhotos?.forEach(n => needsMorePhotos.add(n));
      if (typeof combined.confidence === "number") {
        confidences.push(combined.confidence);
      }
    }

    // Extract high-confidence detector labels
    const detectorLabels = f.detector?.result?.labels ?? [];
    for (const label of detectorLabels.filter(l => l.confidence > 80)) {
      labels.add(label.name);
    }
  }

  const avgConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0.5;

  return {
    damage: Array.from(damage),
    issues: Array.from(issues),
    objects,
    materials: Array.from(materials),
    labels: Array.from(labels),
    needsMorePhotos: Array.from(needsMorePhotos),
    avgConfidence,
  };
}

// Build comprehensive job notes from vision analysis
function buildVisionNotes(visionContext: ReturnType<typeof extractVisionContext>, userNotes?: string | null): string {
  const parts: string[] = [];

  if (userNotes?.trim()) {
    parts.push(`CONTRACTOR NOTES: ${userNotes.trim()}`);
  }

  if (visionContext.damage.length > 0) {
    parts.push(`DAMAGE DETECTED: ${visionContext.damage.join("; ")}`);
  }

  if (visionContext.issues.length > 0) {
    parts.push(`ISSUES FOUND: ${visionContext.issues.join("; ")}`);
  }

  if (visionContext.objects.length > 0) {
    const objectNotes = visionContext.objects
      .slice(0, 8)
      .map(o => `${o.name}: ${o.notes}`)
      .join("; ");
    parts.push(`OBSERVATIONS: ${objectNotes}`);
  }

  if (visionContext.materials.length > 0) {
    parts.push(`MATERIALS IDENTIFIED: ${visionContext.materials.slice(0, 10).join(", ")}`);
  }

  if (parts.length === 0 && visionContext.labels.length > 0) {
    parts.push(`PHOTO ANALYSIS: ${visionContext.labels.slice(0, 12).join(", ")}`);
  }

  return parts.join("\n\n");
}

export async function generateMobileDraft(params: {
  job: MobileJobInput;
  template: Pick<
    ProposalTemplate,
    | "tradeId"
    | "tradeName"
    | "jobTypeId"
    | "jobTypeName"
    | "baseScope"
    | "basePriceLow"
    | "basePriceHigh"
    | "estimatedDaysLow"
    | "estimatedDaysHigh"
    | "warranty"
    | "exclusions"
  >;
  user: Pick<User, "priceMultiplier" | "tradeMultipliers">;
  photos: Array<MobilePhotoInput & { findings?: unknown }>;
}): Promise<MobileDraftOutput> {
  const { job, template, user, photos } = params;

  const zipcode = extractZip(job.address);
  const onebuild = zipcode
    ? await getOneBuildTradePricingBestEffort({ tradeId: template.tradeId, zipcode, timeoutMs: 1200 })
    : null;
  const { multiplier: marketMultiplier, basis: marketBasis } = marketMultiplierFromOneBuild(template.tradeId, onebuild);

  // Extract detailed vision findings from all photos
  const visionContext = extractVisionContext(photos);
  
  console.log("draft.visionContext", {
    jobId: job.id,
    photoCount: photos.length,
    damageCount: visionContext.damage.length,
    issuesCount: visionContext.issues.length,
    objectsWithNotes: visionContext.objects.length,
    materialsCount: visionContext.materials.length,
    avgConfidence: visionContext.avgConfidence.toFixed(2),
  });

  // Build comprehensive notes from vision + user input
  const comprehensiveNotes = buildVisionNotes(visionContext, job.jobNotes);

  // Use the comprehensive vision-derived notes for scope enhancement
  const enhance = await aiService.enhanceScope({
    jobTypeName: template.jobTypeName,
    baseScope: template.baseScope,
    clientName: job.clientName,
    address: job.address,
    jobNotes: comprehensiveNotes || undefined,
  });

  const scope = enhance.enhancedScope;

  const tradeMultipliers = (user.tradeMultipliers || {}) as Record<string, number>;
  const tradeMult = tradeMultipliers[template.tradeId];

  const pricingInputs = {
    basePriceLow: template.basePriceLow,
    basePriceHigh: template.basePriceHigh,
    jobSize: job.jobSize,
    userPriceMultiplier: user.priceMultiplier,
    tradeMultiplier: typeof tradeMult === "number" ? tradeMult : null,
    marketMultiplier,
  };

  const { priceLow, priceHigh } = computePriceRange(pricingInputs);

  const lineItem: ProposalLineItem = {
    id: crypto.randomUUID(),
    tradeId: template.tradeId,
    tradeName: template.tradeName,
    jobTypeId: template.jobTypeId,
    jobTypeName: template.jobTypeName,
    jobSize: job.jobSize,
    scope,
    options: {},
    priceLow,
    priceHigh,
    estimatedDaysLow: template.estimatedDaysLow ?? undefined,
    estimatedDaysHigh: template.estimatedDaysHigh ?? undefined,
    warranty: template.warranty ?? undefined,
    exclusions: template.exclusions ?? undefined,
  };

  // Packages: GOOD/BETTER/BEST feel instant onsite.
  const good: ProposalLineItem = { ...lineItem };
  const better: ProposalLineItem = {
    ...lineItem,
    id: crypto.randomUUID(),
    scope: [...lineItem.scope, "Confirm field measurements and verify existing conditions prior to install."],
    priceLow: Math.round(lineItem.priceLow * 1.08),
    priceHigh: Math.round(lineItem.priceHigh * 1.08),
  };
  const best: ProposalLineItem = {
    ...lineItem,
    id: crypto.randomUUID(),
    scope: [
      ...lineItem.scope,
      "Include premium protection of adjacent finishes and enhanced daily jobsite cleanup.",
      "Provide photo documentation of key in-wall conditions as discovered.",
    ],
    priceLow: Math.round(lineItem.priceLow * 1.18),
    priceHigh: Math.round(lineItem.priceHigh * 1.18),
  };

  const questions: string[] = [];
  if (!enhance.success) {
    questions.push("Review the generated scope and adjust for site-specific conditions.");
  }
  if (photos.length === 0) {
    questions.push("Add at least 1 photo to improve accuracy.");
  }
  // Add AI-suggested additional photo needs
  for (const q of visionContext.needsMorePhotos.slice(0, 5)) {
    questions.push(q);
  }

  // Calculate confidence based on vision analysis quality
  let confidence = enhance.success ? 70 : 45;
  
  // Boost confidence based on photo count
  if (photos.length >= 3) confidence += 10;
  else if (photos.length >= 2) confidence += 5;
  
  // Boost confidence based on vision findings quality
  if (visionContext.avgConfidence > 0.7) confidence += 10;
  else if (visionContext.avgConfidence > 0.5) confidence += 5;
  
  // Boost if we found actionable issues
  if (visionContext.damage.length > 0 || visionContext.issues.length > 0) {
    confidence += 5;
  }
  
  // Boost if user provided notes
  if (job.jobNotes && job.jobNotes.length > 20) confidence += 5;
  
  // Boost if we don't need more photos
  if (visionContext.needsMorePhotos.length === 0 && photos.length >= 3) confidence += 5;
  
  // Market pricing boost
  if (onebuild) confidence += 5;
  
  confidence = Math.max(0, Math.min(95, confidence));
  
  console.log("draft.generated", {
    jobId: job.id,
    confidence,
    scopeItems: scope.length,
    enhanceSuccess: enhance.success,
  });

  return {
    packages: {
      GOOD: { label: "Good", lineItems: [good] },
      BETTER: { label: "Better", lineItems: [better] },
      BEST: { label: "Best", lineItems: [best] },
    },
    defaultPackage: "BETTER",
    confidence,
    questions,
    pricing: {
      pricebookVersion: process.env.PRICEBOOK_VERSION || "v1",
      inputs: {
        ...pricingInputs,
        onebuild: onebuild
          ? { source: onebuild._meta.source, zipcode: onebuild._meta.zipcode, basis: marketBasis }
          : null,
      },
    },
  };
}
