import { NextRequest, NextResponse } from 'next/server';
import { getEmailRecords, getAllEmailRecords, isQAEmailSinkEnabled } from '@/lib/services/qaEmailSink';

/**
 * QA Email Records API - For E2E tests to verify email sending.
 * 
 * Only available when QA_EMAIL_SINK=file or in test mode.
 */

export async function GET(request: NextRequest) {
  // Guard: Only available in QA mode
  if (!isQAEmailSinkEnabled()) {
    return NextResponse.json(
      { error: 'QA email sink not enabled' },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const runId = searchParams.get('runId');

  try {
    const records = runId ? getEmailRecords(runId) : getAllEmailRecords();
    
    return NextResponse.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error('Error fetching email records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email records' },
      { status: 500 }
    );
  }
}
