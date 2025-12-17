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
    const name = searchParams.get('name');
    const zipcode = searchParams.get('zipcode');

    if (!name || !zipcode) {
      return NextResponse.json(
        { message: "name and zipcode are required" },
        { status: 400 }
      );
    }

    const result = await oneBuildService.getMaterialCost(name, zipcode);

    if (result) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { message: "Material not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching material cost:", error);
    return NextResponse.json(
      { message: "Failed to fetch material cost" },
      { status: 500 }
    );
  }
}
