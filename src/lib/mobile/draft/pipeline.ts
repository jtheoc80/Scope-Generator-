import { aiService } from "@/lib/services/aiService";
import type { ProposalLineItem, ProposalTemplate, User } from "@shared/schema";
import { computePriceRange } from "./pricebook";

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
  photos: MobilePhotoInput[];
}): Promise<MobileDraftOutput> {
  const { job, template, user, photos } = params;

  // v1: use template scope + optional contractor notes.
  // (Vision parsing can be layered in later; we still require photos so the UX stays consistent.)
  const enhance = await aiService.enhanceScope({
    jobTypeName: template.jobTypeName,
    baseScope: template.baseScope,
    clientName: job.clientName,
    address: job.address,
    jobNotes: job.jobNotes ?? (photos.length ? `Photos captured: ${photos.length}.` : undefined),
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

  let confidence = enhance.success ? 70 : 45;
  if (photos.length >= 3) confidence += 10;
  if (job.jobNotes && job.jobNotes.length > 20) confidence += 5;
  confidence = Math.max(0, Math.min(95, confidence));

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
      inputs: pricingInputs,
    },
  };
}
