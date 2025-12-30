import { NextResponse } from 'next/server';
import { oneBuildService } from '@/lib/services/onebuild';

export async function GET() {
  return NextResponse.json({
    available: oneBuildService.isConfigured(),
    message: oneBuildService.isConfigured()
      ? "Cost data API is available"
      : "Cost data API key not configured"
  });
}
