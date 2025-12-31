import type { ProposalLineItem, ScopeSection, User } from "@shared/schema";

type DrivewayRemovalType = "none" | "asphalt" | "concrete";
type DrivewayBaseCondition = "good" | "unknown" | "poor";
type DrivewayAccessType = "easy" | "tight" | "no-truck-access";
type DrivewayFinishType = "broom" | "exposed" | "stamped";
type DrivewayPackage = "GOOD" | "BETTER" | "BEST";
type DrivewayReinforcement = "fiber" | "wire-mesh" | "#3-rebar" | "#4-rebar" | "none";

export type DrivewayScopeSelection = {
  drivewaySlabSelected?: boolean;
  walkwaySelected?: boolean;
  drivewaySF?: number;
  drivewayPerimeterLF?: number;
  walkwaySF?: number;
  walkwayLF?: number;
  walkwayWidthFt?: number;
  totalSF?: number;
  thicknessIn?: number;
  concreteCY?: number;
  removalType?: DrivewayRemovalType;
  baseCondition?: DrivewayBaseCondition;
  accessType?: DrivewayAccessType;
  finishType?: DrivewayFinishType;
  reinforcement?: DrivewayReinforcement;
  selectedPackage?: "good" | "better" | "best";
};

function toNum(x: unknown, fallback = 0): number {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function toStr<T extends string>(x: unknown, allowed: readonly T[], fallback: T): T {
  return (typeof x === "string" && (allowed as readonly string[]).includes(x)) ? (x as T) : fallback;
}

function bool(x: unknown, fallback: boolean): boolean {
  return typeof x === "boolean" ? x : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function round0(n: number) {
  return Math.round(n);
}

function formatQty(n: number, unit: string) {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;
}

function buildDrainageSection(params: {
  baseCondition: DrivewayBaseCondition;
  accessType: DrivewayAccessType;
}): ScopeSection {
  const items: string[] = [
    "Verify slope away from structures and toward approved drainage paths.",
    "Confirm existing drainage paths and discharge points prior to placement.",
    "Recommend control joints to reduce cracking and improve drainage performance.",
    "Verify downspout discharge is directed away from slab edges (extensions/tie-ins as needed).",
  ];

  if (params.baseCondition === "poor") {
    items.push("NOTE: Base condition marked poor — additional base work may be required (to be confirmed on site).");
  }
  if (params.accessType === "no-truck-access") {
    items.push("NOTE: No truck access — plan for alternative concrete placement (pump, buggy, or hand carry).");
  }

  items.push("Suggested add-ons: Channel drain, Catch basin, Regrade, Downspout tie-in / extensions.");

  return { title: "Drainage considerations", items };
}

/**
 * Driveway Pricing Configuration
 * 
 * This configuration object centralizes all pricing constants used in driveway
 * proposal calculations. All values represent cost adjustments per square foot ($/SF)
 * unless otherwise noted.
 * 
 * Pricing Model Overview:
 * - Base price range: $10-$16/SF for standard 4" broom finish concrete driveway
 * - Adjustments are additive based on project characteristics
 * - Package multipliers (GOOD/BETTER/BEST) apply to the adjusted base
 * - User and trade multipliers apply last for regional/business adjustments
 */
const DRIVEWAY_PRICING_CONFIG = {
  /**
   * Base pricing per square foot for GOOD package (standard configuration)
   * - baseLow: Minimum price for competitive market conditions
   * - baseHigh: Maximum price for premium market conditions or complex projects
   */
  basePricing: {
    baseLow: 10,    // $/SF - Base minimum price
    baseHigh: 16,   // $/SF - Base maximum price
  },

  /**
   * Removal cost adjustments ($/SF)
   * Cost to remove and haul away existing surface before new concrete placement
   * - none: No removal needed (new construction or prepared surface)
   * - asphalt: Remove asphalt overlay (lighter material, easier removal)
   * - concrete: Remove existing concrete (heavier, requires breaking/sawing)
   */
  removalCosts: {
    none: 0,
    asphalt: 1.5,
    concrete: 2.5,
  },

  /**
   * Base condition cost adjustments ($/SF)
   * Cost to prepare and stabilize the subgrade before concrete placement
   * - good: Stable, compacted base requires minimal work
   * - unknown: Standard allowance for inspection and minor corrections
   * - poor: Significant work needed (soft spots, regrade, additional material)
   */
  baseConditionCosts: {
    good: 0,
    unknown: 0.75,
    poor: 2.0,
  },

  /**
   * Site access cost adjustments ($/SF)
   * Additional costs for material delivery and equipment access challenges
   * - easy: Standard truck access, minimal handling
   * - tight: Limited access, requires smaller equipment or additional labor
   * - no-truck-access: Requires pump truck, buggy, or hand placement
   */
  accessCosts: {
    easy: 0,
    tight: 0.5,
    "no-truck-access": 1.5,
  },

  /**
   * Finish type cost adjustments ($/SF)
   * Premium finishes require additional labor, materials, and expertise
   * - broom: Standard slip-resistant finish (baseline)
   * - exposed: Exposed aggregate with wash and sealer
   * - stamped: Decorative pattern with color/release agents and detailing
   */
  finishCosts: {
    broom: 0,
    exposed: 4.0,
    stamped: 6.0,
  },

  /**
   * Thickness cost adjustments ($/SF)
   * Additional concrete volume and placement costs for thicker slabs
   * - 4": Standard residential driveway thickness (baseline)
   * - 5": Enhanced thickness for heavier vehicles or poor soil
   * - 6": Heavy-duty thickness for large vehicles or commercial use
   */
  thicknessCosts: {
    4: 0,
    5: 1.0,
    6: 2.0,
  },

  /**
   * Reinforcement cost adjustments ($/SF)
   * Cost of reinforcement materials and installation labor
   * - none: No reinforcement (not recommended for most applications)
   * - fiber: Synthetic fibers mixed into concrete (crack control)
   * - wire-mesh: Welded wire fabric (structural reinforcement)
   * - #3-rebar: 3/8" rebar grid (standard structural reinforcement)
   * - #4-rebar: 1/2" rebar grid (heavy-duty structural reinforcement)
   */
  reinforcementCosts: {
    none: 0,
    fiber: 0.5,
    "wire-mesh": 1.0,
    "#3-rebar": 2.0,
    "#4-rebar": 3.0,
  },

  /**
   * Package tier multipliers (applied to adjusted base price)
   * These multipliers reflect the comprehensive service level differences:
   * 
   * - GOOD (1.0x): Standard scope with baseline specifications
   *   - 4" thickness, broom finish, no reinforcement
   *   - Standard base prep and drainage considerations
   * 
   * - BETTER (1.15x): Enhanced scope with quality upgrades
   *   - 5" thickness minimum, wire mesh reinforcement
   *   - Enhanced base allowance and compaction
   *   - Better long-term performance and durability
   * 
   * - BEST (1.35x): Premium scope with top-tier features
   *   - 6" thickness minimum, rebar reinforcement
   *   - Premium base work with verification
   *   - Includes sealing and comprehensive drainage planning
   *   - Maximum longevity and performance
   */
  packageMultipliers: {
    GOOD: 1.0,
    BETTER: 1.15,
    BEST: 1.35,
  },
} as const;

/**
 * Calculate per-square-foot cost adjustments based on project characteristics
 * 
 * This function applies additive adjustments to the base price for various
 * project factors. All adjustments are per square foot and sum together
 * before package multipliers are applied.
 * 
 * @returns Object with individual adjustment values ($/SF) for each factor
 */
function pricePerSFInputs(params: {
  removalType: DrivewayRemovalType;
  baseCondition: DrivewayBaseCondition;
  accessType: DrivewayAccessType;
  finishType: DrivewayFinishType;
  thicknessIn: 4 | 5 | 6;
  reinforcement: DrivewayReinforcement;
}) {
  return {
    removal: DRIVEWAY_PRICING_CONFIG.removalCosts[params.removalType],
    base: DRIVEWAY_PRICING_CONFIG.baseConditionCosts[params.baseCondition],
    access: DRIVEWAY_PRICING_CONFIG.accessCosts[params.accessType],
    finish: DRIVEWAY_PRICING_CONFIG.finishCosts[params.finishType],
    thickness: DRIVEWAY_PRICING_CONFIG.thicknessCosts[params.thicknessIn],
    rebar: DRIVEWAY_PRICING_CONFIG.reinforcementCosts[params.reinforcement],
  };
}

/**
 * Compute price range for a specific package tier
 * 
 * Pricing calculation follows this formula:
 * 
 * 1. Start with base price range (baseLow to baseHigh $/SF)
 * 2. Add all project-specific adjustments (removal, base, access, finish, thickness, reinforcement)
 * 3. Apply package tier multiplier (GOOD=1.0x, BETTER=1.15x, BEST=1.35x)
 * 4. Multiply by total square footage
 * 5. Apply user price multiplier (regional pricing adjustment, default 100%)
 * 6. Apply trade-specific multiplier (specialty trade markup, default 100%)
 * 
 * Example for 500 SF driveway with BETTER package:
 * - Base: $10-$16/SF
 * - Adjustments: +$2.5 concrete removal, +$0.75 unknown base, +$1.0 wire-mesh
 * - Adjusted: $14.25-$20.25/SF
 * - With BETTER multiplier (1.15x): $16.39-$23.29/SF
 * - Total: $8,195-$11,645
 * - After user/trade multipliers (if any)
 * 
 * @returns Price range object with low and high values in dollars
 */
function computePriceRangeForPackage(params: {
  totalSF: number;
  packageKey: DrivewayPackage;
  removalType: DrivewayRemovalType;
  baseCondition: DrivewayBaseCondition;
  accessType: DrivewayAccessType;
  finishType: DrivewayFinishType;
  thicknessIn: 4 | 5 | 6;
  reinforcement: DrivewayReinforcement;
  user: Pick<User, "priceMultiplier" | "tradeMultipliers">;
  tradeId: string;
}) {
  const totalSF = Math.max(0, params.totalSF);

  // Step 1: Get base pricing from configuration
  const baseLow = DRIVEWAY_PRICING_CONFIG.basePricing.baseLow;
  const baseHigh = DRIVEWAY_PRICING_CONFIG.basePricing.baseHigh;

  // Step 2: Calculate all project-specific adjustments
  const adjustments = pricePerSFInputs({
    removalType: params.removalType,
    baseCondition: params.baseCondition,
    accessType: params.accessType,
    finishType: params.finishType,
    thicknessIn: params.thicknessIn,
    reinforcement: params.reinforcement,
  });

  // Sum all adjustments (additive model)
  const totalAdjustment = 
    adjustments.removal + 
    adjustments.base + 
    adjustments.access + 
    adjustments.finish + 
    adjustments.thickness + 
    adjustments.rebar;

  // Step 3: Apply adjustments to base price
  let lowPerSF = baseLow + totalAdjustment;
  let highPerSF = baseHigh + totalAdjustment;

  // Step 4: Apply package tier multiplier
  const pkgMult = DRIVEWAY_PRICING_CONFIG.packageMultipliers[params.packageKey];
  lowPerSF *= pkgMult;
  highPerSF *= pkgMult;

  // Step 5: Apply user price multiplier (stored as percentage, e.g., 110 = 110%)
  const userMult = (params.user.priceMultiplier ?? 100) / 100;

  // Step 6: Apply trade-specific multiplier (stored as percentage, e.g., 105 = 105%)
  const tradeMultMap = (params.user.tradeMultipliers || {}) as Record<string, number>;
  const tradeMult = typeof tradeMultMap[params.tradeId] === "number" ? tradeMultMap[params.tradeId] / 100 : 1.0;

  // Calculate final price range (multiply by area and all multipliers)
  const low = round0(totalSF * lowPerSF * userMult * tradeMult);
  const high = round0(totalSF * highPerSF * userMult * tradeMult);

  // Ensure high is always >= low (edge case protection)
  return { low: Math.min(low, high), high: Math.max(low, high) };
}

function buildCommonSections(params: {
  includeDrivewaySlab: boolean;
  includeWalkway: boolean;
  drivewaySF: number;
  drivewayPerimeterLF: number;
  walkwaySF: number;
  walkwayLF: number;
  walkwayWidthFt: number;
  thicknessIn: 4 | 5 | 6;
  concreteCY: number;
  removalType: DrivewayRemovalType;
  baseCondition: DrivewayBaseCondition;
  accessType: DrivewayAccessType;
  finishType: DrivewayFinishType;
  reinforcement: DrivewayReinforcement;
}): ScopeSection[] {
  const scope: ScopeSection[] = [];

  scope.push({
    title: "Measurements & quantities",
    items: [
      ...(params.includeDrivewaySlab ? [`Driveway area: ${formatQty(params.drivewaySF, "SF")}`] : []),
      ...(params.includeWalkway ? [`Walkway area: ${formatQty(params.walkwaySF, "SF")} (${formatQty(params.walkwayLF, "LF")} @ ${params.walkwayWidthFt}ft)`] : []),
      `Total area: ${formatQty(params.includeDrivewaySlab ? params.drivewaySF + (params.includeWalkway ? params.walkwaySF : 0) : params.walkwaySF, "SF")}`,
      `Thickness: ${params.thicknessIn}"`,
      `Estimated concrete: ${formatQty(params.concreteCY, "CY")} (includes 10% waste)`,
      ...(params.includeDrivewaySlab ? [`Forms perimeter (driveway): ${formatQty(params.drivewayPerimeterLF, "LF")}`] : []),
    ],
  });

  scope.push({
    title: "Demolition & removal",
    items: [
      params.removalType === "none"
        ? "No existing surface removal included unless required by field conditions."
        : params.removalType === "asphalt"
          ? "Remove and haul off existing asphalt as required for specified slab area."
          : "Remove and haul off existing concrete as required for specified slab area.",
      "Protect adjacent surfaces and landscaping as needed during removal.",
      "Dispose of debris off-site.",
    ],
  });

  scope.push({
    title: "Base preparation",
    items: [
      params.baseCondition === "good"
        ? "Standard base prep allowance (minor grading and compaction)."
        : params.baseCondition === "unknown"
          ? "Verify base condition on site; include standard allowance for grading and compaction."
          : "Additional base work anticipated (remove soft spots, add base material, and re-compact as needed).",
      "Verify subgrade elevation and maintain positive drainage away from structures.",
    ],
  });

  scope.push({
    title: "Forming, reinforcement, and placement",
    items: [
      "Set and brace forms to line and grade.",
      params.reinforcement === "none"
        ? "Reinforcement not included unless required by local conditions/code."
        : `Install reinforcement: ${params.reinforcement.replace("-", " ")}.`,
      "Place concrete, screed to grade, and finish to specified finish.",
    ],
  });

  scope.push({
    title: "Finish, joints, and curing",
    items: [
      params.finishType === "broom"
        ? "Broom finish for slip resistance."
        : params.finishType === "exposed"
          ? "Exposed aggregate finish (includes surface wash and cleanup)."
          : "Stamped finish (pattern + release agent + detailing).",
      "Install control joints per standard spacing and site layout.",
      "Cure per best practices; provide homeowner guidance for use during curing period.",
    ],
  });

  scope.push({
    title: "Cleanup",
    items: [
      "Final cleanup and haul-off of job debris.",
      "Final walkthrough and confirm scope completion.",
    ],
  });

  return scope;
}

export function generateDrivewayDraft(params: {
  job: {
    id: number;
    tradeId: string;
    tradeName: string | null;
    jobTypeId: string;
    jobTypeName: string;
    jobSize: number;
  };
  user: Pick<User, "priceMultiplier" | "tradeMultipliers">;
  driveway: DrivewayScopeSelection;
}) {
  const includeDrivewaySlab = bool(params.driveway.drivewaySlabSelected, true);
  const includeWalkway = bool(params.driveway.walkwaySelected, false);

  const drivewaySF = clamp(toNum(params.driveway.drivewaySF, 0), 0, 1_000_000);
  const drivewayPerimeterLF = clamp(toNum(params.driveway.drivewayPerimeterLF, 0), 0, 1_000_000);
  const walkwaySF = clamp(toNum(params.driveway.walkwaySF, 0), 0, 1_000_000);
  const walkwayLF = clamp(toNum(params.driveway.walkwayLF, 0), 0, 1_000_000);
  const walkwayWidthFt = clamp(toNum(params.driveway.walkwayWidthFt, 4), 1, 20);

  const totalSF = clamp(
    toNum(params.driveway.totalSF, includeDrivewaySlab ? drivewaySF + (includeWalkway ? walkwaySF : 0) : walkwaySF),
    0,
    1_000_000
  );

  const thicknessRaw = toNum(params.driveway.thicknessIn, 4);
  const thicknessIn: 4 | 5 | 6 = thicknessRaw === 6 ? 6 : thicknessRaw === 5 ? 5 : 4;
  const concreteCY = clamp(toNum(params.driveway.concreteCY, 0), 0, 100_000);

  const removalType = toStr(params.driveway.removalType, ["none", "asphalt", "concrete"] as const, "none");
  const baseCondition = toStr(params.driveway.baseCondition, ["good", "unknown", "poor"] as const, "unknown");
  const accessType = toStr(params.driveway.accessType, ["easy", "tight", "no-truck-access"] as const, "easy");
  const finishType = toStr(params.driveway.finishType, ["broom", "exposed", "stamped"] as const, "broom");
  const reinforcement = toStr(params.driveway.reinforcement, ["fiber", "wire-mesh", "#3-rebar", "#4-rebar", "none"] as const, "none");

  const baseSections = buildCommonSections({
    includeDrivewaySlab,
    includeWalkway,
    drivewaySF,
    drivewayPerimeterLF,
    walkwaySF,
    walkwayLF,
    walkwayWidthFt,
    thicknessIn,
    concreteCY,
    removalType,
    baseCondition,
    accessType,
    finishType,
    reinforcement,
  });

  const drainage = buildDrainageSection({ baseCondition, accessType });

  const makeLineItem = (pkg: DrivewayPackage) => {
    const pkgSections: ScopeSection[] = [...baseSections];

    if (pkg === "BETTER") {
      pkgSections.splice(2, 0, {
        title: "Upgrade allowances",
        items: [
          "Include enhanced base allowance for minor soft spots and additional compaction.",
          "Include reinforcement allowance per package (typically wire mesh).",
        ],
      });
    }

    if (pkg === "BEST") {
      pkgSections.splice(2, 0, {
        title: "Premium upgrades",
        items: [
          "Premium base allowance and compaction verification.",
          "Premium reinforcement allowance (rebar).",
          "Include sealing after cure (recommended for longevity and stain resistance).",
          "Include drainage add-on suggestions (channel drains, regrade, and downspout management).",
        ],
      });
    }

    pkgSections.push(drainage);

    const priceRange = computePriceRangeForPackage({
      totalSF,
      packageKey: pkg,
      removalType,
      baseCondition,
      accessType,
      finishType: pkg === "GOOD" ? "broom" : pkg === "BETTER" ? "broom" : finishType,
      thicknessIn: pkg === "GOOD" ? 4 : pkg === "BETTER" ? (thicknessIn >= 5 ? thicknessIn : 5) : (thicknessIn >= 6 ? thicknessIn : 6),
      reinforcement: pkg === "GOOD" ? "none" : pkg === "BETTER" ? (reinforcement !== "none" ? reinforcement : "wire-mesh") : (reinforcement !== "none" ? reinforcement : "#4-rebar"),
      user: params.user,
      tradeId: params.job.tradeId,
    });

    const lineItem: ProposalLineItem = {
      id: crypto.randomUUID(),
      tradeId: params.job.tradeId,
      tradeName: params.job.tradeName ?? "Driveway",
      jobTypeId: params.job.jobTypeId,
      jobTypeName: params.job.jobTypeName,
      jobSize: params.job.jobSize,
      scope: pkgSections.flatMap((s) => [`${s.title}:`, ...s.items]),
      scopeSections: pkgSections,
      options: {
        __mobile: {
          driveway: {
            totalSF,
            thicknessIn,
            concreteCY,
            removalType,
            baseCondition,
            accessType,
            finishType,
            reinforcement,
            package: pkg,
          },
        },
      },
      priceLow: priceRange.low,
      priceHigh: priceRange.high,
      estimatedDaysLow: pkg === "GOOD" ? 2 : pkg === "BETTER" ? 3 : 4,
      estimatedDaysHigh: pkg === "GOOD" ? 4 : pkg === "BETTER" ? 5 : 7,
      warranty: "1-year labor warranty on workmanship (materials per manufacturer).",
      exclusions: ["Permits/engineering unless specified", "Unseen subsurface conditions"],
    };

    return lineItem;
  };

  const good = makeLineItem("GOOD");
  const better = makeLineItem("BETTER");
  const best = makeLineItem("BEST");

  // Default package: honor a valid user selection if present; otherwise fall back to BETTER.
  const defaultPackage = toStr(
    (params.driveway.selectedPackage || "").toUpperCase(),
    ["GOOD", "BETTER", "BEST"] as const,
    "BETTER",
  ) as DrivewayPackage;

  return {
    packages: {
      GOOD: { label: "Good", lineItems: [good] },
      BETTER: { label: "Better", lineItems: [better] },
      BEST: { label: "Best", lineItems: [best] },
    },
    defaultPackage,
    confidence: 95,
    questions: [],
    pricing: {
      pricebookVersion: "driveway-v1",
      inputs: {
        totalSF,
        thicknessIn,
        concreteCY,
        removalType,
        baseCondition,
        accessType,
        finishType,
        reinforcement,
      },
    },
  };
}

