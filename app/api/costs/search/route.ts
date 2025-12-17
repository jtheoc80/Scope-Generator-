import { NextRequest, NextResponse } from 'next/server';
import { oneBuildService } from '@/lib/services/onebuild';

export async function GET(request: NextRequest) {
  try {
    if (!oneBuildService.isConfigured()) {
      return NextResponse.json(
        { message: "Cost data service not configured" },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const term = searchParams.get('term');
    const zipcode = searchParams.get('zipcode');
    const type = searchParams.get('type');

    if (!term || !zipcode) {
      return NextResponse.json(
        { message: "term and zipcode are required" },
        { status: 400 }
      );
    }

    const sourceType = type as "MATERIAL" | "LABOR" | "EQUIPMENT" | "ASSEMBLY" | undefined;

    const result = await oneBuildService.searchSources(
      term,
      zipcode,
      sourceType
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error searching costs:", error);
    return NextResponse.json(
      { message: "Failed to search costs" },
      { status: 500 }
    );
  }
}
