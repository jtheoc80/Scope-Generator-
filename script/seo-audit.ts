#!/usr/bin/env npx tsx
/**
 * SEO Audit CLI Script
 * Run with: npx tsx script/seo-audit.ts
 * Or add to package.json scripts: "seo:audit": "tsx script/seo-audit.ts"
 */

import { runSeoAudit, formatAuditReport, auditPasses, getSeoRecommendations } from "../lib/seo/audit";
import * as fs from "fs";
import * as path from "path";

// Parse command line arguments
const args = process.argv.slice(2);
const isCI = args.includes("--ci") || process.env.CI === "true";
const outputJson = args.includes("--json");
const outputFile = args.find((arg) => arg.startsWith("--output="))?.split("=")[1];
const strict = args.includes("--strict");

console.log("🔍 Running SEO Audit...\n");

// Run the audit
const report = runSeoAudit();

// Output based on flags
if (outputJson) {
  // JSON output for programmatic consumption
  const jsonOutput = JSON.stringify(
    {
      ...report,
      summary: {
        ...report.summary,
        duplicateTitles: Object.fromEntries(report.summary.duplicateTitles),
        duplicateDescriptions: Object.fromEntries(report.summary.duplicateDescriptions),
      },
    },
    null,
    2
  );

  if (outputFile) {
    const outputPath = path.resolve(process.cwd(), outputFile);
    fs.writeFileSync(outputPath, jsonOutput);
    console.log(`📄 JSON report saved to: ${outputPath}`);
  } else {
    console.log(jsonOutput);
  }
} else {
  // Human-readable output
  const formattedReport = formatAuditReport(report);
  console.log(formattedReport);

  // Show recommendations
  const recommendations = getSeoRecommendations(report);
  if (recommendations.length > 0) {
    console.log("\n📋 RECOMMENDATIONS:");
    console.log("─".repeat(60));
    for (const rec of recommendations) {
      console.log(`  • ${rec}`);
    }
    console.log("");
  }

  // Save to file if requested
  if (outputFile) {
    const outputPath = path.resolve(process.cwd(), outputFile);
    fs.writeFileSync(outputPath, formattedReport);
    console.log(`📄 Report saved to: ${outputPath}`);
  }
}

// Exit with appropriate code for CI
if (isCI || strict) {
  const passes = auditPasses(report, {
    maxErrors: strict ? 0 : 5,
    minScore: strict ? 80 : 60,
  });

  if (!passes) {
    console.log("\n❌ SEO Audit FAILED");
    console.log(`   Errors: ${report.errorCount} | Score: ${report.overallScore}/100`);
    process.exit(1);
  } else {
    console.log("\n✅ SEO Audit PASSED");
    console.log(`   Errors: ${report.errorCount} | Score: ${report.overallScore}/100`);
    process.exit(0);
  }
}

console.log("\n✨ SEO Audit Complete!");
