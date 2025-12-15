import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { aiService } from '@/lib/services/aiService';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobTypeName, baseScope, clientName, address, jobNotes } = body;

    if (!jobTypeName || !baseScope || !Array.isArray(baseScope)) {
      return NextResponse.json(
        { message: 'jobTypeName and baseScope array are required' },
        { status: 400 }
      );
    }

    const result = await aiService.enhanceScope({
      jobTypeName,
      baseScope,
      clientName,
      address,
      jobNotes,
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          enhancedScope: result.enhancedScope,
          error: result.error,
        },
        { status: 200 } // Return 200 with error info so client can show feedback
      );
    }

    return NextResponse.json({ 
      enhancedScope: result.enhancedScope,
      success: true,
    });
  } catch (error) {
    console.error('Error enhancing scope:', error);
    return NextResponse.json(
      { 
        message: 'Failed to enhance scope',
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        }
      },
      { status: 500 }
    );
  }
}
