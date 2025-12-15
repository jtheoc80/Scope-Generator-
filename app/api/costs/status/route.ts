import { NextResponse } from 'next/server';
import { oneBuildService } from '@/lib/services/onebuild';

export async function GET() {
  try {
    const isConfigured = oneBuildService.isConfigured();
    
    return NextResponse.json({
      available: isConfigured,
      message: isConfigured 
        ? "1build pricing data is available" 
        : "1build API key not configured",
    });
  } catch (error) {
    console.error('Error checking cost service status:', error);
    return NextResponse.json({
      available: false,
      message: "Error checking service status",
    });
  }
}
