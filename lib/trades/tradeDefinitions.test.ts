/**
 * tradeDefinitions unit test
 *
 * Validates that the tradeDefinitions map matches the expected schema.
 * Run with: npx tsx lib/trades/tradeDefinitions.test.ts
 */

import { tradeDefinitions, tradeDefinitionsSchema, tradeKeySchema } from "./tradeDefinitions";

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
  console.log("tradeDefinitions Schema Validation Tests");
  console.log("=".repeat(60));

  const parsed = tradeDefinitionsSchema.safeParse(tradeDefinitions);
  assert(parsed.success, "tradeDefinitions should conform to tradeDefinitionsSchema");

  const expectedKeys = tradeKeySchema.options;
  assert(
    expectedKeys.every((k) => k in tradeDefinitions),
    "tradeDefinitions should contain all required trade keys"
  );

  // Each definition key should match its map key (regression guard).
  for (const key of expectedKeys) {
    assert(
      tradeDefinitions[key].key === key,
      `tradeDefinitions['${key}'].key should equal '${key}'`
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));

  if (failed > 0) process.exit(1);
}

run();

