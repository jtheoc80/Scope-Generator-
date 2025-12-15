import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { storage } from '@/lib/services/storage';

export async function PATCH(request: NextRequest) {
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
      companyName, 
      companyAddress, 
      companyPhone, 
      companyLogo, 
      licenseNumber, 
      priceMultiplier, 
      tradeMultipliers, 
      selectedTrades 
    } = body;
    
    // Validate priceMultiplier is within valid range (25-200)
    let validatedPriceMultiplier = priceMultiplier;
    if (priceMultiplier !== undefined) {
      if (typeof priceMultiplier !== 'number' || priceMultiplier < 25 || priceMultiplier > 200) {
        return NextResponse.json(
          { message: 'Price multiplier must be a number between 25 and 200' },
          { status: 400 }
        );
      }
      validatedPriceMultiplier = Math.round(priceMultiplier);
    }
    
    // Validate tradeMultipliers if provided
    let validatedTradeMultipliers = tradeMultipliers;
    if (tradeMultipliers !== undefined && typeof tradeMultipliers === 'object') {
      validatedTradeMultipliers = {};
      for (const [tradeId, multiplier] of Object.entries(tradeMultipliers)) {
        if (typeof multiplier === 'number' && multiplier >= 50 && multiplier <= 150) {
          validatedTradeMultipliers[tradeId] = Math.round(multiplier);
        }
      }
    }
    
    const user = await storage.updateCompanyProfile(userId, {
      companyName,
      companyAddress,
      companyPhone,
      companyLogo,
      licenseNumber,
      priceMultiplier: validatedPriceMultiplier,
      tradeMultipliers: validatedTradeMultipliers,
      selectedTrades,
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating company profile:', error);
    return NextResponse.json(
      { message: 'Failed to update company profile' },
      { status: 500 }
    );
  }
}
