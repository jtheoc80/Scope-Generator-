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
    const type = searchParams.get('type');
    const zipcode = searchParams.get('zipcode');

    if (!type || !zipcode) {
      return NextResponse.json(
        { message: "type and zipcode are required" },
        { status: 400 }
      );
    }

    const result = await oneBuildService.getLaborRate(type, zipcode);

    if (result) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { message: "Labor rate not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching labor rate:", error);
    return NextResponse.json(
      { message: "Failed to fetch labor rate" },
      { status: 500 }
    );
  }
}
