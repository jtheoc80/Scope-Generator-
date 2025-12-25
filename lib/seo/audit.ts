/**
 * SEO Audit System
 * Automated checking of SEO metadata across all pages.
 */

import { seoConfig, pagesSeoConfig } from "./config";
import { validateMetadata, shouldIndex } from "./metadata";

export type SeverityLevel = "error" | "warning" | "info";

export interface AuditIssue {
  page: string;
  severity: SeverityLevel;
  message: string;
  suggestion?: string;
}

export interface AuditResult {
  page: string;
  title?: string;
  description?: string;
  keywords?: string[];
  issues: AuditIssue[];
  score: number;
}

export interface AuditReport {
  timestamp: string;
  totalPages: number;
  pagesWithIssues: number;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  overallScore: number;
  results: AuditResult[];
  summary: {
    missingTitles: string[];
    missingDescriptions: string[];
    missingKeywords: string[];
    duplicateTitles: Map<string, string[]>;
    duplicateDescriptions: Map<string, string[]>;
    tooLongTitles: string[];
    tooShortDescriptions: string[];
    missingCanonical: string[];
    missingOgImage: string[];
  };
}

/**
 * Run a full SEO audit on all configured pages
 */
export function runSeoAudit(): AuditReport {
  const results: AuditResult[] = [];
  const allIssues: AuditIssue[] = [];

  // Track duplicates
  const titleMap = new Map<string, string[]>();
  const descriptionMap = new Map<string, string[]>();

  // Summary collections
  const missingTitles: string[] = [];
  const missingDescriptions: string[] = [];
  const missingKeywords: string[] = [];
  const tooLongTitles: string[] = [];
  const tooShortDescriptions: string[] = [];
  const missingCanonical: string[] = [];
  const missingOgImage: string[] = [];

  // Audit each configured page
  for (const [pagePath, pageConfig] of Object.entries(pagesSeoConfig)) {
    const pageIssues: AuditIssue[] = [];

    // Skip non-indexable pages from certain audits
    const _isIndexable = shouldIndex(pagePath);

    // Validate metadata
    const validation = validateMetadata({
      title: pageConfig.title,
      description: pageConfig.description,
      keywords: pageConfig.keywords,
    });

    // Add validation errors
    for (const error of validation.errors) {
      pageIssues.push({
        page: pagePath,
        severity: "error",
        message: error,
      });
    }

    // Add validation warnings
    for (const warning of validation.warnings) {
      pageIssues.push({
        page: pagePath,
        severity: "warning",
        message: warning,
      });
    }

    // Track titles for duplicate detection
    if (pageConfig.title) {
      const normalizedTitle = pageConfig.title.toLowerCase().trim();
      if (!titleMap.has(normalizedTitle)) {
        titleMap.set(normalizedTitle, []);
      }
      titleMap.get(normalizedTitle)!.push(pagePath);
    } else {
      missingTitles.push(pagePath);
    }

    // Track descriptions for duplicate detection
    if (pageConfig.description) {
      const normalizedDesc = pageConfig.description.toLowerCase().trim();
      if (!descriptionMap.has(normalizedDesc)) {
        descriptionMap.set(normalizedDesc, []);
      }
      descriptionMap.get(normalizedDesc)!.push(pagePath);
    } else {
      missingDescriptions.push(pagePath);
    }

    // Check keywords
    if (!pageConfig.keywords || pageConfig.keywords.length === 0) {
      missingKeywords.push(pagePath);
      pageIssues.push({
        page: pagePath,
        severity: "warning",
        message: "No keywords defined for this page",
        suggestion: "Add relevant keywords to improve discoverability",
      });
    }

    // Check for long titles
    if (pageConfig.title && pageConfig.title.length > seoConfig.audit.titleMaxLength) {
      tooLongTitles.push(pagePath);
    }

    // Check for short descriptions
    if (
      pageConfig.description &&
      pageConfig.description.length < seoConfig.audit.descriptionMinLength
    ) {
      tooShortDescriptions.push(pagePath);
    }

    // Calculate page score (0-100)
    let score = 100;
    for (const issue of pageIssues) {
      if (issue.severity === "error") score -= 20;
      else if (issue.severity === "warning") score -= 5;
    }
    score = Math.max(0, score);

    results.push({
      page: pagePath,
      title: pageConfig.title,
      description: pageConfig.description,
      keywords: pageConfig.keywords,
      issues: pageIssues,
      score,
    });

    allIssues.push(...pageIssues);
  }

  // Find duplicates
  const duplicateTitles = new Map<string, string[]>();
  for (const [title, pages] of titleMap) {
    if (pages.length > 1) {
      duplicateTitles.set(title, pages);
      for (const page of pages) {
        allIssues.push({
          page,
          severity: "warning",
          message: `Duplicate title found across ${pages.length} pages`,
          suggestion: "Each page should have a unique title for better SEO",
        });
      }
    }
  }

  const duplicateDescriptions = new Map<string, string[]>();
  for (const [desc, pages] of descriptionMap) {
    if (pages.length > 1) {
      duplicateDescriptions.set(desc, pages);
      for (const page of pages) {
        allIssues.push({
          page,
          severity: "warning",
          message: `Duplicate description found across ${pages.length} pages`,
          suggestion: "Each page should have a unique description for better SEO",
        });
      }
    }
  }

  // Count issues by severity
  const errorCount = allIssues.filter((i) => i.severity === "error").length;
  const warningCount = allIssues.filter((i) => i.severity === "warning").length;
  const infoCount = allIssues.filter((i) => i.severity === "info").length;

  // Calculate overall score
  const overallScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

  return {
    timestamp: new Date().toISOString(),
    totalPages: results.length,
    pagesWithIssues: results.filter((r) => r.issues.length > 0).length,
    totalIssues: allIssues.length,
    errorCount,
    warningCount,
    infoCount,
    overallScore,
    results,
    summary: {
      missingTitles,
      missingDescriptions,
      missingKeywords,
      duplicateTitles,
      duplicateDescriptions,
      tooLongTitles,
      tooShortDescriptions,
      missingCanonical,
      missingOgImage,
    },
  };
}

/**
 * Generate a human-readable audit report
 */
export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [];

  lines.push("═".repeat(60));
  lines.push("  SEO AUDIT REPORT");
  lines.push("═".repeat(60));
  lines.push(`  Generated: ${report.timestamp}`);
  lines.push(`  Overall Score: ${report.overallScore}/100`);
  lines.push("");

  // Summary
  lines.push("─".repeat(60));
  lines.push("  SUMMARY");
  lines.push("─".repeat(60));
  lines.push(`  Total Pages Audited: ${report.totalPages}`);
  lines.push(`  Pages with Issues: ${report.pagesWithIssues}`);
  lines.push(`  Total Issues: ${report.totalIssues}`);
  lines.push(`    • Errors: ${report.errorCount}`);
  lines.push(`    • Warnings: ${report.warningCount}`);
  lines.push(`    • Info: ${report.infoCount}`);
  lines.push("");

  // Critical Issues
  if (report.errorCount > 0) {
    lines.push("─".repeat(60));
    lines.push("  🔴 CRITICAL ISSUES");
    lines.push("─".repeat(60));
    for (const result of report.results) {
      const errors = result.issues.filter((i) => i.severity === "error");
      if (errors.length > 0) {
        lines.push(`  ${result.page}:`);
        for (const error of errors) {
          lines.push(`    ❌ ${error.message}`);
          if (error.suggestion) {
            lines.push(`       💡 ${error.suggestion}`);
          }
        }
      }
    }
    lines.push("");
  }

  // Warnings
  if (report.warningCount > 0) {
    lines.push("─".repeat(60));
    lines.push("  🟡 WARNINGS");
    lines.push("─".repeat(60));
    for (const result of report.results) {
      const warnings = result.issues.filter((i) => i.severity === "warning");
      if (warnings.length > 0) {
        lines.push(`  ${result.page}:`);
        for (const warning of warnings) {
          lines.push(`    ⚠️  ${warning.message}`);
          if (warning.suggestion) {
            lines.push(`       💡 ${warning.suggestion}`);
          }
        }
      }
    }
    lines.push("");
  }

  // Duplicate Content
  if (report.summary.duplicateTitles.size > 0) {
    lines.push("─".repeat(60));
    lines.push("  📝 DUPLICATE TITLES");
    lines.push("─".repeat(60));
    for (const [title, pages] of report.summary.duplicateTitles) {
      lines.push(`  "${title.substring(0, 50)}..."`);
      for (const page of pages) {
        lines.push(`    • ${page}`);
      }
    }
    lines.push("");
  }

  if (report.summary.duplicateDescriptions.size > 0) {
    lines.push("─".repeat(60));
    lines.push("  📝 DUPLICATE DESCRIPTIONS");
    lines.push("─".repeat(60));
    for (const [desc, pages] of report.summary.duplicateDescriptions) {
      lines.push(`  "${desc.substring(0, 50)}..."`);
      for (const page of pages) {
        lines.push(`    • ${page}`);
      }
    }
    lines.push("");
  }

  // Page Scores
  lines.push("─".repeat(60));
  lines.push("  📊 PAGE SCORES");
  lines.push("─".repeat(60));

  const sortedResults = [...report.results].sort((a, b) => a.score - b.score);
  for (const result of sortedResults) {
    const scoreEmoji =
      result.score >= 90 ? "🟢" : result.score >= 70 ? "🟡" : "🔴";
    lines.push(`  ${scoreEmoji} ${result.score}/100  ${result.page}`);
  }

  lines.push("");
  lines.push("═".repeat(60));
  lines.push("  END OF REPORT");
  lines.push("═".repeat(60));

  return lines.join("\n");
}

/**
 * Check if the audit passes minimum requirements
 */
export function auditPasses(
  report: AuditReport,
  options?: { maxErrors?: number; minScore?: number }
): boolean {
  const { maxErrors = 0, minScore = 70 } = options || {};

  return report.errorCount <= maxErrors && report.overallScore >= minScore;
}

/**
 * Get SEO recommendations based on audit results
 */
export function getSeoRecommendations(report: AuditReport): string[] {
  const recommendations: string[] = [];

  if (report.summary.missingTitles.length > 0) {
    recommendations.push(
      `Add titles to ${report.summary.missingTitles.length} page(s): ${report.summary.missingTitles.join(", ")}`
    );
  }

  if (report.summary.missingDescriptions.length > 0) {
    recommendations.push(
      `Add descriptions to ${report.summary.missingDescriptions.length} page(s): ${report.summary.missingDescriptions.join(", ")}`
    );
  }

  if (report.summary.tooLongTitles.length > 0) {
    recommendations.push(
      `Shorten titles on ${report.summary.tooLongTitles.length} page(s) to under ${seoConfig.audit.titleMaxLength} characters`
    );
  }

  if (report.summary.tooShortDescriptions.length > 0) {
    recommendations.push(
      `Expand descriptions on ${report.summary.tooShortDescriptions.length} page(s) to at least ${seoConfig.audit.descriptionMinLength} characters`
    );
  }

  if (report.summary.duplicateTitles.size > 0) {
    recommendations.push(
      `Create unique titles for ${report.summary.duplicateTitles.size} group(s) of pages with duplicate titles`
    );
  }

  if (report.summary.duplicateDescriptions.size > 0) {
    recommendations.push(
      `Create unique descriptions for ${report.summary.duplicateDescriptions.size} group(s) of pages with duplicate descriptions`
    );
  }

  if (report.summary.missingKeywords.length > 0) {
    recommendations.push(
      `Add keywords to ${report.summary.missingKeywords.length} page(s) for better search discoverability`
    );
  }

  return recommendations;
}
