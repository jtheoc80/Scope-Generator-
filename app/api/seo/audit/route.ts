/**
 * SEO Audit API Endpoint
 * Returns the current SEO audit report for the site.
 */

import { NextResponse } from "next/server";
import { runSeoAudit, getSeoRecommendations } from "@/lib/seo/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = runSeoAudit();
    const recommendations = getSeoRecommendations(report);

    // Convert Maps to objects for JSON serialization
    const serializedReport = {
      ...report,
      summary: {
        ...report.summary,
        duplicateTitles: Object.fromEntries(report.summary.duplicateTitles),
        duplicateDescriptions: Object.fromEntries(report.summary.duplicateDescriptions),
      },
      recommendations,
    };

    return NextResponse.json(serializedReport);
  } catch (error) {
    console.error("SEO Audit error:", error);
    return NextResponse.json(
      { error: "Failed to run SEO audit" },
      { status: 500 }
    );
  }
}
