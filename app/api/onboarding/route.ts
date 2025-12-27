import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';

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
    const { 
      phone, 
      companyName,
      companyAddress,
      businessSize, 
      referralSource, 
      primaryTrade,
      yearsInBusiness,
    } = body;
    
    // Validate required fields
    if (!companyName || !companyAddress || !primaryTrade) {
      return NextResponse.json(
        { message: 'Company name, address, and primary trade are required' },
        { status: 400 }
      );
    }
    
    // Parse yearsInBusiness to number if provided
    const yearsInBusinessNum = yearsInBusiness 
      ? parseInt(yearsInBusiness, 10) 
      : undefined;
    
    const user = await storage.completeOnboarding(userId, {
      phone,
      companyName,
      companyAddress,
      businessSize,
      referralSource,
      primaryTrade,
      yearsInBusiness: yearsInBusinessNum,
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { message: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
