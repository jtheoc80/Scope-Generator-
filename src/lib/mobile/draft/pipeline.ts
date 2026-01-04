import { aiService } from "@/lib/services/aiService";
import type { ProposalLineItem, ProposalTemplate, User } from "@shared/schema";
import { computePriceRange } from "./pricebook";
import { extractZip, getOneBuildTradePricingBestEffort, marketMultiplierFromOneBuild } from "./marketPricing";
import { getRemedyScopeItems, type RemedyType } from "@/src/lib/mobile/remedy";

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
  packages: Record<"GOOD" | "BETTER" | "BEST", { label: string; total: number; lineItems: ProposalLineItem[] }>;
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

/**
 * Parse remedy selections from job notes
 * Returns map of issue types to selected remedies
 */
function parseRemedySelectionsFromNotes(notes: string): Map<string, RemedyType> {
  const remedyMap = new Map<string, RemedyType>();
  
  // Look for ACTION: REPAIR or ACTION: REPLACE markers in the notes
  const actionMatches = notes.matchAll(/([^;,]+?)\s*\(ACTION:\s*(REPAIR|REPLACE)\)/gi);
  for (const match of actionMatches) {
    const label = match[1].trim().toLowerCase();
    const remedy = match[2].toLowerCase() as RemedyType;
    
    // Try to determine issue type from label
    if (label.includes("faucet") || label.includes("tap")) {
      remedyMap.set("leaking_faucet", remedy);
    }
    // Future: add more issue type detection
  }
  
  return remedyMap;
}

/**
 * Generate remedy-specific scope sections
 * Returns scope items to prepend based on remedy selections
 */
function generateRemedyScopeItems(remedySelections: Map<string, RemedyType>): {
  scopeItems: string[];
  scopeSections: Array<{ title: string; items: string[]; remedy: RemedyType }>;
} {
  const scopeItems: string[] = [];
  const scopeSections: Array<{ title: string; items: string[]; remedy: RemedyType }> = [];
  
  for (const [issueType, remedy] of remedySelections) {
    const items = getRemedyScopeItems(issueType, remedy);
    
    if (items.length > 0) {
      // Add to flat list
      scopeItems.push(...items);
      
      // Add as section with title
      let title = "Work Scope";
      if (issueType === "leaking_faucet" || issueType === "faucet_issue") {
        title = remedy === "replace" ? "Faucet Replacement" : "Faucet Repair";
      }
      
      scopeSections.push({ title, items, remedy });
    }
  }
  
  return { scopeItems, scopeSections };
}

// Build comprehensive job notes from vision analysis
function buildVisionNotes(visionContext: ReturnType<typeof extractVisionContext>, userNotes?: string | null): string {
  const parts: string[] = [];

  if (userNotes?.trim()) {
    parts.push(`CONTRACTOR NOTES: ${userNotes.trim()}`);
  }

  /**
   * If the contractor/user has explicitly confirmed scope (tier/answers) or selected
   * specific issues to address, we must NOT leak additional AI-detected issues into
   * the enhancement prompt. Otherwise the enhancer can "helpfully" add unselected
   * items (e.g., sink/staining) and create scope creep.
   */
  const hasExplicitScopeSelection = (() => {
    const t = userNotes?.toLowerCase() || "";
    return (
      t.includes("selected issues to address:") ||
      t.includes("confirmed scope tier:") ||
      t.includes("confirmed painting scope:") ||
      t.includes("important: price only for the confirmed scope") ||
      t.includes("important: scope only includes")
    );
  })();

  if (hasExplicitScopeSelection) {
    // Only pass through the contractor-confirmed notes. Do not add any additional
    // scope signals from vision that could conflict with explicit selections.
    return parts.join("\n\n");
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

  // Parse remedy selections from job notes (if any)
  const remedySelections = parseRemedySelectionsFromNotes(job.jobNotes ?? "");
  const { scopeItems: remedyScopeItems, scopeSections: remedyScopeSections } = generateRemedyScopeItems(remedySelections);
  
  console.log("draft.remedySelections", {
    jobId: job.id,
    selectionsCount: remedySelections.size,
    remedyScopeItemsCount: remedyScopeItems.length,
  });

  // Determine base scope: if we have remedy-specific scope, use that as base
  // Otherwise fall back to template base scope
  let baseScope = template.baseScope;
  if (remedyScopeItems.length > 0) {
    // Prepend remedy-specific scope items to the base scope
    baseScope = [...remedyScopeItems, ...template.baseScope.filter(item => {
      // Filter out generic items that conflict with specific remedy items
      const itemLower = item.toLowerCase();
      const hasReplacementRemedy = Array.from(remedySelections.values()).includes("replace");
      const hasRepairRemedy = Array.from(remedySelections.values()).includes("repair");
      
      // Don't include generic "repair" items if we're doing a replacement
      if (hasReplacementRemedy && !hasRepairRemedy) {
        if (itemLower.includes("repair") || itemLower.includes("cartridge") || itemLower.includes("washer")) {
          return false;
        }
      }
      return true;
    })];
  }

  // Use the comprehensive vision-derived notes for scope enhancement
  const enhance = await aiService.enhanceScope({
    jobTypeName: template.jobTypeName,
    baseScope,
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

  // Build scope sections for structured display (if remedy selections present)
  const scopeSections: Array<{ title: string; items: string[]; remedy?: "repair" | "replace" | "either" }> = [];
  if (remedyScopeSections.length > 0) {
    // Add remedy-specific sections
    for (const section of remedyScopeSections) {
      scopeSections.push({
        title: section.title,
        items: section.items,
        remedy: section.remedy,
      });
    }
    // Add remaining scope as "Additional Work" section if any
    const remedyItemsSet = new Set(remedyScopeItems.map(i => i.toLowerCase()));
    const additionalItems = scope.filter(item => !remedyItemsSet.has(item.toLowerCase()));
    if (additionalItems.length > 0) {
      scopeSections.push({
        title: "Additional Work",
        items: additionalItems,
      });
    }
  }

  const lineItem: ProposalLineItem = {
    id: crypto.randomUUID(),
    tradeId: template.tradeId,
    tradeName: template.tradeName,
    jobTypeId: template.jobTypeId,
    jobTypeName: template.jobTypeName,
    jobSize: job.jobSize,
    scope,
    // Include structured scope sections if available
    ...(scopeSections.length > 0 && { scopeSections }),
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

  // Calculate totals as midpoint of priceLow and priceHigh for each package
  const goodTotal = Math.round((good.priceLow + good.priceHigh) / 2);
  const betterTotal = Math.round((better.priceLow + better.priceHigh) / 2);
  const bestTotal = Math.round((best.priceLow + best.priceHigh) / 2);

  return {
    packages: {
      GOOD: { label: "Good", total: goodTotal, lineItems: [good] },
      BETTER: { label: "Better", total: betterTotal, lineItems: [better] },
      BEST: { label: "Best", total: bestTotal, lineItems: [best] },
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
