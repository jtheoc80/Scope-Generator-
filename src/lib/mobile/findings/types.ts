import { z } from "zod";

/**
 * Scope clarification types for the gated proposal flow.
 * 
 * Flow: Photo Analysis → Findings Summary → Clarifying Questions → Scope Selection → Pricing → Proposal
 */

// Detected finding from photo analysis
export const findingSchema = z.object({
  id: z.string(),
  issue: z.string(),
  description: z.string().optional(),
  confidence: z.number().min(0).max(1),
  locationGuess: z.string().optional(),
  category: z.enum([
    "damage",
    "repair", 
    "maintenance",
    "upgrade",
    "inspection",
    "painting",
    "plumbing",
    "electrical",
    "structural",
    "other",
  ]),
  photoIds: z.array(z.number()).default([]),
  severity: z.enum(["low", "medium", "high"]).optional(),
});

export type Finding = z.infer<typeof findingSchema>;

// Unknown/uncertain aspects that need clarification
export const unknownSchema = z.object({
  id: z.string(),
  description: z.string(),
  impactsScope: z.boolean().default(true),
  impactsPricing: z.boolean().default(true),
});

export type Unknown = z.infer<typeof unknownSchema>;

// Scope option for clarifying questions
export const scopeOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
  priceMultiplier: z.number().optional(), // e.g., 1.0 for base, 2.5 for full room
  estimatedSqFt: z.number().optional(),
  isDefault: z.boolean().optional(),
});

export type ScopeOption = z.infer<typeof scopeOptionSchema>;

// Clarifying question to ask the user
export const clarifyingQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  questionType: z.enum(["single_select", "multi_select", "number", "text", "boolean"]),
  options: z.array(scopeOptionSchema).optional(),
  unit: z.string().optional(), // e.g., "sq ft", "linear ft"
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  required: z.boolean().default(true),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  helpText: z.string().optional(),
  impactArea: z.enum(["scope", "pricing", "timeline", "materials"]).optional(),
});

export type ClarifyingQuestion = z.infer<typeof clarifyingQuestionSchema>;

// Scope tier (Good/Better/Best style pricing tiers)
export const scopeTierSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g., "Spot Repair", "One Wall", "Entire Room"
  description: z.string(),
  level: z.enum(["minimum", "recommended", "premium"]),
  scopeItems: z.array(z.string()),
  estimatedDays: z.object({
    low: z.number(),
    high: z.number(),
  }),
  priceRange: z.object({
    low: z.number(),
    high: z.number(),
  }).optional(),
  requiresConfirmation: z.boolean().default(false),
  warnings: z.array(z.string()).optional(),
});

export type ScopeTier = z.infer<typeof scopeTierSchema>;

// Full findings summary response from the API
export const findingsSummarySchema = z.object({
  status: z.enum(["ready", "analyzing", "no_photos"]),
  
  // What the AI detected
  findings: z.array(findingSchema),
  
  // Things the AI is uncertain about
  unknowns: z.array(unknownSchema),
  
  // Whether user must answer questions before pricing
  needsClarification: z.boolean(),
  
  // Questions to ask user (if needsClarification is true)
  clarifyingQuestions: z.array(clarifyingQuestionSchema),
  
  // Suggested scope tiers (minimum, recommended, premium)
  suggestedTiers: z.array(scopeTierSchema).optional(),
  
  // Aggregate confidence in the analysis
  overallConfidence: z.number().min(0).max(1),
  
  // Photos stats
  photosAnalyzed: z.number(),
  photosTotal: z.number(),
  
  // Suggested problem statement (auto-generated)
  suggestedProblem: z.string().optional(),
  
  // Recommendations for additional photos
  needsMorePhotos: z.array(z.string()).optional(),
  
  // Trade category detected (painting, plumbing, etc.)
  detectedTrade: z.string().optional(),
  
  // Whether this appears to be a painting job (triggers special handling)
  isPaintingJob: z.boolean().default(false),
});

export type FindingsSummary = z.infer<typeof findingsSummarySchema>;

// User's response to clarifying questions
export const scopeSelectionSchema = z.object({
  // Selected scope tier
  selectedTierId: z.string().optional(),
  
  // Answers to clarifying questions
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  
  // Confirmed scope items (user can modify)
  confirmedScopeItems: z.array(z.string()).optional(),
  
  // User-provided measurements
  measurements: z.object({
    squareFeet: z.number().optional(),
    linearFeet: z.number().optional(),
    roomCount: z.number().optional(),
    wallCount: z.number().optional(),
    ceilingHeight: z.number().optional(),
  }).optional(),
  
  // User's problem statement (can override suggested)
  problemStatement: z.string().optional(),
});

export type ScopeSelection = z.infer<typeof scopeSelectionSchema>;

// Painting-specific scope options
export const PAINTING_SCOPE_OPTIONS: ScopeOption[] = [
  {
    value: "spot_repair",
    label: "Spot repair only",
    description: "Touch up and blend specific damaged areas (10-30 sq ft)",
    priceMultiplier: 1.0,
    estimatedSqFt: 20,
    isDefault: true,
  },
  {
    value: "one_wall",
    label: "Paint one wall",
    description: "Full repaint of a single wall",
    priceMultiplier: 2.5,
  },
  {
    value: "entire_room",
    label: "Paint entire room",
    description: "All walls in the room (ceiling optional)",
    priceMultiplier: 6.0,
  },
  {
    value: "entire_house",
    label: "Paint entire house",
    description: "Full interior or exterior repaint",
    priceMultiplier: 20.0,
  },
];

// Standard clarifying questions for painting jobs
export const PAINTING_CLARIFYING_QUESTIONS: ClarifyingQuestion[] = [
  {
    id: "paint_scope",
    question: "What's the scope of painting needed?",
    questionType: "single_select",
    options: PAINTING_SCOPE_OPTIONS,
    required: true,
    impactArea: "scope",
    helpText: "If unsure, start with spot repair - you can always expand scope later",
  },
  {
    id: "room_size",
    question: "Approximate room size?",
    questionType: "number",
    unit: "sq ft",
    minValue: 50,
    maxValue: 5000,
    required: false,
    impactArea: "pricing",
    helpText: "Helps provide accurate pricing. A typical bedroom is 120-150 sq ft.",
  },
  {
    id: "ceiling_height",
    question: "Ceiling height?",
    questionType: "single_select",
    options: [
      { value: "standard", label: "Standard (8-9 ft)", priceMultiplier: 1.0 },
      { value: "tall", label: "Tall (10-12 ft)", priceMultiplier: 1.3 },
      { value: "vaulted", label: "Vaulted/Cathedral (12+ ft)", priceMultiplier: 1.6 },
    ],
    required: false,
    impactArea: "pricing",
  },
  {
    id: "include_ceiling",
    question: "Include ceiling?",
    questionType: "boolean",
    defaultValue: false,
    required: false,
    impactArea: "scope",
  },
  {
    id: "color_change",
    question: "Is this a color change?",
    questionType: "boolean",
    defaultValue: false,
    required: false,
    helpText: "Color changes may require additional primer coats",
    impactArea: "pricing",
  },
];

// Painting scope tiers
export const PAINTING_SCOPE_TIERS: ScopeTier[] = [
  {
    id: "painting_tier_a",
    name: "Spot Repair & Blend",
    description: "Patch, prime, and paint damaged areas only (10-30 sq ft)",
    level: "minimum",
    scopeItems: [
      "Prep damaged area",
      "Sand and prime affected spots",
      "Apply matching paint",
      "Blend with surrounding area",
      "Touch-up as needed",
    ],
    estimatedDays: { low: 1, high: 1 },
    requiresConfirmation: false,
  },
  {
    id: "painting_tier_b",
    name: "One Wall Repaint",
    description: "Full preparation and repaint of a single wall",
    level: "recommended",
    scopeItems: [
      "Protect floors and adjacent surfaces",
      "Fill holes and cracks",
      "Sand and prime wall",
      "Apply 2 coats of paint",
      "Clean up and touch-up",
    ],
    estimatedDays: { low: 1, high: 2 },
    requiresConfirmation: false,
  },
  {
    id: "painting_tier_c",
    name: "Entire Room",
    description: "Complete room repaint including all walls",
    level: "premium",
    scopeItems: [
      "Move/cover furniture",
      "Protect floors with drop cloths",
      "Repair all wall imperfections",
      "Prime as needed",
      "Apply 2 coats to all walls",
      "Paint trim and baseboards",
      "Ceiling paint (optional)",
      "Final cleanup",
    ],
    estimatedDays: { low: 2, high: 4 },
    requiresConfirmation: true,
    warnings: [
      "Ensure room dimensions are confirmed before final pricing",
    ],
  },
];

// Helper to detect if findings suggest a painting job
export function detectPaintingJob(findings: Finding[]): boolean {
  const paintingKeywords = [
    "paint", "peeling", "fading", "discolor", "stain", "wall", 
    "trim", "baseboard", "ceiling", "primer", "coat", "color"
  ];
  
  return findings.some(f => {
    const text = `${f.issue} ${f.description || ""} ${f.locationGuess || ""}`.toLowerCase();
    return paintingKeywords.some(kw => text.includes(kw)) || f.category === "painting";
  });
}

// Helper to check if scope needs user confirmation
export function requiresScopeConfirmation(
  findings: Finding[],
  estimatedArea?: number
): { required: boolean; reason?: string } {
  // If painting job detected without clear scope indicator
  const isPainting = detectPaintingJob(findings);
  if (isPainting) {
    return {
      required: true,
      reason: "Painting scope (spot repair vs. full room) cannot be determined from photos alone",
    };
  }
  
  // If estimated area is large and not confirmed
  if (estimatedArea && estimatedArea > 200) {
    return {
      required: true,
      reason: `Estimated area (${estimatedArea} sq ft) is large - please confirm before pricing`,
    };
  }
  
  // Low confidence findings
  const lowConfidenceCount = findings.filter(f => f.confidence < 0.6).length;
  if (lowConfidenceCount > findings.length / 2) {
    return {
      required: true,
      reason: "Multiple findings have low confidence - please verify scope",
    };
  }
  
  return { required: false };
}

// Generate scope tiers from findings
export function generateScopeTiers(
  findings: Finding[],
  isPainting: boolean,
  scopeSelection?: ScopeSelection
): ScopeTier[] {
  if (isPainting) {
    // Use painting-specific tiers
    return PAINTING_SCOPE_TIERS.map(tier => {
      // Adjust pricing based on scope selection if available
      if (scopeSelection?.measurements?.squareFeet) {
        const sqFt = scopeSelection.measurements.squareFeet;
        const basePricePerSqFt = 4; // $4/sq ft base for painting
        const tierMultipliers = { minimum: 0.5, recommended: 1.0, premium: 1.5 };
        const multiplier = tierMultipliers[tier.level];
        
        return {
          ...tier,
          priceRange: {
            low: Math.round(sqFt * basePricePerSqFt * multiplier * 0.8),
            high: Math.round(sqFt * basePricePerSqFt * multiplier * 1.2),
          },
        };
      }
      return tier;
    });
  }
  
  // Generic tiers for non-painting jobs
  const allIssues = findings.map(f => f.issue);
  
  return [
    {
      id: "generic_minimum",
      name: "Minimum Repair",
      description: "Address critical issues only",
      level: "minimum",
      scopeItems: findings
        .filter(f => f.severity === "high" || f.category === "damage")
        .map(f => f.issue),
      estimatedDays: { low: 1, high: 2 },
      requiresConfirmation: false,
    },
    {
      id: "generic_recommended",
      name: "Recommended",
      description: "Address all identified issues",
      level: "recommended",
      scopeItems: allIssues,
      estimatedDays: { low: 2, high: 4 },
      requiresConfirmation: false,
    },
    {
      id: "generic_premium",
      name: "Premium",
      description: "Complete repairs plus preventive maintenance",
      level: "premium",
      scopeItems: [
        ...allIssues,
        "Preventive maintenance inspection",
        "Extended warranty coverage",
      ],
      estimatedDays: { low: 3, high: 5 },
      requiresConfirmation: true,
    },
  ];
}
