import { NextResponse } from 'next/server';
import { oneBuildService } from '@/lib/services/onebuild';

export async function GET() {
  return NextResponse.json({
    available: oneBuildService.isConfigured(),
    message: oneBuildService.isConfigured()
      ? "1build cost data API is available"
      : "1build external API key not configured"
  });
}
