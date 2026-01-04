/**
 * Tests for Remedy Heuristics
 * 
 * Verifies the repair vs replace decisioning logic for detected issues.
 * Run with: npx tsx src/lib/mobile/remedy/heuristics.test.ts
 */

import {
  detectIssueType,
  extractConditionTags,
  applyRemedyHeuristics,
  getRemedyScopeItems,
  enrichIssuesWithRemedies,
} from "./heuristics";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${message}`);
    failed++;
  }
}

function run() {
  console.log("=".repeat(60));
  console.log("Remedy Heuristics Tests");
  console.log("=".repeat(60));

  // Test detectIssueType
  console.log("\n--- detectIssueType ---");
  
  assert(
    detectIssueType("Leaking faucet") === "leaking_faucet",
    "Detects leaking faucet from label"
  );
  
  assert(
    detectIssueType("Kitchen faucet leaking") === "leaking_faucet",
    "Detects faucet leaking variant"
  );
  
  assert(
    detectIssueType("Plumbing issue", "faucet is dripping") === "leaking_faucet",
    "Detects faucet from description"
  );
  
  assert(
    detectIssueType("Broken window") === undefined,
    "Returns undefined for non-faucet issues"
  );

  // Test extractConditionTags
  console.log("\n--- extractConditionTags ---");
  
  const corrosionTags = extractConditionTags("Faucet with corrosion");
  assert(
    corrosionTags.includes("corrosion"),
    "Extracts corrosion tag"
  );
  
  const multipleTags = extractConditionTags("Old dated faucet with mineral buildup and rust");
  assert(
    multipleTags.includes("dated") && multipleTags.includes("rust"),
    "Extracts multiple condition tags"
  );
  
  const unknownAgeTags = extractConditionTags("Faucet age unknown");
  assert(
    unknownAgeTags.includes("unknown_age"),
    "Extracts unknown age tag"
  );

  // Test applyRemedyHeuristics
  console.log("\n--- applyRemedyHeuristics ---");
  
  const corrodedFaucet = applyRemedyHeuristics({
    id: "test-1",
    label: "Leaking faucet with corrosion",
    confidence: 0.8,
    category: "damage",
    photoIds: [1],
  });
  
  assert(
    corrodedFaucet.issueType === "leaking_faucet",
    "Identifies issue type for corroded faucet"
  );
  
  assert(
    corrodedFaucet.remedies?.recommended === "replace",
    "Recommends replace for corroded faucet"
  );
  
  assert(
    corrodedFaucet.remedies?.rationale.some(r => r.toLowerCase().includes("corrosion")) ?? false,
    "Provides corrosion-related rationale"
  );

  // Test stained/aged faucet
  const agedFaucet = applyRemedyHeuristics({
    id: "test-2",
    label: "Leaking faucet",
    description: "Stained, aged fixture needs attention",
    confidence: 0.7,
    category: "repair",
    photoIds: [1, 2],
  });
  
  assert(
    agedFaucet.remedies?.recommended === "replace",
    "Recommends replace for stained/aged faucet"
  );
  
  assert(
    (agedFaucet.tags?.includes("stained") ?? false) && (agedFaucet.tags?.includes("aged") ?? false),
    "Extracts stained and aged tags"
  );

  // Test simple drip (should recommend repair)
  const simpleDrip = applyRemedyHeuristics({
    id: "test-3",
    label: "Faucet dripping slowly",
    confidence: 0.75,
    category: "repair",
    photoIds: [1],
  });
  
  assert(
    simpleDrip.remedies?.recommended === "repair",
    "Recommends repair for simple drip"
  );
  
  assert(
    simpleDrip.remedies?.rationale.some(r => r.toLowerCase().includes("cartridge")) ?? false,
    "Mentions cartridge in repair rationale"
  );

  // Test unknown age (should recommend replace - conservative)
  const unknownAge = applyRemedyHeuristics({
    id: "test-4",
    label: "Leaking faucet - age unknown",
    confidence: 0.6,
    category: "repair",
    photoIds: [],
  });
  
  assert(
    unknownAge.remedies?.recommended === "replace",
    "Recommends replace for unknown age (conservative)"
  );

  // Test both options available
  const basicFaucet = applyRemedyHeuristics({
    id: "test-5",
    label: "Kitchen faucet leaking",
    confidence: 0.8,
    category: "damage",
    photoIds: [1],
  });
  
  assert(
    basicFaucet.remedies?.repair?.available === true,
    "Repair option is available"
  );
  
  assert(
    basicFaucet.remedies?.replace?.available === true,
    "Replace option is available"
  );
  
  assert(
    (basicFaucet.remedies?.repair?.scopeItems?.length ?? 0) > 0,
    "Repair has scope items"
  );
  
  assert(
    (basicFaucet.remedies?.replace?.scopeItems?.length ?? 0) > 0,
    "Replace has scope items"
  );

  // Test getRemedyScopeItems
  console.log("\n--- getRemedyScopeItems ---");
  
  const repairItems = getRemedyScopeItems("leaking_faucet", "repair", {
    repair: { available: true, scopeItems: ["Repair item 1", "Repair item 2"] },
    replace: { available: true },
    recommended: "repair",
    rationale: [],
  });
  
  assert(
    repairItems.includes("Repair item 1"),
    "Returns repair scope items for repair remedy"
  );
  
  const replaceItems = getRemedyScopeItems("leaking_faucet", "replace", {
    repair: { available: true },
    replace: { available: true, scopeItems: ["Replace item 1", "Replace item 2"] },
    recommended: "replace",
    rationale: [],
  });
  
  assert(
    replaceItems.includes("Replace item 1"),
    "Returns replace scope items for replace remedy"
  );
  
  const eitherItems = getRemedyScopeItems("leaking_faucet", "either", undefined);
  
  assert(
    eitherItems.some(item => item.toLowerCase().includes("diagnose")),
    "Either remedy includes diagnose step"
  );
  
  assert(
    eitherItems.some(item => item.toLowerCase().includes("approval")),
    "Either remedy includes approval step"
  );

  // Test enrichIssuesWithRemedies
  console.log("\n--- enrichIssuesWithRemedies ---");
  
  const issues = [
    {
      id: "issue-1",
      label: "Leaking faucet with corrosion",
      confidence: 0.8,
      category: "damage" as const,
      photoIds: [1],
    },
    {
      id: "issue-2",
      label: "Broken window latch",
      confidence: 0.9,
      category: "repair" as const,
      photoIds: [2],
    },
  ];

  const enriched = enrichIssuesWithRemedies(issues);
  
  assert(
    enriched.length === 2,
    "Returns same number of issues"
  );
  
  assert(
    enriched[0].remedies?.recommended === "replace",
    "Faucet issue has remedy recommendation"
  );
  
  assert(
    enriched[1].remedies === undefined,
    "Window issue has no remedy (not yet supported)"
  );

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

run();
